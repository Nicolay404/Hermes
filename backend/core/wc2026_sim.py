"""
wc2026_sim.py — Simulación completa del Copa Mundial FIFA 2026.

Simula:
  - Fase de grupos completa (72 partidos round-robin)
  - Ronda de 32 → Octavos → Cuartos → Semis → Final

Retorna probabilidades de:
  - Ser campeón
  - Clasificar desde la fase de grupos (1ro, 2do, 3ro mejor)
  - Llegar a cada ronda del torneo

Optimización: pre-computa xG para todos los cruces posibles antes del loop.
"""

import numpy as np
from collections import defaultdict
from itertools import combinations

# ── Grupos oficiales del Mundial 2026 ────────────────────────────────────────
WC2026_GROUPS = {
    'A': ['Mexico',        'South Africa',       'South Korea',  'Czech Republic'],
    'B': ['Canada',        'Bosnia & Herzegovina','Qatar',        'Switzerland'],
    'C': ['Brazil',        'Morocco',             'Haiti',        'Scotland'],
    'D': ['United States', 'Paraguay',            'Australia',    'Turkey'],
    'E': ['Germany',       'Curaçao',             'Ivory Coast',  'Ecuador'],
    'F': ['Netherlands',   'Japan',               'Sweden',       'Tunisia'],
    'G': ['Belgium',       'Egypt',               'Iran',         'New Zealand'],
    'H': ['Spain',         'Cape Verde',          'Saudi Arabia', 'Uruguay'],
    'I': ['France',        'Senegal',             'Iraq',         'Norway'],
    'J': ['Argentina',     'Algeria',             'Austria',      'Jordan'],
    'K': ['Portugal',      'DR Congo',            'Uzbekistan',   'Colombia'],
    'L': ['England',       'Croatia',             'Ghana',        'Panama'],
}

ALL_TEAMS = [t for teams in WC2026_GROUPS.values() for t in teams]

# Bracket seeding para 32 equipos (índices 0-based sobre lista ordenada por Elo).
# Coloca seed 1 vs 32, seed 16 vs 17, seed 8 vs 25, etc. en los pares [0,1],[2,3],...
_SEEDED_32 = [
     0, 31, 15, 16,   # Partido R32 #1, #2
     7, 24,  8, 23,   # Partido R32 #3, #4
     3, 28, 12, 19,   # Partido R32 #5, #6
     4, 27, 11, 20,   # Partido R32 #7, #8
     1, 30, 14, 17,   # Partido R32 #9, #10
     6, 25,  9, 22,   # Partido R32 #11, #12
     2, 29, 13, 18,   # Partido R32 #13, #14
     5, 26, 10, 21,   # Partido R32 #15, #16
]


def _precompute_xg(weights, venue_row, match_type):
    """
    Pre-computa (xg_a, xg_b, adj_a, adj_b) para todos los cruces posibles.
    Con 48 equipos → 48×47 = 2256 combinaciones (rápido).
    """
    from .strength_model import get_team_strength
    from .match_model import (
        compute_adjusted_strength, compute_h2h_adjustment, strength_to_xg
    )

    infos = {t: get_team_strength(t, weights) for t in ALL_TEAMS}
    cache = {}

    for team_a in ALL_TEAMS:
        for team_b in ALL_TEAMS:
            if team_a == team_b:
                continue
            ia, ib = infos[team_a], infos[team_b]
            h2h_a, h2h_b = compute_h2h_adjustment(ia['code'], ib['code'], weights)
            adj_a = compute_adjusted_strength(
                ia, ib, venue_row, match_type, is_home=False, weights=weights, h2h_adj=h2h_a
            )
            adj_b = compute_adjusted_strength(
                ib, ia, venue_row, match_type, is_home=False, weights=weights, h2h_adj=h2h_b
            )
            xg_a = max(strength_to_xg(adj_a, adj_b, weights), 0.05)
            xg_b = max(strength_to_xg(adj_b, adj_a, weights), 0.05)
            cache[(team_a, team_b)] = (xg_a, xg_b, adj_a, adj_b)

    return cache, infos


def _match_goals(team_a, team_b, cache, variance, rng):
    """Simula goles. Retorna (goals_a, goals_b)."""
    xg_a, xg_b, _, _ = cache[(team_a, team_b)]
    la = max(xg_a * float(rng.lognormal(0, 0.15 * variance)), 0.05)
    lb = max(xg_b * float(rng.lognormal(0, 0.15 * variance)), 0.05)
    return int(rng.poisson(la)), int(rng.poisson(lb))


def _match_winner(team_a, team_b, cache, variance, rng):
    """Simula partido de eliminación directa. Retorna equipo ganador (sin empates)."""
    ga, gb = _match_goals(team_a, team_b, cache, variance, rng)
    if ga > gb:
        return team_a
    elif gb > ga:
        return team_b
    else:
        # Penales: 50/50 con leve sesgo por fuerza relativa
        _, _, adj_a, adj_b = cache[(team_a, team_b)]
        pa = 0.5 + (adj_a / (adj_a + adj_b) - 0.5) * 0.3
        return team_a if rng.random() < pa else team_b


def _apply_group_result(s, ta, tb, ga, gb):
    """Aplica un resultado (real o simulado) a los standings del grupo."""
    s[ta]['gf'] += ga; s[ta]['ga'] += gb; s[ta]['gd'] += ga - gb
    s[tb]['gf'] += gb; s[tb]['ga'] += ga; s[tb]['gd'] += gb - ga
    if ga > gb:
        s[ta]['pts'] += 3
    elif gb > ga:
        s[tb]['pts'] += 3
    else:
        s[ta]['pts'] += 1; s[tb]['pts'] += 1


def _simulate_one_group_stage(cache, variance, rng, fixed_group_results=None):
    """
    Simula los 72 partidos de grupos. Retorna standings por grupo.

    fixed_group_results: dict[(team_a, team_b)] = (goals_a, goals_b)
        Partidos ya jugados con resultado real. Se aplican directamente;
        el resto se simula con el modelo.
    """
    fixed = fixed_group_results or {}
    group_results = {}
    for group, teams in WC2026_GROUPS.items():
        s = {t: {'pts': 0, 'gd': 0, 'gf': 0, 'ga': 0} for t in teams}
        for ta, tb in combinations(teams, 2):
            if (ta, tb) in fixed:
                ga, gb = fixed[(ta, tb)]
            elif (tb, ta) in fixed:
                gb, ga = fixed[(tb, ta)]
            else:
                ga, gb = _match_goals(ta, tb, cache, variance, rng)
            _apply_group_result(s, ta, tb, ga, gb)

        ranked = sorted(
            teams, key=lambda t: (-s[t]['pts'], -s[t]['gd'], -s[t]['gf'])
        )
        group_results[group] = (ranked, s)
    return group_results


def _get_advancing(group_results):
    """
    Determina los 32 clasificados.
    Retorna: (firsts_by_group, seconds_by_group, thirds_sorted)
    """
    firsts, seconds = {}, {}
    thirds = []  # (pts, gd, gf, group, team)

    for group, (ranked, s) in group_results.items():
        firsts[group] = ranked[0]
        seconds[group] = ranked[1]
        t3 = ranked[2]
        thirds.append((s[t3]['pts'], s[t3]['gd'], s[t3]['gf'], group, t3))

    # Mejores 8 terceros
    thirds_sorted = sorted(thirds, key=lambda x: (-x[0], -x[1], -x[2]))
    best_8_thirds = [t[4] for t in thirds_sorted[:8]]

    return firsts, seconds, best_8_thirds


def _build_bracket(firsts, seconds, best_8_thirds, cache):
    """
    Construye el bracket de 32 equipos usando seeding por Elo.
    Seed 1 = mejor Elo, Seed 32 = peor. Bracket clásico: 1vs32, 2vs31...
    """
    # Elo aproximado: usamos adj_strength contra equipo "promedio" como proxy
    # Más simple: usar xg_a frente a un equipo de referencia (Argentina)
    ref = 'Argentina'

    all_32 = (
        list(firsts.values()) +
        list(seconds.values()) +
        best_8_thirds
    )

    def elo_approx(team):
        if team == ref or (team, ref) not in cache:
            return 1.0
        return cache[(team, ref)][0]  # xg_a vs Argentina = proxy de calidad

    sorted_32 = sorted(all_32, key=lambda t: -elo_approx(t))
    bracket = [sorted_32[i] for i in _SEEDED_32]
    return bracket


def simulate_wc2026(
    weights,
    n_simulations: int = 5000,
    seed: int = 42,
    venue_name: str = 'Sede Neutral',
    match_type: str = 'mundial',
    actual_results: list = None,
) -> dict:
    """
    Simula el Mundial 2026 completo N veces.

    actual_results: lista de dicts con partidos ya jugados:
        [{ "team_a": str, "team_b": str, "goals_a": int, "goals_b": int }]
        Los partidos de grupo en esta lista usan el resultado real;
        el resto de partidos del grupo se siguen simulando con el modelo.

    Returns:
      champion_probabilities  : {team: prob}
      group_advancement       : {group: {team: {p1st, p2nd, p3rd_adv, pchamp}}}
      round_probabilities     : {team: {R32, Octavos, Cuartos, Semifinal, Final, Campeón}}
      most_likely_champions   : top-5 con probabilidades
      n_simulations           : int
      actual_results_used     : int (número de resultados reales aplicados)
    """
    # ── Setup ──────────────────────────────────────────────────────────────
    from .match_model import load_venues
    venues_df = load_venues()
    venue_mask = venues_df['name'].str.lower() == venue_name.lower()
    venue_row = venues_df[venue_mask].iloc[0] if venue_mask.any() else None

    variance = weights.get('match_type_variance', {}).get(match_type, 1.0)

    # Pre-computar xG (lo más lento, solo se hace 1 vez)
    cache, _ = _precompute_xg(weights, venue_row, match_type)

    rng = np.random.default_rng(seed)

    # ── Convertir resultados reales a dict de acceso rápido ────────────────
    # Clave: (team_a, team_b) tal como aparecen en wc2026.js
    fixed_group_results = {}
    actual_results = actual_results or []
    for r in actual_results:
        ta = r.get('team_a', '')
        tb = r.get('team_b', '')
        ga = int(r.get('goals_a', 0))
        gb = int(r.get('goals_b', 0))
        if ta and tb:
            fixed_group_results[(ta, tb)] = (ga, gb)

    # ── Contadores ─────────────────────────────────────────────────────────
    champion_counts = defaultdict(int)
    firsts_counts   = defaultdict(lambda: defaultdict(int))
    seconds_counts  = defaultdict(lambda: defaultdict(int))
    third_adv_counts = defaultdict(int)
    round_counts    = defaultdict(lambda: defaultdict(int))

    ROUND_KEYS = ['R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final', 'Campeón']

    # ── Loop principal ──────────────────────────────────────────────────────
    for _ in range(n_simulations):
        # 1. Fase de grupos (con resultados reales fijados)
        group_results = _simulate_one_group_stage(
            cache, variance, rng, fixed_group_results=fixed_group_results
        )
        firsts, seconds, best_8_thirds = _get_advancing(group_results)

        # Registrar clasificados por grupo
        for grp, ranked_and_s in group_results.items():
            ranked, _ = ranked_and_s
            firsts_counts[grp][ranked[0]] += 1
            seconds_counts[grp][ranked[1]] += 1
        for t in best_8_thirds:
            third_adv_counts[t] += 1

        # 2. Bracket de 32
        bracket = _build_bracket(firsts, seconds, best_8_thirds, cache)

        # Registrar participantes R32
        for t in bracket:
            round_counts[t]['R32'] += 1

        # 3. Simulación knockout (5 rondas)
        round_labels = ['Octavos', 'Cuartos', 'Semifinal', 'Final', 'Campeón']
        current = list(bracket)

        for r_idx, r_label in enumerate(round_labels):
            next_round = []
            for i in range(0, len(current), 2):
                winner = _match_winner(current[i], current[i+1], cache, variance, rng)
                next_round.append(winner)
                round_counts[winner][r_label] += 1
            current = next_round

        champion_counts[current[0]] += 1

    # ── Construir resultado ─────────────────────────────────────────────────
    n = n_simulations

    champ_probs = {t: round(champion_counts.get(t, 0) / n, 4) for t in ALL_TEAMS}
    champ_probs = dict(sorted(champ_probs.items(), key=lambda x: -x[1]))

    group_adv = {}
    for group, teams in WC2026_GROUPS.items():
        group_adv[group] = {
            t: {
                'p1st':    round(firsts_counts[group].get(t, 0) / n, 3),
                'p2nd':    round(seconds_counts[group].get(t, 0) / n, 3),
                'p3rd_adv': round(third_adv_counts.get(t, 0) / n, 3),
                'pchamp':  round(champion_counts.get(t, 0) / n, 3),
            }
            for t in teams
        }

    round_probs = {}
    for t in ALL_TEAMS:
        tc = round_counts[t]
        round_probs[t] = {k: round(tc.get(k, 0) / n, 3) for k in ROUND_KEYS}

    top5 = [
        {'team': t, 'prob': p}
        for t, p in list(champ_probs.items())[:5]
    ]

    return {
        'champion_probabilities': champ_probs,
        'group_advancement':      group_adv,
        'round_probabilities':    round_probs,
        'most_likely_champions':  top5,
        'n_simulations':          n,
        'actual_results_used':    len(fixed_group_results),
        'groups':                 {k: list(v) for k, v in WC2026_GROUPS.items()},
        'all_teams':              ALL_TEAMS,
    }
