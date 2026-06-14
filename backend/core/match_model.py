"""
match_model.py — Modelo de predicción de partido individual.

Combina el índice de fuerza estructural con ajustes contextuales (localía,
clima, tipo de partido, altitud, historial H2H) para derivar goles esperados
(xG) por equipo y calcular probabilidades de resultado 1X2 y distribución
completa de marcadores via modelo Poisson bivariado + simulación Monte Carlo.

Metodología:
1. Ajustar fuerza estructural con factores contextuales → fuerza ajustada por equipo
2. Diferencia de fuerzas → lambda (goles esperados) via función lineal calibrada
3. Distribución de Poisson independiente por equipo → P(goles_A = i, goles_B = j)
4. Monte Carlo (N=50,000 por defecto) para robustecer y modelar correlaciones
"""

import json
import math
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.stats import poisson
from scipy.special import iv as bessel_i  # Para distribución de Skellam
from typing import Optional, Tuple
from collections import defaultdict

from .strength_model import (
    load_weights, load_teams, get_team_strength, compute_structural_strength
)

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"


def load_venues() -> pd.DataFrame:
    """Carga venues.csv ignorando comentarios."""
    venues_path = DATA_DIR / "venues.csv"
    df = pd.read_csv(venues_path, comment="#")
    df.columns = df.columns.str.strip()
    return df


def load_h2h() -> pd.DataFrame:
    """Carga historial head-to-head."""
    h2h_path = DATA_DIR / "h2h_history.csv"
    df = pd.read_csv(h2h_path, comment="#")
    df.columns = df.columns.str.strip()
    return df


def get_home_advantage(match_type: str, weights: dict) -> float:
    """Retorna el bonus de localía según tipo de partido."""
    ha = weights.get("home_advantage", {})
    return ha.get(match_type, ha.get("amistoso", 0.05))


def climate_adjustment(team_temp: float, venue_temp: float, weights: dict) -> float:
    """
    Calcula penalización/bonus climático.
    Si el equipo está acostumbrado a temperatura similar a la sede: sin penalización.
    Diferencia > 0: penalización proporcional a la diferencia.
    """
    diff = abs(team_temp - venue_temp)
    penalty_per_degree = weights["climate_penalty"]["per_degree_difference"]
    max_penalty = weights["climate_penalty"]["max_penalty"]
    return min(diff * penalty_per_degree, max_penalty)


def altitude_adjustment(team_avg_altitude: float, venue_altitude: float, weights: dict) -> float:
    """
    Penaliza a equipos no acostumbrados a la altitud cuando la sede está en altura.
    Solo aplica si la sede está por encima del umbral configurado.
    """
    alt_cfg = weights.get("altitude_penalty", {})
    threshold = alt_cfg.get("threshold_meters", 1500)
    penalty_per_100m = alt_cfg.get("penalty_per_100m_above", 0.008)

    if venue_altitude <= threshold:
        return 0.0

    excess = venue_altitude - threshold
    # Equipos de alta altitud (como Bolivia) no sufren esta penalización
    if team_avg_altitude > threshold * 0.7:
        return 0.0

    return min((excess / 100) * penalty_per_100m, 0.20)


def compute_h2h_adjustment(
    team_a_code: str,
    team_b_code: str,
    weights: dict,
    max_matches: int = 10
) -> Tuple[float, float]:
    """
    Calcula ajuste basado en historial H2H reciente.

    Returns:
        Tuple (adj_a, adj_b): ajuste relativo de fuerza para cada equipo [-0.1, 0.1]
    """
    h2h_cfg = weights.get("h2h_weight", {})
    h2h_w = h2h_cfg.get("value", 0.15)
    decay = h2h_cfg.get("recency_decay", 0.85)

    try:
        df = load_h2h()
    except Exception:
        return 0.0, 0.0

    # Filtrar partidos entre los dos equipos (en cualquier orden)
    mask = (
        ((df["team_a"].str.upper() == team_a_code.upper()) &
         (df["team_b"].str.upper() == team_b_code.upper())) |
        ((df["team_a"].str.upper() == team_b_code.upper()) &
         (df["team_b"].str.upper() == team_a_code.upper()))
    )
    h2h = df[mask].copy()

    if h2h.empty:
        return 0.0, 0.0

    # Ordenar por fecha descendente y tomar los últimos N partidos
    h2h["date"] = pd.to_datetime(h2h["date"], errors="coerce")
    h2h = h2h.sort_values("date", ascending=False).head(max_matches)

    wins_a, wins_b, draws = 0.0, 0.0, 0.0
    weight_total = 0.0

    for i, (_, row) in enumerate(h2h.iterrows()):
        w = decay ** i  # Más peso a partidos recientes
        weight_total += w

        # Normalizar: siempre desde perspectiva de team_a
        if row["team_a"].upper() == team_a_code.upper():
            ga, gb = row["goals_a"], row["goals_b"]
        else:
            ga, gb = row["goals_b"], row["goals_a"]

        if ga > gb:
            wins_a += w
        elif gb > ga:
            wins_b += w
        else:
            draws += w

    if weight_total == 0:
        return 0.0, 0.0

    win_rate_a = wins_a / weight_total
    win_rate_b = wins_b / weight_total
    # Diferencia neta de rendimiento H2H
    net = (win_rate_a - win_rate_b) * h2h_w

    return round(net, 4), round(-net, 4)


def strength_to_xg(
    strength: float,
    opponent_strength: float,
    weights: dict
) -> float:
    """
    Convierte la fuerza relativa en goles esperados (xG).

    Usa una función lineal calibrada: xG = base + slope * (fuerza_relativa)
    donde fuerza_relativa = fuerza_propia / (fuerza_propia + fuerza_oponente) * 2 - 1
    esto mapea [-1, 1] donde 0 = equilibrio.
    """
    cfg = weights["xg_conversion"]
    base = cfg["base_goals_per_match"]
    slope = cfg["strength_to_xg_slope"]
    min_xg = cfg["min_xg"]
    max_xg = cfg["max_xg"]

    total = strength + opponent_strength
    if total <= 0:
        relative = 0.0
    else:
        relative = (strength / total) * 2 - 1  # [-1, 1]

    xg = base + slope * relative
    return float(np.clip(xg, min_xg, max_xg))


def compute_adjusted_strength(
    team_info: dict,
    opponent_info: dict,
    venue_row: Optional[pd.Series],
    match_type: str,
    is_home: bool,
    weights: dict,
    h2h_adj: float = 0.0
) -> float:
    """
    Ajusta la fuerza estructural del equipo con factores contextuales.

    Factores aplicados:
    - Localía (bonus si juega en casa o cerca)
    - Diferencia climática (penalización)
    - Altitud de la sede (penalización)
    - Historial H2H
    - Peso de forma reciente vs factores estructurales según tipo de partido
    """
    base = team_info["structural_strength"]

    # --- Localía ---
    home_bonus = 0.0
    if is_home:
        home_bonus = get_home_advantage(match_type, weights)

    # --- Clima ---
    team_temp = team_info["raw_data"]["avg_temp_celsius"]
    venue_temp = float(venue_row["avg_temp_june_celsius"]) if venue_row is not None else team_temp
    climate_pen = climate_adjustment(team_temp, venue_temp, weights)

    # --- Altitud ---
    venue_altitude = float(venue_row["altitude_m"]) if venue_row is not None else 0.0
    # Estimación de altitud promedio del equipo (no tenemos dato exacto en teams.csv,
    # usamos proxy: equipos sudamericanos de montaña = 2000m, resto = 0m)
    team_altitude_proxy = {
        "BOL": 3640, "ECU": 2850, "COL": 1600, "PER": 1200,
        "ARG": 200, "CHI": 200,
    }.get(team_info["code"], 0)
    altitude_pen = altitude_adjustment(team_altitude_proxy, venue_altitude, weights)

    # --- Varianza por tipo de partido ---
    # La varianza no modifica la fuerza directamente, se usa en la simulación

    # --- Ajuste final ---
    adjusted = base + home_bonus - climate_pen - altitude_pen + h2h_adj
    return max(adjusted, 0.05)  # Fuerza mínima


def compute_score_matrix(lambda_a: float, lambda_b: float, max_goals: int = 10) -> np.ndarray:
    """
    Calcula la matriz de probabilidades P(goles_A=i, goles_B=j) usando
    distribuciones de Poisson independientes.

    Args:
        lambda_a: Goles esperados equipo A.
        lambda_b: Goles esperados equipo B.
        max_goals: Máximo de goles por equipo a considerar.

    Returns:
        Matriz (max_goals+1, max_goals+1) con probabilidades de cada marcador.
    """
    probs_a = np.array([poisson.pmf(i, lambda_a) for i in range(max_goals + 1)])
    probs_b = np.array([poisson.pmf(i, lambda_b) for i in range(max_goals + 1)])
    # Producto exterior: independencia de los dos Poisson
    matrix = np.outer(probs_a, probs_b)
    # Renormalizar para que sume 1.0 (por el truncamiento en max_goals)
    return matrix / matrix.sum()


def matrix_to_1x2(score_matrix: np.ndarray) -> dict:
    """Convierte la matriz de marcadores en probabilidades 1X2."""
    n = score_matrix.shape[0]
    p_home = 0.0
    p_draw = 0.0
    p_away = 0.0
    for i in range(n):
        for j in range(n):
            p = score_matrix[i, j]
            if i > j:
                p_home += p
            elif i == j:
                p_draw += p
            else:
                p_away += p
    total = p_home + p_draw + p_away
    return {
        "home_win": round(p_home / total, 4),
        "draw": round(p_draw / total, 4),
        "away_win": round(p_away / total, 4),
    }


def top_scores(score_matrix: np.ndarray, n: int = 5) -> list:
    """Retorna los N marcadores más probables con sus probabilidades."""
    n_goals = score_matrix.shape[0]
    scores = []
    for i in range(n_goals):
        for j in range(n_goals):
            scores.append({"score_a": i, "score_b": j, "probability": float(score_matrix[i, j])})
    scores.sort(key=lambda x: x["probability"], reverse=True)
    return scores[:n]


def run_monte_carlo(
    lambda_a: float,
    lambda_b: float,
    match_type: str,
    weights: dict,
    seed: Optional[int] = None
) -> dict:
    """
    Simulación Monte Carlo para robustecer probabilidades.

    Introduce varianza adicional por tipo de partido (amistosos son más
    impredecibles que partidos de Mundial).

    Returns:
        Dict con probabilidades 1X2 y estadísticas de simulación.
    """
    cfg = weights["monte_carlo"]
    n_iter = cfg.get("iterations", 50000)
    random_seed = seed if seed is not None else cfg.get("random_seed", 42)

    variance_factor = weights["match_type_variance"].get(match_type, 1.0)
    rng = np.random.default_rng(random_seed)

    # Para cada iteración, muestreamos lambda con ruido para modelar incertidumbre
    # del modelo y la varianza natural del partido
    lambda_noise_std = 0.15 * variance_factor  # 15% de ruido base, escalado por tipo

    wins_a = 0
    draws = 0
    wins_b = 0
    total_goals_a = []
    total_goals_b = []

    for _ in range(n_iter):
        # Lambda con ruido multiplicativo lognormal
        la = max(lambda_a * rng.lognormal(0, lambda_noise_std), 0.05)
        lb = max(lambda_b * rng.lognormal(0, lambda_noise_std), 0.05)

        ga = rng.poisson(la)
        gb = rng.poisson(lb)

        total_goals_a.append(ga)
        total_goals_b.append(gb)

        if ga > gb:
            wins_a += 1
        elif ga == gb:
            draws += 1
        else:
            wins_b += 1

    goals_a_arr = np.array(total_goals_a)
    goals_b_arr = np.array(total_goals_b)

    return {
        "probabilities_1x2": {
            "home_win": round(wins_a / n_iter, 4),
            "draw": round(draws / n_iter, 4),
            "away_win": round(wins_b / n_iter, 4),
        },
        "expected_goals": {
            "team_a": round(float(np.mean(goals_a_arr)), 3),
            "team_b": round(float(np.mean(goals_b_arr)), 3),
        },
        "goal_std": {
            "team_a": round(float(np.std(goals_a_arr)), 3),
            "team_b": round(float(np.std(goals_b_arr)), 3),
        },
        "iterations": n_iter,
    }


def predict_match(
    team_a: str,
    team_b: str,
    venue_name: str = "Sede Neutral",
    match_type: str = "amistoso",
    team_a_is_home: bool = False,
    weights: Optional[dict] = None
) -> dict:
    """
    Función principal de predicción de partido.

    Args:
        team_a: Nombre o código ISO del equipo local/favorito.
        team_b: Nombre o código ISO del equipo visitante.
        venue_name: Nombre de la sede (debe existir en venues.csv).
        match_type: Tipo de partido: 'mundial'|'clasificatoria'|'amistoso'|
                    'torneo_continental'|'nations_league'
        team_a_is_home: True si el equipo A juega de local.
        weights: Pesos del modelo (opcional, carga de JSON si None).

    Returns:
        Dict completo con probabilidades, xG, marcadores y metadatos.
    """
    if weights is None:
        weights = load_weights()

    # --- Cargar datos ---
    teams_df = load_teams()
    venues_df = load_venues()

    # Buscar equipos
    def find_team(name_or_code: str) -> dict:
        from .strength_model import get_team_strength
        return get_team_strength(name_or_code, weights)

    team_a_info = find_team(team_a)
    team_b_info = find_team(team_b)

    # Buscar sede
    venue_mask = venues_df["name"].str.lower() == venue_name.lower()
    venue_row = venues_df[venue_mask].iloc[0] if venue_mask.any() else None

    if venue_row is None:
        # Sede neutral por defecto
        neutral_mask = venues_df["name"].str.lower() == "sede neutral"
        venue_row = venues_df[neutral_mask].iloc[0] if neutral_mask.any() else None

    # --- Ajuste H2H ---
    h2h_adj_a, h2h_adj_b = compute_h2h_adjustment(
        team_a_info["code"], team_b_info["code"], weights
    )

    # --- Determinar localía ---
    # Si la sede está en el país del equipo A → es local
    if venue_row is not None and not team_a_is_home:
        venue_country = str(venue_row.get("country", "")).lower()
        team_a_is_home = team_a_info["code"].lower() in venue_country or \
                         team_a_info["name"].lower() in venue_country

    team_b_is_home = not team_a_is_home and (
        team_b_info["code"].lower() in str(venue_row.get("country", "")).lower()
        if venue_row is not None else False
    )

    # --- Calcular fuerza ajustada ---
    adj_strength_a = compute_adjusted_strength(
        team_a_info, team_b_info, venue_row, match_type,
        is_home=team_a_is_home, weights=weights, h2h_adj=h2h_adj_a
    )
    adj_strength_b = compute_adjusted_strength(
        team_b_info, team_a_info, venue_row, match_type,
        is_home=team_b_is_home, weights=weights, h2h_adj=h2h_adj_b
    )

    # --- Calcular xG ---
    xg_a = strength_to_xg(adj_strength_a, adj_strength_b, weights)
    xg_b = strength_to_xg(adj_strength_b, adj_strength_a, weights)

    # --- Matriz de marcadores (Poisson analítico) ---
    score_matrix = compute_score_matrix(xg_a, xg_b, max_goals=10)
    probs_1x2_analytical = matrix_to_1x2(score_matrix)
    top_5_scores = top_scores(score_matrix, n=5)

    # --- Monte Carlo ---
    mc_results = run_monte_carlo(xg_a, xg_b, match_type, weights)

    # --- Combinar analítico + Monte Carlo (promedio ponderado) ---
    mc_weight = 0.6
    an_weight = 0.4
    combined_1x2 = {
        "home_win": round(
            mc_weight * mc_results["probabilities_1x2"]["home_win"] +
            an_weight * probs_1x2_analytical["home_win"], 4
        ),
        "draw": round(
            mc_weight * mc_results["probabilities_1x2"]["draw"] +
            an_weight * probs_1x2_analytical["draw"], 4
        ),
        "away_win": round(
            mc_weight * mc_results["probabilities_1x2"]["away_win"] +
            an_weight * probs_1x2_analytical["away_win"], 4
        ),
    }

    # Normalizar por si hay residuo de redondeo
    total_prob = sum(combined_1x2.values())
    combined_1x2 = {k: round(v / total_prob, 4) for k, v in combined_1x2.items()}

    # --- Marcador más probable ---
    most_likely_score = top_5_scores[0] if top_5_scores else {"score_a": 0, "score_b": 0, "probability": 0}

    # Información de contexto
    venue_info = {
        "name": str(venue_row["name"]) if venue_row is not None else "Sede Neutral",
        "country": str(venue_row["country"]) if venue_row is not None else "N/A",
        "temperature": float(venue_row["avg_temp_june_celsius"]) if venue_row is not None else 20.0,
        "altitude_m": float(venue_row["altitude_m"]) if venue_row is not None else 0.0,
    }

    return {
        "match": {
            "team_a": team_a_info["name"],
            "team_b": team_b_info["name"],
            "team_a_code": team_a_info["code"],
            "team_b_code": team_b_info["code"],
            "venue": venue_info,
            "match_type": match_type,
            "team_a_is_home": team_a_is_home,
        },
        "strengths": {
            "team_a_structural": round(team_a_info["structural_strength"], 4),
            "team_b_structural": round(team_b_info["structural_strength"], 4),
            "team_a_adjusted": round(adj_strength_a, 4),
            "team_b_adjusted": round(adj_strength_b, 4),
            "team_a_h2h_adj": h2h_adj_a,
            "team_b_h2h_adj": h2h_adj_b,
        },
        "expected_goals": {
            "team_a": round(xg_a, 3),
            "team_b": round(xg_b, 3),
        },
        "probabilities": combined_1x2,
        "probabilities_analytical": probs_1x2_analytical,
        "probabilities_monte_carlo": mc_results["probabilities_1x2"],
        "most_likely_score": most_likely_score,
        "top_scores": top_5_scores,
        "monte_carlo": {
            "iterations": mc_results["iterations"],
            "goal_std": mc_results["goal_std"],
        },
    }


if __name__ == "__main__":
    result = predict_match(
        team_a="Argentina",
        team_b="France",
        venue_name="Sede Neutral",
        match_type="mundial"
    )
    print("=== Argentina vs France (Mundial, Sede Neutral) ===")
    print(f"xG:          ARG {result['expected_goals']['team_a']} - {result['expected_goals']['team_b']} FRA")
    print(f"Probs 1X2:   ARG win {result['probabilities']['home_win']*100:.1f}% | "
          f"Draw {result['probabilities']['draw']*100:.1f}% | "
          f"FRA win {result['probabilities']['away_win']*100:.1f}%")
    print(f"Marcador más probable: {result['most_likely_score']}")
    print(f"Top 3 marcadores: {result['top_scores'][:3]}")
