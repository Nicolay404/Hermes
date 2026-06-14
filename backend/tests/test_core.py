"""
test_core.py — Tests unitarios para el motor de cálculo.

Ejecutar desde /backend con:
    pytest tests/ -v

O desde la raíz del proyecto:
    cd backend && pytest tests/ -v
"""

import sys
import json
import pytest
import numpy as np
from pathlib import Path

# Añadir backend al path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from core.strength_model import (
    gdp_factor, population_football_factor, elo_factor,
    squad_strength_factor, compute_structural_strength,
    get_team_strength, get_all_strengths, load_weights, load_teams
)
from core.match_model import (
    climate_adjustment, strength_to_xg, compute_score_matrix,
    matrix_to_1x2, top_scores, run_monte_carlo, predict_match
)
from core.stats_model import (
    shots_distribution, corners_distribution, cards_distribution,
    fouls_distribution, possession_estimate, compute_match_stats
)


# =====================================================================
# Tests de strength_model
# =====================================================================

class TestGdpFactor:
    def test_zero_gdp(self):
        assert gdp_factor(0) == 0.0

    def test_below_threshold(self):
        result = gdp_factor(30000, threshold=60000)
        assert result == pytest.approx(0.5, abs=0.01)

    def test_at_threshold(self):
        result = gdp_factor(60000, threshold=60000)
        assert result == pytest.approx(1.0, abs=0.01)

    def test_above_threshold_is_higher_but_bounded(self):
        below = gdp_factor(59999, threshold=60000)
        above = gdp_factor(120000, threshold=60000)
        # Sobre el umbral crece, pero menos que duplicarse
        assert above > below
        assert above < 1.25  # Rendimientos decrecientes

    def test_very_high_gdp(self):
        result = gdp_factor(200000, threshold=60000)
        assert result < 1.25  # Sigue siendo limitado


class TestPopulationFactor:
    def test_large_football_country(self):
        """Brasil: 216M pop, cultura 99 → factor alto"""
        result = population_football_factor(216, 99)
        assert result > 0.8

    def test_small_football_country(self):
        """Uruguay: 3.5M pop, cultura 97 → factor moderado"""
        result = population_football_factor(3.5, 97)
        assert result < 0.5

    def test_low_football_culture(self):
        """País grande pero cultura baja → factor bajo"""
        high_culture = population_football_factor(100, 90)
        low_culture = population_football_factor(100, 30)
        assert high_culture > low_culture

    def test_zero_population(self):
        result = population_football_factor(0, 50)
        assert result >= 0


class TestEloFactor:
    def test_top_team(self):
        """Argentina con Elo ~2143 → factor cerca de 1"""
        result = elo_factor(2143)
        assert result > 0.8

    def test_bottom_team(self):
        """Equipo con Elo bajo → factor bajo"""
        result = elo_factor(1620)
        assert result < 0.2

    def test_mid_team(self):
        """Equipo con Elo medio → factor ~0.5"""
        result = elo_factor(1900)
        assert 0.3 < result < 0.7

    def test_clamped(self):
        assert elo_factor(2500) <= 1.0
        assert elo_factor(1000) >= 0.0


class TestComputeStructuralStrength:
    def test_top_team_higher_than_bottom(self):
        weights = load_weights()
        df = load_teams()
        # Argentina vs Bolivia
        arg = df[df['code'] == 'ARG'].iloc[0]
        bol = df[df['code'] == 'BOL'].iloc[0]
        s_arg = compute_structural_strength(arg, weights)
        s_bol = compute_structural_strength(bol, weights)
        assert s_arg > s_bol

    def test_all_teams_positive(self):
        weights = load_weights()
        df = load_teams()
        for _, row in df.iterrows():
            s = compute_structural_strength(row, weights)
            assert s > 0, f"Fuerza negativa para {row['name']}"

    def test_returns_float(self):
        weights = load_weights()
        df = load_teams()
        row = df.iloc[0]
        result = compute_structural_strength(row, weights)
        assert isinstance(result, float)


class TestGetTeamStrength:
    def test_argentina_by_name(self):
        result = get_team_strength("Argentina")
        assert result['name'] == 'Argentina'
        assert result['code'] == 'ARG'
        assert 'structural_strength' in result
        assert 'components' in result

    def test_france_by_code(self):
        result = get_team_strength("FRA")
        assert result['code'] == 'FRA'

    def test_unknown_team_raises(self):
        with pytest.raises(ValueError):
            get_team_strength("Wakanda FC")

    def test_structural_strength_range(self):
        result = get_team_strength("Brazil")
        assert 0 < result['structural_strength'] < 2.0

    def test_components_present(self):
        result = get_team_strength("Spain")
        comps = result['components']
        assert 'gdp_factor' in comps
        assert 'elo_factor' in comps
        assert 'squad_factor' in comps


class TestGetAllStrengths:
    def test_returns_list(self):
        result = get_all_strengths()
        assert isinstance(result, list)
        assert len(result) >= 10

    def test_sorted_descending(self):
        result = get_all_strengths()
        strengths = [r['strength'] for r in result]
        assert strengths == sorted(strengths, reverse=True)


# =====================================================================
# Tests de match_model
# =====================================================================

class TestClimateAdjustment:
    def test_same_temperature(self):
        weights = load_weights()
        result = climate_adjustment(20.0, 20.0, weights)
        assert result == 0.0

    def test_large_difference(self):
        weights = load_weights()
        result = climate_adjustment(5.0, 35.0, weights)
        assert result > 0
        assert result <= weights['climate_penalty']['max_penalty']

    def test_penalty_capped(self):
        weights = load_weights()
        result = climate_adjustment(-20.0, 50.0, weights)
        assert result == weights['climate_penalty']['max_penalty']


class TestStrengthToXg:
    def test_equal_strength_baseline(self):
        weights = load_weights()
        base = weights['xg_conversion']['base_goals_per_match']
        xg = strength_to_xg(0.5, 0.5, weights)
        assert xg == pytest.approx(base, abs=0.1)

    def test_stronger_team_higher_xg(self):
        weights = load_weights()
        xg_strong = strength_to_xg(0.8, 0.3, weights)
        xg_weak = strength_to_xg(0.3, 0.8, weights)
        assert xg_strong > xg_weak

    def test_xg_within_bounds(self):
        weights = load_weights()
        min_xg = weights['xg_conversion']['min_xg']
        max_xg = weights['xg_conversion']['max_xg']
        for s_a, s_b in [(0.1, 0.9), (0.9, 0.1), (0.5, 0.5), (0.01, 0.99)]:
            xg = strength_to_xg(s_a, s_b, weights)
            assert min_xg <= xg <= max_xg


class TestScoreMatrix:
    def test_shape(self):
        matrix = compute_score_matrix(1.5, 1.2, max_goals=5)
        assert matrix.shape == (6, 6)

    def test_sums_to_one(self):
        matrix = compute_score_matrix(1.3, 1.1, max_goals=8)
        assert matrix.sum() == pytest.approx(1.0, abs=0.001)

    def test_all_positive(self):
        matrix = compute_score_matrix(1.0, 1.0, max_goals=5)
        assert (matrix >= 0).all()

    def test_symmetric_for_equal_teams(self):
        """P(i,j) ≈ P(j,i) cuando lambda_a == lambda_b"""
        matrix = compute_score_matrix(1.3, 1.3, max_goals=5)
        np.testing.assert_allclose(matrix, matrix.T, atol=0.001)


class TestMatrixTo1x2:
    def test_probs_sum_to_one(self):
        matrix = compute_score_matrix(1.5, 1.0)
        probs = matrix_to_1x2(matrix)
        total = probs['home_win'] + probs['draw'] + probs['away_win']
        assert total == pytest.approx(1.0, abs=0.01)

    def test_stronger_team_wins_more(self):
        matrix_a_wins = compute_score_matrix(2.5, 0.5)
        probs = matrix_to_1x2(matrix_a_wins)
        assert probs['home_win'] > probs['away_win']

    def test_all_positive(self):
        matrix = compute_score_matrix(1.0, 1.0)
        probs = matrix_to_1x2(matrix)
        for v in probs.values():
            assert v >= 0


class TestTopScores:
    def test_returns_n_scores(self):
        matrix = compute_score_matrix(1.5, 1.2)
        scores = top_scores(matrix, n=3)
        assert len(scores) == 3

    def test_sorted_by_probability(self):
        matrix = compute_score_matrix(1.5, 1.2)
        scores = top_scores(matrix, n=5)
        probs = [s['probability'] for s in scores]
        assert probs == sorted(probs, reverse=True)

    def test_scores_have_required_keys(self):
        matrix = compute_score_matrix(1.0, 1.0)
        scores = top_scores(matrix, n=1)
        assert 'score_a' in scores[0]
        assert 'score_b' in scores[0]
        assert 'probability' in scores[0]


class TestMonteCarlo:
    def test_probs_sum_to_one(self):
        weights = load_weights()
        result = run_monte_carlo(1.5, 1.2, 'mundial', weights, seed=42)
        probs = result['probabilities_1x2']
        total = probs['home_win'] + probs['draw'] + probs['away_win']
        assert total == pytest.approx(1.0, abs=0.01)

    def test_stronger_team_wins_more(self):
        weights = load_weights()
        result = run_monte_carlo(2.5, 0.5, 'mundial', weights, seed=42)
        assert result['probabilities_1x2']['home_win'] > 0.6

    def test_reproducible_with_seed(self):
        weights = load_weights()
        r1 = run_monte_carlo(1.3, 1.1, 'amistoso', weights, seed=99)
        r2 = run_monte_carlo(1.3, 1.1, 'amistoso', weights, seed=99)
        assert r1['probabilities_1x2'] == r2['probabilities_1x2']

    def test_has_expected_keys(self):
        weights = load_weights()
        result = run_monte_carlo(1.0, 1.0, 'mundial', weights)
        assert 'probabilities_1x2' in result
        assert 'expected_goals' in result
        assert 'iterations' in result


class TestPredictMatch:
    """Tests de integración para predict_match."""

    def test_argentina_vs_france(self):
        result = predict_match("Argentina", "France", "Sede Neutral", "mundial")
        assert result['match']['team_a'] == 'Argentina'
        assert result['match']['team_b'] == 'France'
        probs = result['probabilities']
        total = probs['home_win'] + probs['draw'] + probs['away_win']
        assert total == pytest.approx(1.0, abs=0.01)

    def test_returns_top_scores(self):
        result = predict_match("Brazil", "England", "Sede Neutral", "amistoso")
        assert 'top_scores' in result
        assert len(result['top_scores']) >= 3

    def test_home_advantage_works(self):
        result_neutral = predict_match("Mexico", "USA", "Sede Neutral", "clasificatoria", False)
        result_home = predict_match("Mexico", "USA", "Estadio Azteca", "clasificatoria", True)
        # México jugando de local debe ganar con mayor probabilidad
        assert result_home['probabilities']['home_win'] >= result_neutral['probabilities']['home_win']

    def test_xg_positive(self):
        result = predict_match("Spain", "Germany", "Sede Neutral", "mundial")
        assert result['expected_goals']['team_a'] > 0
        assert result['expected_goals']['team_b'] > 0

    def test_invalid_team_raises(self):
        with pytest.raises(ValueError):
            predict_match("Wakanda", "France", "Sede Neutral", "mundial")

    def test_amistoso_more_variance(self):
        """Los amistosos deben tener probabilidades más cercanas al 50-50 que un Mundial."""
        r_world = predict_match("Argentina", "Bolivia", "Sede Neutral", "mundial")
        r_friendly = predict_match("Argentina", "Bolivia", "Sede Neutral", "amistoso")
        # En amistoso, Bolivia debería tener mayor probabilidad que en Mundial
        assert r_friendly['probabilities']['away_win'] >= r_world['probabilities']['away_win'] - 0.05


# =====================================================================
# Tests de stats_model
# =====================================================================

class TestShotsDistribution:
    def test_higher_xg_more_shots(self):
        shots_low = shots_distribution(0.5)
        shots_high = shots_distribution(2.5)
        assert shots_high['shots_total']['mean'] > shots_low['shots_total']['mean']

    def test_on_target_less_than_total(self):
        shots = shots_distribution(1.5)
        assert shots['shots_on_target']['mean'] < shots['shots_total']['mean']

    def test_positive_values(self):
        shots = shots_distribution(1.2)
        assert shots['shots_total']['p25'] >= 0
        assert shots['shots_on_target']['p25'] >= 0

    def test_range_display_present(self):
        shots = shots_distribution(1.5)
        assert '–' in shots['shots_total']['range_display']


class TestCornersDistribution:
    def test_higher_xg_more_corners(self):
        c_low = corners_distribution(0.5)
        c_high = corners_distribution(2.0)
        assert c_high['mean'] > c_low['mean']

    def test_positive(self):
        c = corners_distribution(1.0)
        assert c['p25'] >= 0


class TestCardsDistribution:
    def test_mundial_more_cards_than_amistoso(self):
        cards_world = cards_distribution(1.2, 1.2, 'mundial')
        cards_friendly = cards_distribution(1.2, 1.2, 'amistoso')
        assert cards_world['yellow_cards']['mean'] > cards_friendly['yellow_cards']['mean']

    def test_balanced_match_more_cards(self):
        balanced = cards_distribution(1.2, 1.2, 'mundial')
        unbalanced = cards_distribution(3.0, 0.3, 'mundial')
        # Partido parejo → más tarjetas
        assert balanced['yellow_cards']['mean'] > unbalanced['yellow_cards']['mean']


class TestPossessionEstimate:
    def test_equal_strength_equal_possession(self):
        poss = possession_estimate(0.5, 0.5)
        assert poss['team_a']['mean'] == pytest.approx(50.0, abs=1)

    def test_stronger_team_more_possession(self):
        poss = possession_estimate(0.9, 0.3)
        assert poss['team_a']['mean'] > poss['team_b']['mean']

    def test_sums_to_100(self):
        poss = possession_estimate(0.7, 0.5)
        assert poss['team_a']['mean'] + poss['team_b']['mean'] == pytest.approx(100.0, abs=0.1)

    def test_possession_compressed(self):
        """La posesión nunca debería ser < 35% o > 65% para diferencias razonables."""
        poss = possession_estimate(1.0, 0.1)
        assert poss['team_a']['mean'] <= 65.0
        assert poss['team_b']['mean'] >= 35.0


class TestComputeMatchStats:
    def test_complete_output(self):
        stats = compute_match_stats(1.4, 1.1, 0.78, 0.72, 'mundial')
        assert 'team_a' in stats
        assert 'team_b' in stats
        assert 'totals' in stats

    def test_all_stats_present(self):
        stats = compute_match_stats(1.5, 1.0, 0.75, 0.65, 'mundial')
        for team in ['team_a', 'team_b']:
            t = stats[team]
            assert 'shots_total' in t
            assert 'shots_on_target' in t
            assert 'corners' in t
            assert 'yellow_cards' in t
            assert 'red_cards' in t
            assert 'fouls' in t
            assert 'possession' in t
            assert 'xg' in t

    def test_totals_match(self):
        stats = compute_match_stats(1.3, 1.1, 0.70, 0.65, 'amistoso')
        expected_total_goals = stats['team_a']['xg'] + stats['team_b']['xg']
        assert stats['totals']['total_goals_expected'] == pytest.approx(expected_total_goals, abs=0.01)


# =====================================================================
# Test de integración completo: Argentina vs Francia
# =====================================================================

class TestArgentinaVsFranceIntegration:
    """
    Test de integración completo: replica el ejemplo de prueba principal.
    Verifica que el sistema completo funciona de punta a punta.
    """

    def test_full_prediction(self):
        result = predict_match(
            team_a="Argentina",
            team_b="France",
            venue_name="Sede Neutral",
            match_type="mundial"
        )

        # Verificar estructura básica
        assert result['match']['team_a'] == 'Argentina'
        assert result['match']['team_b'] == 'France'

        # Las probabilidades deben sumar 1
        probs = result['probabilities']
        assert sum(probs.values()) == pytest.approx(1.0, abs=0.01)

        # xG deben ser positivos y razonables
        assert 0.5 < result['expected_goals']['team_a'] < 3.0
        assert 0.5 < result['expected_goals']['team_b'] < 3.0

        # Debe haber al menos 1 marcador
        assert len(result['top_scores']) > 0

        # El marcador más probable debe ser de pocos goles (fútbol real)
        top_score = result['most_likely_score']
        assert top_score['score_a'] <= 4
        assert top_score['score_b'] <= 4

        print("\n=== Resultado: Argentina vs France (Mundial, Sede Neutral) ===")
        print(f"xG: ARG {result['expected_goals']['team_a']} - {result['expected_goals']['team_b']} FRA")
        print(f"P(ARG win): {probs['home_win']*100:.1f}% | P(draw): {probs['draw']*100:.1f}% | P(FRA win): {probs['away_win']*100:.1f}%")
        print(f"Marcador más probable: {top_score['score_a']}-{top_score['score_b']} ({top_score['probability']*100:.1f}%)")

    def test_stats_for_match(self):
        result = predict_match(
            team_a="Argentina",
            team_b="France",
            venue_name="Sede Neutral",
            match_type="mundial"
        )
        stats = compute_match_stats(
            xg_a=result['expected_goals']['team_a'],
            xg_b=result['expected_goals']['team_b'],
            adj_strength_a=result['strengths']['team_a_adjusted'],
            adj_strength_b=result['strengths']['team_b_adjusted'],
            match_type='mundial'
        )

        assert stats['team_a']['shots_total']['mean'] > 5
        assert stats['team_b']['shots_total']['mean'] > 5
        assert stats['totals']['total_goals_expected'] > 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
