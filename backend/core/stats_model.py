"""
stats_model.py — Derivación de estadísticas secundarias del partido.

A partir de los goles esperados (xG) de cada equipo, deriva distribuciones
probabilísticas para:
- Tiros totales (shots)
- Tiros a puerta (shots on target)
- Tiros de esquina (corners)
- Tarjetas amarillas y rojas
- Faltas
- Posesión aproximada

FUENTES Y SUPUESTOS DE RATIOS:
Los ratios se basan en promedios de datos de Opta/StatsBomb/FBRef para
partidos internacionales de alto nivel (Mundiales y torneos UEFA/CONMEBOL):
- Tiros por gol esperado: ~10-12 (rango típico: 8-15)
- Tiros a puerta: ~35-40% de los tiros totales
- Corners: ~4-6 por equipo por partido (correlaciona con ataque)
- Tarjetas amarillas: ~2-4 por partido total, más en partidos disputados
- Tarjetas rojas: ~0.15 por partido promedio
- Faltas: ~12-20 por equipo por partido
- Posesión: aproximada por ratio de fuerza ajustada

Nota: Estos son rangos estadísticos, no valores exactos. La aplicación los
presenta como distribuciones con percentiles 25-75.
"""

import numpy as np
from typing import Optional
from scipy.stats import norm, poisson


def shots_distribution(xg: float, rng: Optional[np.random.Generator] = None) -> dict:
    """
    Deriva tiros totales y a puerta a partir de xG.

    Relación base: ~10-12 tiros por gol esperado (promedio internacional).
    Se usa distribución Normal truncada para modelar varianza.

    Args:
        xg: Goles esperados del equipo.
        rng: Generador aleatorio (para reproducibilidad).

    Returns:
        Dict con estadísticas de tiros.
    """
    if rng is None:
        rng = np.random.default_rng(42)

    # Tiros totales: media = xg * 11, std = xg * 3.5
    shots_mean = xg * 11.0
    shots_std = xg * 3.5

    # Percentiles de distribución normal
    p25 = max(int(norm.ppf(0.25, shots_mean, shots_std)), 0)
    p50 = max(int(norm.ppf(0.50, shots_mean, shots_std)), 0)
    p75 = max(int(norm.ppf(0.75, shots_mean, shots_std)), 0)

    # Tiros a puerta: ~33-40% de los tiros totales
    sot_ratio_mean = 0.365
    sot_ratio_std = 0.07

    sot_mean = shots_mean * sot_ratio_mean
    sot_std = shots_std * sot_ratio_mean + shots_mean * sot_ratio_std

    sot_p25 = max(int(norm.ppf(0.25, sot_mean, sot_std)), 0)
    sot_p50 = max(int(norm.ppf(0.50, sot_mean, sot_std)), 0)
    sot_p75 = max(int(norm.ppf(0.75, sot_mean, sot_std)), 0)

    return {
        "shots_total": {
            "mean": round(shots_mean, 1),
            "p25": p25, "median": p50, "p75": p75,
            "range_display": f"{p25}–{p75}",
        },
        "shots_on_target": {
            "mean": round(sot_mean, 1),
            "p25": sot_p25, "median": sot_p50, "p75": sot_p75,
            "range_display": f"{sot_p25}–{sot_p75}",
        },
        "shot_accuracy_pct": round(sot_ratio_mean * 100, 1),
    }


def corners_distribution(xg: float) -> dict:
    """
    Estima corners a partir de xG.

    Correlación observada: equipos con más ataque generan más corners.
    Base: ~3.5 corners por xG + base de 2.0 corners mínimos.
    Fuente: Análisis de partidos de la UEFA Champions League y Mundiales FIFA 2014-2022.
    """
    corners_mean = 2.5 + 3.0 * xg
    corners_std = 2.0

    p25 = max(int(norm.ppf(0.25, corners_mean, corners_std)), 0)
    p50 = max(int(norm.ppf(0.50, corners_mean, corners_std)), 0)
    p75 = max(int(norm.ppf(0.75, corners_mean, corners_std)), 0)

    return {
        "mean": round(corners_mean, 1),
        "p25": p25, "median": p50, "p75": p75,
        "range_display": f"{p25}–{p75}",
    }


def cards_distribution(
    xg_team: float,
    xg_opponent: float,
    match_type: str = "amistoso"
) -> dict:
    """
    Estima tarjetas a partir de xG y tipo de partido.

    Observación: Partidos más parejos y competitivos → más tarjetas.
    La diferencia de xG es inversamente proporcional a las tarjetas
    (partidos muy desequilibrados → menos tensión → menos tarjetas).

    Datos de referencia (Mundiales 2014-2022):
    - Promedio tarjetas amarillas por equipo por partido: ~2.3
    - Promedio tarjetas rojas por equipo por partido: ~0.09
    """
    # Factor de competitividad: partidos equilibrados → más tarjetas
    balance = 1.0 - abs(xg_team - xg_opponent) / (xg_team + xg_opponent + 0.01)
    competitiveness = 0.6 + 0.8 * balance  # [0.6, 1.4]

    # Factor por tipo de partido
    type_factor = {
        "mundial": 1.2,
        "clasificatoria": 1.15,
        "torneo_continental": 1.1,
        "nations_league": 1.0,
        "amistoso": 0.75,
    }.get(match_type, 1.0)

    # Tarjetas amarillas
    yellow_mean = 2.3 * competitiveness * type_factor
    yellow_std = 1.2

    yellow_p25 = max(int(norm.ppf(0.25, yellow_mean, yellow_std)), 0)
    yellow_p50 = max(int(norm.ppf(0.50, yellow_mean, yellow_std)), 0)
    yellow_p75 = max(int(norm.ppf(0.75, yellow_mean, yellow_std)), 0)

    # Tarjetas rojas (distribución Poisson con lambda pequeño)
    red_lambda = 0.09 * competitiveness * type_factor
    red_p_zero = poisson.pmf(0, red_lambda)
    red_p_one = poisson.pmf(1, red_lambda)

    return {
        "yellow_cards": {
            "mean": round(yellow_mean, 2),
            "p25": yellow_p25, "median": yellow_p50, "p75": yellow_p75,
            "range_display": f"{yellow_p25}–{yellow_p75}",
        },
        "red_cards": {
            "lambda": round(red_lambda, 3),
            "prob_zero": round(red_p_zero, 3),
            "prob_one_or_more": round(1 - red_p_zero, 3),
            "range_display": f"0–1 ({round((1-red_p_zero)*100, 0):.0f}% chance)",
        },
    }


def fouls_distribution(
    xg_team: float,
    xg_opponent: float,
    match_type: str = "amistoso"
) -> dict:
    """
    Estima faltas cometidas.

    Observación: equipos defensivos (xG bajo) suelen cometer más faltas.
    Rango típico en partidos internacionales: 12-22 faltas por equipo.

    Fuente: Opta Sports / FBRef, Mundiales FIFA 2018-2022.
    """
    # Equipo con menos xG → más presión → más faltas
    defensive_pressure = max(0.5, 1.5 - (xg_team / (xg_opponent + 0.01)) * 0.5)

    type_factor = {
        "mundial": 1.1,
        "clasificatoria": 1.05,
        "torneo_continental": 1.0,
        "nations_league": 0.95,
        "amistoso": 0.85,
    }.get(match_type, 1.0)

    fouls_mean = 14.5 * defensive_pressure * type_factor
    fouls_std = 3.5

    p25 = max(int(norm.ppf(0.25, fouls_mean, fouls_std)), 5)
    p50 = max(int(norm.ppf(0.50, fouls_mean, fouls_std)), 5)
    p75 = max(int(norm.ppf(0.75, fouls_mean, fouls_std)), 5)

    return {
        "mean": round(fouls_mean, 1),
        "p25": p25, "median": p50, "p75": p75,
        "range_display": f"{p25}–{p75}",
    }


def possession_estimate(adj_strength_a: float, adj_strength_b: float) -> dict:
    """
    Estima la posesión aproximada basándose en la fuerza ajustada relativa.

    La posesión correlaciona con la calidad del equipo y el estilo de juego,
    pero no perfectamente. Presentamos como rango.

    Nota: Esta es una aproximación burda; la posesión real depende del estilo
    táctico del equipo, que no capturamos en este modelo.
    """
    total = adj_strength_a + adj_strength_b
    if total <= 0:
        poss_a = 0.5
    else:
        poss_a = adj_strength_a / total

    # Comprimir hacia el 50% (la posesión raramente es menos de 35% o más de 65%)
    # Compresión hacia la media: efecto regresivo
    poss_a_compressed = 0.5 + (poss_a - 0.5) * 0.6

    poss_a_pct = round(poss_a_compressed * 100, 1)
    poss_b_pct = round(100 - poss_a_pct, 1)

    # Rango ±5%
    return {
        "team_a": {
            "mean": poss_a_pct,
            "range_display": f"{max(poss_a_pct - 5, 25):.0f}%–{min(poss_a_pct + 5, 75):.0f}%",
        },
        "team_b": {
            "mean": poss_b_pct,
            "range_display": f"{max(poss_b_pct - 5, 25):.0f}%–{min(poss_b_pct + 5, 75):.0f}%",
        },
    }


def compute_match_stats(
    xg_a: float,
    xg_b: float,
    adj_strength_a: float,
    adj_strength_b: float,
    match_type: str = "amistoso"
) -> dict:
    """
    Función principal: calcula todas las estadísticas secundarias del partido.

    Args:
        xg_a: Goles esperados equipo A.
        xg_b: Goles esperados equipo B.
        adj_strength_a: Fuerza ajustada equipo A.
        adj_strength_b: Fuerza ajustada equipo B.
        match_type: Tipo de partido.

    Returns:
        Dict completo con todas las estadísticas por equipo y totales.
    """
    shots_a = shots_distribution(xg_a)
    shots_b = shots_distribution(xg_b)
    corners_a = corners_distribution(xg_a)
    corners_b = corners_distribution(xg_b)
    cards_a = cards_distribution(xg_a, xg_b, match_type)
    cards_b = cards_distribution(xg_b, xg_a, match_type)
    fouls_a = fouls_distribution(xg_a, xg_b, match_type)
    fouls_b = fouls_distribution(xg_b, xg_a, match_type)
    possession = possession_estimate(adj_strength_a, adj_strength_b)

    return {
        "team_a": {
            "shots_total": shots_a["shots_total"],
            "shots_on_target": shots_a["shots_on_target"],
            "corners": corners_a,
            "yellow_cards": cards_a["yellow_cards"],
            "red_cards": cards_a["red_cards"],
            "fouls": fouls_a,
            "possession": possession["team_a"],
            "xg": round(xg_a, 3),
        },
        "team_b": {
            "shots_total": shots_b["shots_total"],
            "shots_on_target": shots_b["shots_on_target"],
            "corners": corners_b,
            "yellow_cards": cards_b["yellow_cards"],
            "red_cards": cards_b["red_cards"],
            "fouls": fouls_b,
            "possession": possession["team_b"],
            "xg": round(xg_b, 3),
        },
        "totals": {
            "total_goals_expected": round(xg_a + xg_b, 3),
            "total_shots_expected": round(
                shots_a["shots_total"]["mean"] + shots_b["shots_total"]["mean"], 1
            ),
            "total_corners_expected": round(
                corners_a["mean"] + corners_b["mean"], 1
            ),
        },
        "match_type": match_type,
    }


if __name__ == "__main__":
    stats = compute_match_stats(
        xg_a=1.4, xg_b=1.1,
        adj_strength_a=0.78, adj_strength_b=0.72,
        match_type="mundial"
    )
    print("=== Stats de ejemplo (xG A=1.4, xG B=1.1, Mundial) ===")
    for team, label in [("team_a", "Equipo A"), ("team_b", "Equipo B")]:
        t = stats[team]
        print(f"\n{label}:")
        print(f"  Tiros: {t['shots_total']['range_display']} (media {t['shots_total']['mean']})")
        print(f"  A puerta: {t['shots_on_target']['range_display']}")
        print(f"  Corners: {t['corners']['range_display']}")
        print(f"  Amarillas: {t['yellow_cards']['range_display']}")
        print(f"  Rojas: {t['red_cards']['range_display']}")
        print(f"  Faltas: {t['fouls']['range_display']}")
        print(f"  Posesión: {t['possession']['range_display']}")
