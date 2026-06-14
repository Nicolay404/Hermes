import { useState, useEffect } from 'react'
import axios from 'axios'
import WC2026BracketView from './WC2026BracketView.jsx'
import SearchableSelect from './SearchableSelect.jsx'
import { FIXTURES } from '../data/wc2026.js'

const API = 'http://localhost:8000'

// Extrae resultados reales de wc2026.js — solo partidos de grupos ya jugados
function getActualGroupResults() {
  return FIXTURES
    .filter(function(f) { return f.phase === 'group' && f.result !== null })
    .map(function(f) {
      return {
        team_a:  f.team_a,
        team_b:  f.team_b,
        goals_a: f.result.a,
        goals_b: f.result.b,
      }
    })
}

// Barra de probabilidad
function ProbBar({ value, max = 100, color = 'bg-green-600' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={color + ' h-full rounded-full'} style={{ width: pct + '%' }} />
      </div>
      <span className="text-[11px] text-gray-400 w-10 text-right font-mono">
        {value < 0.1 ? value.toFixed(2) : value.toFixed(1)}%
      </span>
    </div>
  )
}

// Tarjeta de campeon
function ChampCard({ team, prob, rank }) {
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
  const isGold = rank === 0
  return (
    <div className={
      'rounded-xl border p-3 flex items-center gap-3 ' +
      (isGold ? 'border-yellow-600/60 bg-yellow-950/30' : 'border-gray-800 bg-gray-900')
    }>
      <span className="text-xl shrink-0">{medals[rank] || ''}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white truncate">{team}</div>
        <ProbBar value={prob} color={isGold ? 'bg-yellow-500' : 'bg-green-600'} />
      </div>
      <span className={'text-lg font-black shrink-0 ' + (isGold ? 'text-yellow-400' : 'text-gray-400')}>
        {prob.toFixed(1)}%
      </span>
    </div>
  )
}

// Panel de probabilidades por ronda
// roundProbs tiene forma: { team: { R32, Octavos, Cuartos, Semifinal, Final, 'Campeón' } }
function RoundPanel({ roundProbs }) {
  const rounds = ['R32', 'Octavos', 'Cuartos', 'Semifinal', 'Final', 'Campeón']
  const labels = { 'R32': 'Octavos', 'Octavos': 'Octavos', 'Cuartos': 'Cuartos', 'Semifinal': 'Semis', 'Final': 'Final', 'Campeón': 'Campeón' }
  const colors = { 'R32': 'bg-gray-500', 'Octavos': 'bg-blue-500', 'Cuartos': 'bg-blue-600', 'Semifinal': 'bg-purple-600', 'Final': 'bg-orange-500', 'Campeón': 'bg-yellow-500' }
  const [selected, setSelected] = useState('Campeón')
  // Pivotear: de {team: {round: prob}} a {team: prob} para la ronda seleccionada
  const data = {}
  if (roundProbs) {
    for (const [team, probs] of Object.entries(roundProbs)) {
      if (probs && probs[selected] !== undefined) {
        data[team] = probs[selected]
      }
    }
  }
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 20)
  const maxVal = sorted[0] ? sorted[0][1] : 1

  return (
    <div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {rounds.map(function(r) {
          return (
            <button key={r}
              onClick={function() { setSelected(r) }}
              className={
                'text-xs px-3 py-1.5 rounded-full font-medium transition-colors ' +
                (selected === r ? colors[r] + ' text-white' : 'bg-gray-800 text-gray-400 hover:text-white')
              }>
              {labels[r]}
            </button>
          )
        })}
      </div>
      <div className="space-y-2">
        {sorted.map(function(entry) {
          var team = entry[0]; var prob = entry[1]
          return (
            <div key={team} className="flex items-center gap-2">
              <span className="text-sm text-gray-300 w-32 truncate">{team}</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={colors[selected] + ' h-full rounded-full'}
                  style={{ width: ((prob / maxVal) * 100) + '%' }}
                />
              </div>
              <span className="text-xs text-gray-400 w-10 text-right font-mono">{prob.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Panel de grupo
function GroupPanel({ groupAdv, groups }) {
  // Normalizar: groups puede ser un dict {A:[...]} o una lista ['A','B',...]
  const groupsDict = !groups
    ? {}
    : Array.isArray(groups)
      ? Object.fromEntries(groups.map(function(g) { return [g, []] }))
      : groups
  const groupIds = Object.keys(groupsDict).sort()
  const [selGroup, setSelGroup] = useState(groupIds[0] || 'A')
  const teams = (groupsDict && groupsDict[selGroup]) || []
  const adv = (groupAdv && groupAdv[selGroup]) || {}

  return (
    <div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {groupIds.map(function(g) {
          return (
            <button key={g}
              onClick={function() { setSelGroup(g) }}
              className={
                'w-9 h-9 rounded-lg text-sm font-bold transition-colors ' +
                (selGroup === g ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')
              }>
              {g}
            </button>
          )
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gray-500 uppercase">
              <th className="text-left pb-2">Equipo</th>
              <th className="text-right pb-2">P(1)</th>
              <th className="text-right pb-2">P(2)</th>
              <th className="text-right pb-2">P(3)</th>
              <th className="text-right pb-2">P(Camp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {teams.map(function(team) {
              const slots = adv[team] || {}
              const p1 = ((slots['p1st']    || 0) * 100).toFixed(0)
              const p2 = ((slots['p2nd']    || 0) * 100).toFixed(0)
              const p3 = ((slots['p3rd_adv']|| 0) * 100).toFixed(0)
              const pC = ((slots['pchamp']  || 0) * 100).toFixed(1)
              return (
                <tr key={team} className="hover:bg-gray-800/50">
                  <td className="py-2 font-medium text-white">{team}</td>
                  <td className="py-2 text-right text-green-400 font-mono">{p1}%</td>
                  <td className="py-2 text-right text-blue-400 font-mono">{p2}%</td>
                  <td className="py-2 text-right text-yellow-500 font-mono">{p3}%</td>
                  <td className="py-2 text-right text-orange-400 font-bold font-mono">{pC}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Simulacion WC2026
function WC2026Sim() {
  const [nSim, setNSim] = useState(5000)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('champions')

  const actualResults = getActualGroupResults()

  function run() {
    setLoading(true)
    setError(null)
    axios.post(API + '/simulate_wc2026', {
      n_simulations: nSim,
      venue_name: 'Sede Neutral',
      match_type: 'mundial',
      actual_results: actualResults,
    }).then(function(res) {
      setResult(res.data)
      setTab('champions')
    }).catch(function(err) {
      setError((err.response && err.response.data && err.response.data.detail) || 'Error en la simulacion')
    }).finally(function() {
      setLoading(false)
    })
  }

  const champProbs = result
    ? Object.entries(result.champion_probabilities || {})
        .map(function(e) { return [e[0], e[1] * 100] })
        .sort(function(a, b) { return b[1] - a[1] })
    : []

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="card-header">Mundial 2026 — Simulacion Completa</h2>

        {/* Badge de resultados reales detectados */}
        {actualResults.length > 0 ? (
          <div className="flex items-center gap-2 mb-3 bg-green-900/20 border border-green-800/50 rounded-lg px-3 py-2">
            <span className="text-green-400 text-sm">✓</span>
            <p className="text-xs text-green-300">
              <span className="font-bold">{actualResults.length} partidos jugados</span> detectados en wc2026.js —
              sus resultados reales se fijarán en cada iteración. Solo se simulan los partidos pendientes.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3 bg-gray-800/40 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-gray-500 text-sm">○</span>
            <p className="text-xs text-gray-500">Sin resultados reales cargados — simulación completa desde cero.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-400">Simulaciones:</span>
          {[2000, 5000, 10000, 25000].map(function(n) {
            return (
              <button key={n}
                onClick={function() { setNSim(n) }}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
                  (nSim === n ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')
                }>
                {n >= 1000 ? (n / 1000) + 'K' : n}
              </button>
            )
          })}
          <button
            onClick={run}
            disabled={loading}
            className="btn-primary ml-auto flex items-center gap-2">
            {loading ? 'Simulando...' : 'Simular WC2026 (' + nSim.toLocaleString() + ' iter)'}
          </button>
        </div>
        {error && (
          <div className="mt-3 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="card text-center py-12">
          <p className="text-gray-400">Simulando {nSim.toLocaleString()} Mundiales...</p>
          {actualResults.length > 0 && (
            <p className="text-xs text-green-700 mt-1">
              {actualResults.length} resultados reales fijados · simulando partidos pendientes
            </p>
          )}
          <p className="text-xs text-gray-600 mt-1">72 partidos de grupos + 32 eliminatorias por iteracion</p>
        </div>
      )}

      {result && (
        <WC2026BracketView
          groupAdv={result.group_advancement}
          roundProbs={result.round_probabilities}
          champProbs={result.champion_probabilities}
          groups={result.groups}
          allTeams={result.all_teams}
        />
      )}

      {result && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Resultados</h3>
              <p className="text-xs text-gray-500">
                {result.n_simulations && result.n_simulations.toLocaleString()} simulaciones
                {result.actual_results_used > 0 && (
                  <span className="ml-2 text-green-600">· {result.actual_results_used} resultados reales fijados</span>
                )}
              </p>
            </div>
            <div className="flex gap-1">
              {[
                { id: 'champions', label: 'Campeones' },
                { id: 'groups', label: 'Grupos' },
                { id: 'rounds', label: 'Por Ronda' },
              ].map(function(t) {
                return (
                  <button key={t.id}
                    onClick={function() { setTab(t.id) }}
                    className={
                      'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ' +
                      (tab === t.id ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')
                    }>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {tab === 'champions' && (
            <div className="space-y-2">
              {champProbs.slice(0, 10).map(function(entry, i) {
                return <ChampCard key={entry[0]} team={entry[0]} prob={entry[1]} rank={i} />
              })}
            </div>
          )}

          {tab === 'groups' && (
            <GroupPanel groupAdv={result.group_advancement} groups={result.groups} />
          )}

          {tab === 'rounds' && (
            <RoundPanel roundProbs={result.round_probabilities} />
          )}
        </div>
      )}
    </div>
  )
}

// Bracket personalizado
function CustomBracket() {
  const [teams, setTeams] = useState([])
  const [size, setSize] = useState(8)
  const [slots, setSlots] = useState(Array(32).fill(null))
  const [nSim, setNSim] = useState(10000)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(function() {
    axios.get(API + '/teams').then(function(r) {
      setTeams(r.data.teams || [])
    }).catch(function() {})
  }, [])

  function setSlot(i, opt) {
    setSlots(function(prev) {
      var s = prev.slice()
      s[i] = opt
      return s
    })
  }

  function run() {
    var filled = slots.slice(0, size).filter(Boolean)
    if (filled.length < 2) { setError('Necesitas al menos 2 equipos'); return }
    var bracket = Array(size).fill(0).map(function(_, i) {
      return (slots[i] && slots[i].name) || filled[0].name
    })
    setLoading(true)
    setError(null)
    axios.post(API + '/simulate_tournament', {
      bracket: bracket,
      venue_name: 'Sede Neutral',
      match_type: 'mundial',
      n_simulations: nSim,
    }).then(function(res) {
      setResult(res.data)
    }).catch(function(err) {
      setError((err.response && err.response.data && err.response.data.detail) || 'Error en la simulacion')
    }).finally(function() {
      setLoading(false)
    })
  }

  const champProbs = result
    ? Object.entries(result.champion_probabilities || {})
        .map(function(e) {
          var p = typeof e[1] === 'number' ? (e[1] <= 1 ? e[1] * 100 : e[1]) : 0
          return [e[0], p]
        })
        .sort(function(a, b) { return b[1] - a[1] })
    : []

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="card-header">Bracket Personalizado</h2>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-400">Equipos:</span>
          {[4, 8, 16, 32].map(function(s) {
            return (
              <button key={s}
                onClick={function() { setSize(s); setSlots(Array(32).fill(null)) }}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
                  (size === s ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')
                }>
                {s}
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {Array(size).fill(0).map(function(_, i) {
            return (
              <SearchableSelect
                key={i}
                options={teams}
                value={(slots[i] && slots[i].name) || ''}
                onChange={function(opt) { setSlot(i, opt) }}
                placeholder={'Equipo ' + (i + 1)}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Simulaciones:</span>
          {[5000, 10000, 25000].map(function(n) {
            return (
              <button key={n}
                onClick={function() { setNSim(n) }}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
                  (nSim === n ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')
                }>
                {(n / 1000) + 'K'}
              </button>
            )
          })}
          <button onClick={run} disabled={loading} className="btn-primary ml-auto">
            {loading ? 'Simulando...' : 'Simular'}
          </button>
        </div>
        {error && (
          <div className="mt-3 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="card">
          <h3 className="card-header">Probabilidades de Campeon</h3>
          <div className="space-y-2">
            {champProbs.slice(0, 16).map(function(entry, i) {
              return <ChampCard key={entry[0]} team={entry[0]} prob={entry[1]} rank={i} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente raiz
export default function TournamentBracket() {
  const [tab, setTab] = useState('wc2026')

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={function() { setTab('wc2026') }}
          className={'tab-btn ' + (tab === 'wc2026' ? 'tab-active' : 'tab-inactive')}>
          Mundial 2026
        </button>
        <button
          onClick={function() { setTab('custom') }}
          className={'tab-btn ' + (tab === 'custom' ? 'tab-active' : 'tab-inactive')}>
          Bracket Personalizado
        </button>
      </div>

      {tab === 'wc2026' && <WC2026Sim />}
      {tab === 'custom' && <CustomBracket />}
    </div>
  )
}
