"""
calibration.py — Recalibración de pesos del modelo usando resultados históricos reales.

Permite ajustar los pesos de model_weights.json mediante regresión simple
cuando el usuario provee un CSV con resultados históricos reales.

PROCESO:
1. Para cada partido histórico, predecir el resultado con los pesos actuales
2. Calcular el error (log-loss o Brier score) entre predicción y resultado real
3. Usar optimización (scipy.minimize) para encontrar pesos que minimicen el error
4. Retornar pesos sugeridos SIN sobrescribir automáticamente (requiere confirmación del usuario)

FORMATO CSV ESPERADO:
team_a, team_b, date, goals_a, goals_b, match_type, venue_name
(compatible con h2h_history.csv)
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional
from scipy.optimize import minimize
import io

ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIR = ROOT / "config"


def load_current_weights() -> dict:
    """Carga los pesos actuales del modelo."""
    weights_path = CONFIG_DIR / "model_weights.json"
    with open(weights_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_weights(weights: dict):
    """Guarda los pesos en el archivo de configuración."""
    weights_path = CONFIG_DIR / "model_weights.json"
    with open(weights_path, "w", encoding="utf-8") as f:
        json.dump(weights, f, indent=2, ensure_ascii=False)


def parse_historical_csv(csv_content: str) -> pd.DataFrame:
    """
    Parsea un CSV de resultados históricos.

    Formato esperado:
    team_a, team_b, date, goals_a, goals_b, match_type, venue_name

    Returns:
        DataFrame limpio o lanza ValueError con mensaje descriptivo.
    """
    try:
        # Ignorar líneas de comentario (#)
        lines = [l for l in csv_content.strip().split("\n") if not l.strip().startswith("#")]
        clean_csv = "\n".join(lines)
        df = pd.read_csv(io.StringIO(clean_csv))
        df.columns = df.columns.str.strip()

        required_cols = {"team_a", "team_b", "goals_a", "goals_b", "match_type"}
        missing = required_cols - set(df.columns)
        if missing:
            raise ValueError(
                f"El CSV no tiene las columnas requeridas: {missing}. "
                f"Columnas encontradas: {list(df.columns)}"
            )

        df["goals_a"] = pd.to_numeric(df["goals_a"], errors="coerce")
        df["goals_b"] = pd.to_numeric(df["goals_b"], errors="coerce")
        df = df.dropna(subset=["goals_a", "goals_b"])

        if "venue_name" not in df.columns:
            df["venue_name"] = "Sede Neutral"

        return df

    except Exception as e:
        raise ValueError(f"Error al parsear CSV: {str(e)}")


def compute_prediction_error(
    historical_df: pd.DataFrame,
    weights: dict,
    verbose: bool = False
) -> float:
    """
    Calcula el error promedio (Brier Score) entre predicciones y resultados reales.

    Brier Score = mean((p_real - p_pred)^2) para probabilidades 1X2.
    Score de 0.0 = perfecto, 0.333 = baseline aleatorio.

    Args:
        historical_df: DataFrame de resultados históricos.
        weights: Pesos del modelo a evaluar.
        verbose: Si True, imprime predicciones vs resultados.

    Returns:
        Brier Score promedio (menor = mejor).
    """
    from .match_model import predict_match

    errors = []
    skipped = 0

    for _, row in historical_df.iterrows():
        try:
            result = predict_match(
                team_a=str(row["team_a"]).strip(),
                team_b=str(row["team_b"]).strip(),
                venue_name=str(row.get("venue_name", "Sede Neutral")).strip(),
                match_type=str(row["match_type"]).strip(),
                weights=weights
            )

            p_home = result["probabilities"]["home_win"]
            p_draw = result["probabilities"]["draw"]
            p_away = result["probabilities"]["away_win"]

            ga = int(row["goals_a"])
            gb = int(row["goals_b"])

            # Resultado real en one-hot
            if ga > gb:
                real_home, real_draw, real_away = 1, 0, 0
            elif ga == gb:
                real_home, real_draw, real_away = 0, 1, 0
            else:
                real_home, real_draw, real_away = 0, 0, 1

            # Brier Score para este partido
            brier = (
                (p_home - real_home) ** 2 +
                (p_draw - real_draw) ** 2 +
                (p_away - real_away) ** 2
            ) / 3

            errors.append(brier)

            if verbose:
                print(f"  {row['team_a']} {ga}-{gb} {row['team_b']}: "
                      f"Pred={p_home:.2f}/{p_draw:.2f}/{p_away:.2f}, Brier={brier:.3f}")

        except Exception as e:
            skipped += 1
            if verbose:
                print(f"  SKIP: {row.get('team_a', '?')} vs {row.get('team_b', '?')}: {e}")

    if not errors:
        return 0.333  # Baseline aleatorio

    return float(np.mean(errors))


def _weights_vector_to_dict(base_weights: dict, x: np.ndarray) -> dict:
    """
    Convierte vector de optimización a dict de pesos.
    Solo se optimizan los pesos estructurales (4 valores).
    """
    import copy
    w = copy.deepcopy(base_weights)
    # Los 4 valores del vector son los pesos estructurales
    sw_keys = ["gdp_per_capita", "population_football", "fifa_elo_ranking", "squad_strength"]
    total = sum(x[:4])
    if total <= 0:
        total = 1.0
    for i, key in enumerate(sw_keys):
        w["structural_weights"][key] = float(x[i] / total)
    return w


def calibrate(
    csv_content: str,
    max_iter: int = 100,
    method: str = "Nelder-Mead"
) -> dict:
    """
    Recalibra los pesos del modelo usando resultados históricos reales.

    Args:
        csv_content: Contenido del CSV como string.
        max_iter: Máximo de iteraciones de optimización.
        method: Método de scipy.optimize.minimize.

    Returns:
        Dict con pesos actuales, pesos sugeridos, mejora en Brier Score
        y número de partidos usados.
    """
    current_weights = load_current_weights()

    # Parsear datos históricos
    df = parse_historical_csv(csv_content)
    n_matches = len(df)

    if n_matches < 5:
        raise ValueError(
            f"Se necesitan al menos 5 partidos históricos para recalibrar. "
            f"CSV tiene {n_matches} filas válidas."
        )

    # Brier Score con pesos actuales
    current_brier = compute_prediction_error(df, current_weights)

    # Valores iniciales: pesos estructurales actuales
    sw = current_weights["structural_weights"]
    x0 = np.array([
        sw["gdp_per_capita"],
        sw["population_football"],
        sw["fifa_elo_ranking"],
        sw["squad_strength"],
    ])

    def objective(x):
        # Penalizar valores negativos
        if any(v < 0 for v in x):
            return 10.0
        w = _weights_vector_to_dict(current_weights, x)
        return compute_prediction_error(df, w)

    # Optimización
    result_opt = minimize(
        objective,
        x0,
        method=method,
        options={"maxiter": max_iter, "xatol": 1e-4, "fatol": 1e-4}
    )

    # Pesos sugeridos
    suggested_weights = _weights_vector_to_dict(current_weights, result_opt.x)
    suggested_brier = compute_prediction_error(df, suggested_weights)

    improvement = current_brier - suggested_brier

    # Formatear resultado
    sw_suggested = suggested_weights["structural_weights"]
    sw_current = current_weights["structural_weights"]

    return {
        "n_matches_used": n_matches,
        "current_weights": {
            "structural_weights": sw_current,
            "brier_score": round(current_brier, 4),
        },
        "suggested_weights": {
            "structural_weights": {
                k: round(v, 4) for k, v in sw_suggested.items()
            },
            "brier_score": round(suggested_brier, 4),
        },
        "improvement": {
            "brier_score_delta": round(improvement, 4),
            "percentage_improvement": round(improvement / current_brier * 100, 2) if current_brier > 0 else 0,
        },
        "optimization": {
            "success": result_opt.success,
            "message": result_opt.message,
            "iterations": result_opt.get("nit", max_iter),
        },
        "full_suggested_weights": suggested_weights,
    }


def apply_suggested_weights(suggested_weights: dict):
    """
    Aplica los pesos sugeridos al archivo de configuración.
    Llamado solo cuando el usuario confirma desde el frontend.
    """
    save_weights(suggested_weights)
    return {"status": "ok", "message": "Pesos actualizados correctamente."}


if __name__ == "__main__":
    # Test con el CSV de historial H2H incluido
    with open(ROOT / "data" / "h2h_history.csv", "r", encoding="utf-8") as f:
        csv_content = f.read()

    print("=== Test de recalibración ===")
    try:
        result = calibrate(csv_content, max_iter=30)
        print(f"Partidos usados: {result['n_matches_used']}")
        print(f"Brier actual: {result['current_weights']['brier_score']}")
        print(f"Brier sugerido: {result['suggested_weights']['brier_score']}")
        print(f"Mejora: {result['improvement']['percentage_improvement']:.1f}%")
        print(f"Pesos sugeridos: {result['suggested_weights']['structural_weights']}")
    except Exception as e:
        print(f"Error (esperado si pocas filas): {e}")
