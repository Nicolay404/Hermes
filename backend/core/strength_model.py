"""
strength_model.py — Cálculo del índice de fuerza estructural por selección.

Basado en el modelo de Klement (Liberum/Panmure, adaptado de Copa del Mundo 2014/2018/2022)
y en la investigación académica de Hoffmann, Ging & Ramasamy (2002).

PESOS POR DEFECTO (documentados según lo conocido públicamente del modelo de Klement):
- GDP per cápita: ~20% (con función de rendimientos decrecientes sobre $60k USD)
- Población * cultura futbolística: ~10%
- Ranking FIFA/Elo: ~40% (mayor peso en partidos competitivos)
- Fortaleza del plantel: ~30%

Estos pesos son aproximaciones; los pesos exactos del modelo de Klement no son públicos.
"""

import json
import math
import os
from pathlib import Path
import pandas as pd
import numpy as np
from typing import Optional

# Paths base
ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
CONFIG_DIR = ROOT / "config"


def load_weights() -> dict:
    """Carga los pesos del modelo desde config/model_weights.json."""
    weights_path = CONFIG_DIR / "model_weights.json"
    with open(weights_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_teams() -> pd.DataFrame:
    """Carga y limpia el CSV de equipos, ignorando líneas de comentario."""
    teams_path = DATA_DIR / "teams.csv"
    df = pd.read_csv(teams_path, comment="#")
    df.columns = df.columns.str.strip()
    return df


def gdp_factor(gdp_per_capita: float, threshold: float = 60000) -> float:
    """
    Convierte GDP per cápita en un factor de fuerza con rendimientos decrecientes.

    Por debajo del umbral: crecimiento aproximadamente lineal.
    Por encima del umbral: crecimiento logarítmico amortiguado.
    El umbral por defecto es $60,000 USD (Klement: a partir de ahí otros
    deportes compiten fuertemente con el fútbol por el talento joven).

    Escala de salida: [0, 1] aproximado (normalizado después en el cálculo conjunto).
    """
    if gdp_per_capita <= 0:
        return 0.0
    if gdp_per_capita <= threshold:
        # Crecimiento lineal normalizado
        return gdp_per_capita / threshold
    else:
        # Rendimientos decrecientes: log extra sobre el umbral
        excess = math.log(gdp_per_capita / threshold + 1) / math.log(4)
        return 1.0 + excess * 0.15  # Máximo bonus ~15% sobre el valor en umbral


def population_football_factor(population_millions: float, football_culture_index: float) -> float:
    """
    Factor de población ponderado por cultura futbolística.

    Una población grande en un país donde el fútbol no es deporte dominante
    debe pesar menos que en un país donde el fútbol es el deporte rey.

    Escala: 0-1 (normalizado después).
    """
    # Peso de cultura: 0-100 → 0.0-1.0
    culture_weight = football_culture_index / 100.0
    # Población en escala logarítmica (para que India y China no dominen)
    pop_log = math.log10(max(population_millions, 0.1) + 1)
    # Normalizar respecto a un país "grande y futbolero" (ej. Brasil: 216M, cultura 99)
    reference = math.log10(216 + 1) * (99 / 100)
    return min((pop_log * culture_weight) / reference, 1.5)


def elo_factor(elo_points: float) -> float:
    """
    Convierte puntos Elo en factor de fuerza normalizado.

    Referencia: El Elo más alto históricamente (~2200) es 1.0
    El Elo mínimo considerado (~1600) es 0.0
    """
    min_elo = 1600.0
    max_elo = 2200.0
    normalized = (elo_points - min_elo) / (max_elo - min_elo)
    return max(0.0, min(1.0, normalized))


def squad_strength_factor(squad_strength_index: float) -> float:
    """Normaliza el índice de fortaleza del plantel (0-100) a escala 0-1."""
    return squad_strength_index / 100.0


def compute_structural_strength(
    team_row: pd.Series,
    weights: Optional[dict] = None,
    gdp_saturation: Optional[float] = None
) -> float:
    """
    Calcula el índice de fuerza estructural de un equipo combinando todos los factores.

    Args:
        team_row: Fila del DataFrame de equipos con las columnas requeridas.
        weights: Dict de pesos del modelo (de model_weights.json). Si None, los carga.
        gdp_saturation: Umbral GDP para rendimientos decrecientes.

    Returns:
        Índice de fuerza estructural [0.0, ~1.5] (puede superar 1.0 en equipos
        con GDP alto y cultura futbolística muy fuerte).
    """
    if weights is None:
        weights = load_weights()

    w = weights["structural_weights"]
    threshold = gdp_saturation or weights.get("gdp_saturation_threshold", 60000)

    f_gdp = gdp_factor(float(team_row["gdp_per_capita"]), threshold)
    f_pop = population_football_factor(
        float(team_row["population_millions"]),
        float(team_row["football_culture_index"])
    )
    f_elo = elo_factor(float(team_row["elo_points"]))
    f_squad = squad_strength_factor(float(team_row["squad_strength_index"]))

    strength = (
        w["gdp_per_capita"] * f_gdp
        + w["population_football"] * f_pop
        + w["fifa_elo_ranking"] * f_elo
        + w["squad_strength"] * f_squad
    )

    return round(strength, 6)


def get_team_strength(team_name_or_code: str, weights: Optional[dict] = None) -> dict:
    """
    Devuelve el índice de fuerza estructural y sus componentes para un equipo dado.

    Args:
        team_name_or_code: Nombre o código ISO del equipo (ej. "Argentina" o "ARG").
        weights: Pesos del modelo (opcional).

    Returns:
        Dict con strength y desglose de componentes.
    """
    df = load_teams()
    if weights is None:
        weights = load_weights()

    # Buscar por nombre o código
    mask = (df["name"].str.lower() == team_name_or_code.lower()) | \
           (df["code"].str.lower() == team_name_or_code.lower())
    matches = df[mask]

    if matches.empty:
        raise ValueError(f"Equipo no encontrado: '{team_name_or_code}'. "
                         f"Equipos disponibles: {list(df['name'].values)}")

    row = matches.iloc[0]
    threshold = weights.get("gdp_saturation_threshold", 60000)

    f_gdp = gdp_factor(float(row["gdp_per_capita"]), threshold)
    f_pop = population_football_factor(
        float(row["population_millions"]),
        float(row["football_culture_index"])
    )
    f_elo = elo_factor(float(row["elo_points"]))
    f_squad = squad_strength_factor(float(row["squad_strength_index"]))

    w = weights["structural_weights"]

    return {
        "name": row["name"],
        "code": row["code"],
        "structural_strength": compute_structural_strength(row, weights),
        "components": {
            "gdp_factor": round(f_gdp, 4),
            "gdp_weighted": round(w["gdp_per_capita"] * f_gdp, 4),
            "population_factor": round(f_pop, 4),
            "population_weighted": round(w["population_football"] * f_pop, 4),
            "elo_factor": round(f_elo, 4),
            "elo_weighted": round(w["fifa_elo_ranking"] * f_elo, 4),
            "squad_factor": round(f_squad, 4),
            "squad_weighted": round(w["squad_strength"] * f_squad, 4),
        },
        "raw_data": {
            "fifa_ranking": int(row["fifa_ranking"]),
            "elo_points": float(row["elo_points"]),
            "gdp_per_capita": float(row["gdp_per_capita"]),
            "population_millions": float(row["population_millions"]),
            "avg_temp_celsius": float(row["avg_temp_celsius"]),
            "football_culture_index": float(row["football_culture_index"]),
            "squad_strength_index": float(row["squad_strength_index"]),
            "confederation": row["confederation"],
        }
    }


def get_all_strengths(weights: Optional[dict] = None) -> list:
    """Devuelve el índice de fuerza estructural de todos los equipos, ordenados de mayor a menor."""
    df = load_teams()
    if weights is None:
        weights = load_weights()

    results = []
    for _, row in df.iterrows():
        s = compute_structural_strength(row, weights)
        results.append({"name": row["name"], "code": row["code"], "strength": s})

    return sorted(results, key=lambda x: x["strength"], reverse=True)


if __name__ == "__main__":
    # Test rápido
    print("=== Test de fuerza estructural ===")
    arg = get_team_strength("Argentina")
    fra = get_team_strength("France")
    print(f"Argentina: {arg['structural_strength']:.4f}")
    print(f"  Componentes: {arg['components']}")
    print(f"France:    {fra['structural_strength']:.4f}")
    print(f"  Componentes: {fra['components']}")
