/**
 * wc2026.js — Base de datos temporal Copa del Mundo FIFA 2026
 *
 * Fuente: Calendario oficial FIFA (grupos A–L, 104 partidos)
 * Nombres de equipos: coinciden exactamente con teams.csv
 * Nombres de sedes: coinciden exactamente con venues.csv
 * Resultados: actualizados al 13 jun 2026 (día en curso)
 */

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export const GROUP_TEAMS = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czech Republic'],
  B: ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['United States', 'Paraguay', 'Australia', 'Turkey'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
}

// result: { a: goles_equipo_a, b: goles_equipo_b } | null (sin jugar)
export const FIXTURES = [

  // ── GRUPO A ───────────────────────────────────────────────────────────────
  { id: 'GA1', date: '2026-06-11', time: '20:00', group: 'A', round: 1, phase: 'group',
    team_a: 'Mexico',       team_b: 'South Africa',  venue: 'Estadio Azteca',         result: { a: 2, b: 0 } },
  { id: 'GA2', date: '2026-06-11', time: '23:00', group: 'A', round: 1, phase: 'group',
    team_a: 'South Korea',  team_b: 'Czech Republic', venue: 'Estadio Akron',          result: { a: 2, b: 1 } },
  { id: 'GA3', date: '2026-06-18', time: '18:00', group: 'A', round: 2, phase: 'group',
    team_a: 'Mexico',       team_b: 'South Korea',   venue: 'Estadio Akron',          result: null },
  { id: 'GA4', date: '2026-06-18', time: '12:00', group: 'A', round: 2, phase: 'group',
    team_a: 'Czech Republic', team_b: 'South Africa', venue: 'Mercedes-Benz Stadium', result: null },
  { id: 'GA5', date: '2026-06-24', time: '21:00', group: 'A', round: 3, phase: 'group',
    team_a: 'Czech Republic', team_b: 'Mexico',      venue: 'Estadio Azteca',         result: null },
  { id: 'GA6', date: '2026-06-24', time: '21:00', group: 'A', round: 3, phase: 'group',
    team_a: 'South Africa', team_b: 'South Korea',   venue: 'Estadio BBVA',           result: null },

  // ── GRUPO B ───────────────────────────────────────────────────────────────
  { id: 'GB1', date: '2026-06-12', time: '16:00', group: 'B', round: 1, phase: 'group',
    team_a: 'Canada',       team_b: 'Bosnia & Herzegovina', venue: 'BMO Field',       result: { a: 1, b: 1 } },
  { id: 'GB2', date: '2026-06-13', time: '15:00', group: 'B', round: 1, phase: 'group',
    team_a: 'Qatar',        team_b: 'Switzerland',  venue: "Levi's Stadium",           result: { a: 1, b: 1 } },
  { id: 'GB3', date: '2026-06-18', time: '21:00', group: 'B', round: 2, phase: 'group',
    team_a: 'Canada',       team_b: 'Qatar',        venue: 'BC Place',                result: null },
  { id: 'GB4', date: '2026-06-18', time: '18:00', group: 'B', round: 2, phase: 'group',
    team_a: 'Switzerland',  team_b: 'Bosnia & Herzegovina', venue: 'SoFi Stadium',    result: null },
  { id: 'GB5', date: '2026-06-24', time: '15:00', group: 'B', round: 3, phase: 'group',
    team_a: 'Switzerland',  team_b: 'Canada',       venue: 'BC Place',                result: null },
  { id: 'GB6', date: '2026-06-24', time: '15:00', group: 'B', round: 3, phase: 'group',
    team_a: 'Bosnia & Herzegovina', team_b: 'Qatar', venue: 'Lumen Field',            result: null },

  // ── GRUPO C ───────────────────────────────────────────────────────────────
  { id: 'GC1', date: '2026-06-13', time: '18:00', group: 'C', round: 1, phase: 'group',
    team_a: 'Brazil',       team_b: 'Morocco',      venue: 'MetLife Stadium',          result: { a: 1, b: 1 } },
  { id: 'GC2', date: '2026-06-13', time: '21:00', group: 'C', round: 1, phase: 'group',
    team_a: 'Haiti',        team_b: 'Scotland',     venue: 'Gillette Stadium',         result: { a: 0, b: 1 } },
  { id: 'GC3', date: '2026-06-19', time: '19:00', group: 'C', round: 2, phase: 'group',
    team_a: 'Brazil',       team_b: 'Haiti',        venue: 'Lincoln Financial Field',  result: null },
  { id: 'GC4', date: '2026-06-19', time: '16:00', group: 'C', round: 2, phase: 'group',
    team_a: 'Scotland',     team_b: 'Morocco',      venue: 'Gillette Stadium',         result: null },
  { id: 'GC5', date: '2026-06-24', time: '21:00', group: 'C', round: 3, phase: 'group',
    team_a: 'Scotland',     team_b: 'Brazil',       venue: 'Hard Rock Stadium',        result: null },
  { id: 'GC6', date: '2026-06-24', time: '21:00', group: 'C', round: 3, phase: 'group',
    team_a: 'Morocco',      team_b: 'Haiti',        venue: 'Mercedes-Benz Stadium',    result: null },

  // ── GRUPO D ───────────────────────────────────────────────────────────────
  { id: 'GD1', date: '2026-06-12', time: '22:00', group: 'D', round: 1, phase: 'group',
    team_a: 'United States', team_b: 'Paraguay',    venue: 'SoFi Stadium',             result: { a: 4, b: 1 } },
  { id: 'GD2', date: '2026-06-13', time: '00:00', group: 'D', round: 1, phase: 'group',
    team_a: 'Australia',    team_b: 'Turkey',       venue: 'BC Place',                 result: null },
  { id: 'GD3', date: '2026-06-19', time: '22:00', group: 'D', round: 2, phase: 'group',
    team_a: 'United States', team_b: 'Australia',   venue: 'Lumen Field',              result: null },
  { id: 'GD4', date: '2026-06-19', time: '18:00', group: 'D', round: 2, phase: 'group',
    team_a: 'Turkey',       team_b: 'Paraguay',     venue: "Levi's Stadium",           result: null },
  { id: 'GD5', date: '2026-06-25', time: '22:00', group: 'D', round: 3, phase: 'group',
    team_a: 'Turkey',       team_b: 'United States', venue: 'SoFi Stadium',            result: null },
  { id: 'GD6', date: '2026-06-25', time: '22:00', group: 'D', round: 3, phase: 'group',
    team_a: 'Paraguay',     team_b: 'Australia',    venue: "Levi's Stadium",           result: null },

  // ── GRUPO E ───────────────────────────────────────────────────────────────
  { id: 'GE1', date: '2026-06-14', time: '16:00', group: 'E', round: 1, phase: 'group',
    team_a: 'Germany',      team_b: 'Curaçao',      venue: 'NRG Stadium',              result: null },
  { id: 'GE2', date: '2026-06-14', time: '16:00', group: 'E', round: 1, phase: 'group',
    team_a: 'Ivory Coast',  team_b: 'Ecuador',      venue: 'Lincoln Financial Field',  result: null },
  { id: 'GE3', date: '2026-06-20', time: '16:00', group: 'E', round: 2, phase: 'group',
    team_a: 'Germany',      team_b: 'Ivory Coast',  venue: 'BMO Field',                result: null },
  { id: 'GE4', date: '2026-06-20', time: '22:00', group: 'E', round: 2, phase: 'group',
    team_a: 'Ecuador',      team_b: 'Curaçao',      venue: 'Arrowhead Stadium',        result: null },
  { id: 'GE5', date: '2026-06-25', time: '16:00', group: 'E', round: 3, phase: 'group',
    team_a: 'Curaçao',      team_b: 'Ivory Coast',  venue: 'Lincoln Financial Field',  result: null },
  { id: 'GE6', date: '2026-06-25', time: '16:00', group: 'E', round: 3, phase: 'group',
    team_a: 'Ecuador',      team_b: 'Germany',      venue: 'MetLife Stadium',           result: null },

  // ── GRUPO F ───────────────────────────────────────────────────────────────
  { id: 'GF1', date: '2026-06-14', time: '19:00', group: 'F', round: 1, phase: 'group',
    team_a: 'Netherlands',  team_b: 'Japan',        venue: 'AT&T Stadium',             result: null },
  { id: 'GF2', date: '2026-06-14', time: '22:00', group: 'F', round: 1, phase: 'group',
    team_a: 'Sweden',       team_b: 'Tunisia',      venue: 'Estadio BBVA',             result: null },
  { id: 'GF3', date: '2026-06-20', time: '19:00', group: 'F', round: 2, phase: 'group',
    team_a: 'Netherlands',  team_b: 'Sweden',       venue: 'NRG Stadium',              result: null },
  { id: 'GF4', date: '2026-06-20', time: '22:00', group: 'F', round: 2, phase: 'group',
    team_a: 'Tunisia',      team_b: 'Japan',        venue: 'Estadio BBVA',             result: null },
  { id: 'GF5', date: '2026-06-25', time: '19:00', group: 'F', round: 3, phase: 'group',
    team_a: 'Japan',        team_b: 'Sweden',       venue: 'AT&T Stadium',             result: null },
  { id: 'GF6', date: '2026-06-25', time: '19:00', group: 'F', round: 3, phase: 'group',
    team_a: 'Tunisia',      team_b: 'Netherlands',  venue: 'Arrowhead Stadium',        result: null },

  // ── GRUPO G ───────────────────────────────────────────────────────────────
  { id: 'GG1', date: '2026-06-15', time: '16:00', group: 'G', round: 1, phase: 'group',
    team_a: 'Belgium',      team_b: 'Egypt',        venue: 'Lumen Field',              result: null },
  { id: 'GG2', date: '2026-06-15', time: '22:00', group: 'G', round: 1, phase: 'group',
    team_a: 'Iran',         team_b: 'New Zealand',  venue: 'SoFi Stadium',             result: null },
  { id: 'GG3', date: '2026-06-21', time: '22:00', group: 'G', round: 2, phase: 'group',
    team_a: 'Belgium',      team_b: 'Iran',         venue: 'SoFi Stadium',             result: null },
  { id: 'GG4', date: '2026-06-21', time: '16:00', group: 'G', round: 2, phase: 'group',
    team_a: 'New Zealand',  team_b: 'Egypt',        venue: 'BC Place',                 result: null },
  { id: 'GG5', date: '2026-06-26', time: '20:00', group: 'G', round: 3, phase: 'group',
    team_a: 'Egypt',        team_b: 'Iran',         venue: 'Lumen Field',              result: null },
  { id: 'GG6', date: '2026-06-26', time: '20:00', group: 'G', round: 3, phase: 'group',
    team_a: 'New Zealand',  team_b: 'Belgium',      venue: 'BC Place',                 result: null },

  // ── GRUPO H ───────────────────────────────────────────────────────────────
  { id: 'GH1', date: '2026-06-15', time: '19:00', group: 'H', round: 1, phase: 'group',
    team_a: 'Spain',        team_b: 'Cape Verde',   venue: 'Mercedes-Benz Stadium',    result: null },
  { id: 'GH2', date: '2026-06-15', time: '22:00', group: 'H', round: 1, phase: 'group',
    team_a: 'Saudi Arabia', team_b: 'Uruguay',      venue: 'Hard Rock Stadium',        result: null },
  { id: 'GH3', date: '2026-06-21', time: '19:00', group: 'H', round: 2, phase: 'group',
    team_a: 'Spain',        team_b: 'Saudi Arabia', venue: 'Mercedes-Benz Stadium',    result: null },
  { id: 'GH4', date: '2026-06-21', time: '22:00', group: 'H', round: 2, phase: 'group',
    team_a: 'Uruguay',      team_b: 'Cape Verde',   venue: 'Hard Rock Stadium',        result: null },
  { id: 'GH5', date: '2026-06-26', time: '20:00', group: 'H', round: 3, phase: 'group',
    team_a: 'Cape Verde',   team_b: 'Saudi Arabia', venue: 'NRG Stadium',              result: null },
  { id: 'GH6', date: '2026-06-26', time: '20:00', group: 'H', round: 3, phase: 'group',
    team_a: 'Uruguay',      team_b: 'Spain',        venue: 'Estadio Akron',            result: null },

  // ── GRUPO I ───────────────────────────────────────────────────────────────
  { id: 'GI1', date: '2026-06-16', time: '19:00', group: 'I', round: 1, phase: 'group',
    team_a: 'France',       team_b: 'Senegal',      venue: 'MetLife Stadium',           result: null },
  { id: 'GI2', date: '2026-06-16', time: '22:00', group: 'I', round: 1, phase: 'group',
    team_a: 'Iraq',         team_b: 'Norway',       venue: 'Gillette Stadium',          result: null },
  { id: 'GI3', date: '2026-06-22', time: '19:00', group: 'I', round: 2, phase: 'group',
    team_a: 'France',       team_b: 'Iraq',         venue: 'Lincoln Financial Field',   result: null },
  { id: 'GI4', date: '2026-06-22', time: '22:00', group: 'I', round: 2, phase: 'group',
    team_a: 'Norway',       team_b: 'Senegal',      venue: 'MetLife Stadium',           result: null },
  { id: 'GI5', date: '2026-06-26', time: '22:00', group: 'I', round: 3, phase: 'group',
    team_a: 'Norway',       team_b: 'France',       venue: 'Gillette Stadium',          result: null },
  { id: 'GI6', date: '2026-06-26', time: '22:00', group: 'I', round: 3, phase: 'group',
    team_a: 'Senegal',      team_b: 'Iraq',         venue: 'BMO Field',                result: null },

  // ── GRUPO J ───────────────────────────────────────────────────────────────
  { id: 'GJ1', date: '2026-06-16', time: '21:00', group: 'J', round: 1, phase: 'group',
    team_a: 'Argentina',    team_b: 'Algeria',      venue: 'Arrowhead Stadium',         result: null },
  { id: 'GJ2', date: '2026-06-17', time: '00:00', group: 'J', round: 1, phase: 'group',
    team_a: 'Austria',      team_b: 'Jordan',       venue: "Levi's Stadium",            result: null },
  { id: 'GJ3', date: '2026-06-22', time: '13:00', group: 'J', round: 2, phase: 'group',
    team_a: 'Argentina',    team_b: 'Austria',      venue: 'AT&T Stadium',              result: null },
  { id: 'GJ4', date: '2026-06-22', time: '23:00', group: 'J', round: 2, phase: 'group',
    team_a: 'Jordan',       team_b: 'Algeria',      venue: "Levi's Stadium",            result: null },
  { id: 'GJ5', date: '2026-06-27', time: '22:00', group: 'J', round: 3, phase: 'group',
    team_a: 'Algeria',      team_b: 'Austria',      venue: 'Arrowhead Stadium',         result: null },
  { id: 'GJ6', date: '2026-06-27', time: '22:00', group: 'J', round: 3, phase: 'group',
    team_a: 'Jordan',       team_b: 'Argentina',    venue: 'AT&T Stadium',              result: null },

  // ── GRUPO K ───────────────────────────────────────────────────────────────
  { id: 'GK1', date: '2026-06-17', time: '13:00', group: 'K', round: 1, phase: 'group',
    team_a: 'Portugal',     team_b: 'DR Congo',     venue: 'NRG Stadium',               result: null },
  { id: 'GK2', date: '2026-06-17', time: '22:00', group: 'K', round: 1, phase: 'group',
    team_a: 'Uzbekistan',   team_b: 'Colombia',     venue: 'Estadio Azteca',            result: null },
  { id: 'GK3', date: '2026-06-23', time: '13:00', group: 'K', round: 2, phase: 'group',
    team_a: 'Portugal',     team_b: 'Uzbekistan',   venue: 'NRG Stadium',               result: null },
  { id: 'GK4', date: '2026-06-23', time: '22:00', group: 'K', round: 2, phase: 'group',
    team_a: 'Colombia',     team_b: 'DR Congo',     venue: 'Estadio Akron',             result: null },
  { id: 'GK5', date: '2026-06-27', time: '19:30', group: 'K', round: 3, phase: 'group',
    team_a: 'Colombia',     team_b: 'Portugal',     venue: 'Hard Rock Stadium',         result: null },
  { id: 'GK6', date: '2026-06-27', time: '19:30', group: 'K', round: 3, phase: 'group',
    team_a: 'DR Congo',     team_b: 'Uzbekistan',   venue: 'Mercedes-Benz Stadium',     result: null },

  // ── GRUPO L ───────────────────────────────────────────────────────────────
  { id: 'GL1', date: '2026-06-17', time: '16:00', group: 'L', round: 1, phase: 'group',
    team_a: 'England',      team_b: 'Croatia',      venue: 'AT&T Stadium',              result: null },
  { id: 'GL2', date: '2026-06-17', time: '19:00', group: 'L', round: 1, phase: 'group',
    team_a: 'Ghana',        team_b: 'Panama',       venue: 'BMO Field',                 result: null },
  { id: 'GL3', date: '2026-06-23', time: '16:00', group: 'L', round: 2, phase: 'group',
    team_a: 'England',      team_b: 'Ghana',        venue: 'Gillette Stadium',          result: null },
  { id: 'GL4', date: '2026-06-23', time: '19:00', group: 'L', round: 2, phase: 'group',
    team_a: 'Panama',       team_b: 'Croatia',      venue: 'BMO Field',                 result: null },
  { id: 'GL5', date: '2026-06-27', time: '17:00', group: 'L', round: 3, phase: 'group',
    team_a: 'Panama',       team_b: 'England',      venue: 'MetLife Stadium',            result: null },
  { id: 'GL6', date: '2026-06-27', time: '17:00', group: 'L', round: 3, phase: 'group',
    team_a: 'Croatia',      team_b: 'Ghana',        venue: 'Lincoln Financial Field',   result: null },

  // ── RONDA DE 32 (Partidos 73–88, 28 jun – 3 jul) ─────────────────────────
  { id: 'R32_01', date: '2026-06-28', phase: 'r32', label: 'P73 — 1º Grp J vs 3º Grp C/D/F/G/H', team_a: null, team_b: null, venue: 'AT&T Stadium',             result: null },
  { id: 'R32_02', date: '2026-06-28', phase: 'r32', label: 'P74 — 1º Grp K vs 3º Grp A/B/C/D/H', team_a: null, team_b: null, venue: 'Hard Rock Stadium',        result: null },
  { id: 'R32_03', date: '2026-06-29', phase: 'r32', label: 'P75 — 1º Grp F vs 3º Grp A/B/E/I/J', team_a: null, team_b: null, venue: 'MetLife Stadium',           result: null },
  { id: 'R32_04', date: '2026-06-29', phase: 'r32', label: 'P76 — 1º Grp A vs 3º Grp G/H/K/L',   team_a: null, team_b: null, venue: 'BC Place',                  result: null },
  { id: 'R32_05', date: '2026-06-30', phase: 'r32', label: 'P77 — 1º Grp I vs 3º Grp C/D/F/G/H', team_a: null, team_b: null, venue: 'NRG Stadium',               result: null },
  { id: 'R32_06', date: '2026-06-30', phase: 'r32', label: 'P78 — 1º Grp B vs 3º Grp A/E/I/J/K', team_a: null, team_b: null, venue: 'Lumen Field',               result: null },
  { id: 'R32_07', date: '2026-07-01', phase: 'r32', label: 'P79 — 1º Grp C vs 3º Grp G/H/K/L',   team_a: null, team_b: null, venue: 'AT&T Stadium',              result: null },
  { id: 'R32_08', date: '2026-07-01', phase: 'r32', label: 'P80 — 1º Grp D vs 3º Grp B/E/I/J/K', team_a: null, team_b: null, venue: 'Gillette Stadium',          result: null },
  { id: 'R32_09', date: '2026-07-01', phase: 'r32', label: 'P81 — 2º Grp I vs 2º Grp J',          team_a: null, team_b: null, venue: "Levi's Stadium",            result: null },
  { id: 'R32_10', date: '2026-07-01', phase: 'r32', label: 'P82 — 2º Grp E vs 2º Grp G',          team_a: null, team_b: null, venue: 'Arrowhead Stadium',         result: null },
  { id: 'R32_11', date: '2026-07-02', phase: 'r32', label: 'P83 — 1º Grp E vs 2º Grp F',          team_a: null, team_b: null, venue: 'MetLife Stadium',           result: null },
  { id: 'R32_12', date: '2026-07-02', phase: 'r32', label: 'P84 — 1º Grp G vs 2º Grp H',          team_a: null, team_b: null, venue: 'Lincoln Financial Field',   result: null },
  { id: 'R32_13', date: '2026-07-02', phase: 'r32', label: 'P85 — 2º Grp C vs 2º Grp D',          team_a: null, team_b: null, venue: 'SoFi Stadium',              result: null },
  { id: 'R32_14', date: '2026-07-02', phase: 'r32', label: 'P86 — 2º Grp A vs 2º Grp B',          team_a: null, team_b: null, venue: 'BMO Field',                 result: null },
  { id: 'R32_15', date: '2026-07-03', phase: 'r32', label: 'P87 — 1º Grp H vs 2º Grp K',          team_a: null, team_b: null, venue: 'Mercedes-Benz Stadium',     result: null },
  { id: 'R32_16', date: '2026-07-03', phase: 'r32', label: 'P88 — 1º Grp L vs 2º Grp L',          team_a: null, team_b: null, venue: 'Estadio Azteca',            result: null },

  // ── OCTAVOS DE FINAL / Ronda de 16 (Partidos 89–96, 4–7 jul) ─────────────
  { id: 'R16_01', date: '2026-07-04', phase: 'r16', label: 'P89 — Ganador P77 vs Ganador P78', team_a: null, team_b: null, venue: 'Estadio BBVA',              result: null },
  { id: 'R16_02', date: '2026-07-04', phase: 'r16', label: 'P90 — Ganador P73 vs Ganador P74', team_a: null, team_b: null, venue: 'NRG Stadium',               result: null },
  { id: 'R16_03', date: '2026-07-05', phase: 'r16', label: 'P91 — Ganador P81 vs Ganador P82', team_a: null, team_b: null, venue: 'Arrowhead Stadium',         result: null },
  { id: 'R16_04', date: '2026-07-05', phase: 'r16', label: 'P92 — Ganador P85 vs Ganador P86', team_a: null, team_b: null, venue: 'Lincoln Financial Field',   result: null },
  { id: 'R16_05', date: '2026-07-06', phase: 'r16', label: 'P93 — Ganador P79 vs Ganador P80', team_a: null, team_b: null, venue: 'BC Place',                  result: null },
  { id: 'R16_06', date: '2026-07-06', phase: 'r16', label: 'P94 — Ganador P75 vs Ganador P76', team_a: null, team_b: null, venue: 'AT&T Stadium',              result: null },
  { id: 'R16_07', date: '2026-07-07', phase: 'r16', label: 'P95 — Ganador P83 vs Ganador P84', team_a: null, team_b: null, venue: 'SoFi Stadium',              result: null },
  { id: 'R16_08', date: '2026-07-07', phase: 'r16', label: 'P96 — Ganador P87 vs Ganador P88', team_a: null, team_b: null, venue: 'Lumen Field',               result: null },

  // ── CUARTOS DE FINAL (Partidos 97–100, 9–11 jul) ─────────────────────────
  { id: 'QF01', date: '2026-07-09', phase: 'qf', label: 'P97 — Ganador P89 vs Ganador P90', team_a: null, team_b: null, venue: 'MetLife Stadium',           result: null },
  { id: 'QF02', date: '2026-07-10', phase: 'qf', label: 'P98 — Ganador P91 vs Ganador P92', team_a: null, team_b: null, venue: 'Gillette Stadium',          result: null },
  { id: 'QF03', date: '2026-07-10', phase: 'qf', label: 'P99 — Ganador P93 vs Ganador P94', team_a: null, team_b: null, venue: 'Mercedes-Benz Stadium',     result: null },
  { id: 'QF04', date: '2026-07-11', phase: 'qf', label: 'P100 — Ganador P95 vs Ganador P96', team_a: null, team_b: null, venue: 'SoFi Stadium',             result: null },

  // ── SEMIFINALES (Partidos 101–102, 14–15 jul) ────────────────────────────
  { id: 'SF01', date: '2026-07-14', phase: 'sf', label: 'P101 — Ganador P97 vs Ganador P98', team_a: null, team_b: null, venue: 'MetLife Stadium',           result: null },
  { id: 'SF02', date: '2026-07-15', phase: 'sf', label: 'P102 — Ganador P99 vs Ganador P100', team_a: null, team_b: null, venue: 'AT&T Stadium',             result: null },

  // ── TERCER PUESTO (Partido 103, 18 jul) ──────────────────────────────────
  { id: 'TPP', date: '2026-07-18', phase: '3rd', label: 'P103 — Tercer Puesto', team_a: null, team_b: null, venue: 'Hard Rock Stadium',        result: null },

  // ── FINAL (Partido 104, 19 jul) ──────────────────────────────────────────
  { id: 'FIN', date: '2026-07-19', phase: 'final', label: 'P104 — FINAL', team_a: null, team_b: null, venue: 'MetLife Stadium',           result: null },
]

// ── HELPERS ──────────────────────────────────────────────────────────────────

export function getGroupFixtures(group) {
  return FIXTURES.filter(f => f.group === group)
}

export function getFixturesByDate(date) {
  return FIXTURES.filter(f => f.date === date)
}

export function isPlayed(fixture) {
  return fixture.result !== null
}

export function isTodayOrPast(fixture, today = '2026-06-13') {
  return fixture.date <= today
}

export const PHASE_LABELS = {
  group: 'Fase de Grupos',
  r32:   'Ronda de 32',
  r16:   'Octavos de Final',
  qf:    'Cuartos de Final',
  sf:    'Semifinales',
  '3rd': 'Tercer Puesto',
  final: 'Final',
}
