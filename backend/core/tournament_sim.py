"""
tournament_sim.py — Simulación de torneo completo tipo bracket.

Simula un torneo de eliminación directa (knockout) usando Monte Carlo
para obtener probabilidades de avance por ronda y probabilidades de campeón.

Formatos soportados:
- Eliminación directa con cualquier número de equipos (potencias de 2: 4, 8, 16, 32)
- Grupos + eliminación directa (próxima versión)

Cada partido se simula con match_model.predict_match() para mantener coherencia
con los ajustes contextuales (localía, clima, tipo de partido).
"""

import numpy as np
from typing import Optional
from collections import defaultdict
import json


def simulate_single_match(
    team_a: str,
    team_b: str,
    venue_name: str,
    match_type: str,
    weights: dict,
    rng: np.random.Generator,
    include_extra_time: bool = True
) -> str:
    """
    Simula un partido y retorna el ganador.

    En partidos de eliminación directa no puede haber empate:
    si Poisson da empate, se simula prórroga/penales.

    Returns:
        Nombre del equipo ganador.
    """
    from .match_model import predict_match, run_monte_carlo, strength_to_xg, compute_adjusted_strength
    from .strength_model import get_team_strength, load_venues
    import pandas as pd

    # Obtener fuerzas
    team_a_info = get_team_strength(team_a, weights)
    team_b_info = get_team_strength(team_b, weights)

    # Buscar sede
    venues_df = load_venues()
    venue_mask = venues_df["name"].str.lower() == venue_name.lower()
    venue_row = venues_df[venue_mask].iloc[0] if venue_mask.any() else None

    from .match_model import (
        compute_h2h_adjustment, compute_adjusted_strength as _adj_strength,
        strength_to_xg as _s2xg
    )

    h2h_a, h2h_b = compute_h2h_adjustment(
        team_a_info["code"], team_b_info["code"], weights
    )

    adj_a = _adj_strength(
        team_a_info, team_b_info, venue_row, match_type,
        is_home=False, weights=weights, h2h_adj=h2h_a
    )
    adj_b = _adj_strength(
        team_b_info, team_a_info, venue_row, match_type,
        is_home=False, weights=weights, h2h_adj=h2h_b
    )

    xg_a = _s2xg(adj_a, adj_b, weights)
    xg_b = _s2xg(adj_b, adj_a, weights)

    variance_factor = weights["match_type_variance"].get(match_type, 1.0)
    noise_std = 0.15 * variance_factor

    la = max(xg_a * rng.lognormal(0, noise_std), 0.05)
    lb = max(xg_b * rng.lognormal(0, noise_std), 0.05)

    goals_a = int(rng.poisson(la))
    goals_b = int(rng.poisson(lb))

    if goals_a > goals_b:
        return team_a
    elif goals_b > goals_a:
        return team_b
    else:
        # Empate → prórroga/penales: 50% + pequeño sesgo por fuerza relativa
        if include_extra_time:
            prob_a_wins_pens = adj_a / (adj_a + adj_b)
            # Añadir componente aleatoria mayor (penales son lotería)
            prob_a_wins_pens = 0.5 + (prob_a_wins_pens - 0.5) * 0.3
            return team_a if rng.random() < prob_a_wins_pens else team_b
        else:
            return team_a if rng.random() < 0.5 else team_b


def simulate_tournament(
    bracket: list,
    venue_name: str = "Sede Neutral",
    match_type: str = "mundial",
    weights: Optional[dict] = None,
    n_simulations: int = 10000,
    seed: int = 42
) -> dict:
    """
    Simula un torneo de eliminación directa completo.

    Args:
        bracket: Lista de equipos ordenados por posición en el bracket.
                 Debe ser potencia de 2 (4, 8, 16, 32).
                 Formato: ["Argentina", "Mexico", "France", "England", ...]
                 Los emparejamientos son: [0 vs 1], [2 vs 3], etc.
        venue_name: Sede donde se juega el torneo.
        match_type: Tipo de partido.
        weights: Pesos del modelo.
        n_simulations: Número de simulaciones Monte Carlo.
        seed: Semilla aleatoria.

    Returns:
        Dict con probabilidades de avance por ronda y probabilidad de campeón.
    """
    from .strength_model import load_weights as _load_weights
    if weights is None:
        from .strength_model import load_weights
        weights = load_weights()

    n_teams = len(bracket)
    if n_teams < 2:
        raise ValueError("El bracket debe tener al menos 2 equipos.")

    # Verificar que sea potencia de 2
    if n_teams & (n_teams - 1) != 0:
        raise ValueError(f"El número de equipos debe ser potencia de 2 (es {n_teams}).")

    import math
    n_rounds = int(math.log2(n_teams))

    # Contadores de avance por ronda
    # advance_counts[equipo][ronda] = número de veces que llegó a esa ronda
    advance_counts = defaultdict(lambda: defaultdict(int))
    champion_counts = defaultdict(int)

    rng = np.random.default_rng(seed)

    for sim_idx in range(n_simulations):
        current_round_teams = list(bracket)

        for round_num in range(n_rounds):
            next_round = []
            for match_idx in range(0, len(current_round_teams), 2):
                team_a = current_round_teams[match_idx]
                team_b = current_round_teams[match_idx + 1]

                winner = simulate_single_match(
                    team_a, team_b, venue_name, match_type, weights, rng
                )
                next_round.append(winner)
                advance_counts[winner][round_num + 1] += 1

            current_round_teams = next_round

        champion = current_round_teams[0]
        champion_counts[champion] += 1

    # Calcular probabilidades
    results = {
        "bracket": bracket,
        "n_simulations": n_simulations,
        "champion_probabilities": {},
        "round_advancement": {},
        "venue": venue_name,
        "match_type": match_type,
    }

    # Probabilidades de campeón
    for team in bracket:
        prob = champion_counts.get(team, 0) / n_simulations
        results["champion_probabilities"][team] = round(prob, 4)

    # Ordenar por probabilidad
    results["champion_probabilities"] = dict(
        sorted(results["champion_probabilities"].items(),
               key=lambda x: x[1], reverse=True)
    )

    # Probabilidades de avance por ronda
    round_names = _get_round_names(n_rounds)
    for team in bracket:
        team_rounds = {}
        for r in range(1, n_rounds + 1):
            count = advance_counts[team].get(r, 0)
            # La ronda final (n_rounds) = Campeón
            if r == n_rounds:
                prob = champion_counts.get(team, 0) / n_simulations
            else:
                prob = count / n_simulations
            team_rounds[round_names[r - 1]] = round(prob, 4)
        results["round_advancement"][team] = team_rounds

    return results


def _get_round_names(n_rounds: int) -> list:
    """Genera nombres de rondas según el número total."""
    names = ["Campeón"]
    extras = {
        1: ["Final"],
        2: ["Semifinal", "Final"],
        3: ["Cuartos de Final", "Semifinal", "Final"],
        4: ["Octavos de Final", "Cuartos de Final", "Semifinal", "Final"],
        5: ["Ronda de 32", "Octavos de Final", "Cuartos de Final", "Semifinal", "Final"],
    }
    rounds_list = extras.get(n_rounds, [f"Ronda {i+1}" for i in range(n_rounds)])
    return rounds_list


def quick_tournament_test():
    """Test rápido con 8 equipos."""
    bracket = [
        "Argentina", "Mexico",
        "France", "Poland",
        "Brazil", "South Korea",
        "England", "Senegal"
    ]
    result = simulate_tournament(bracket, n_simulations=5000)
    print("=== Simulación de torneo (8 equipos, 5000 sims) ===")
    print("\nProbabilidades de Campeón:")
    for team, prob in result["champion_probabilities"].items():
        print(f"  {team}: {prob*100:.1f}%")
    return result


if __name__ == "__main__":
    quick_tournament_test()
