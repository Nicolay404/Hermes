import { useState, useEffect } from 'react'
import axios from 'axios'
import SearchableSelect from './SearchableSelect.jsx'
import StatsBreakdown from './StatsBreakdown.jsx'
import BaleySidebar from './BaleySidebar.jsx'
import ExternalPreview from './ExternalPreview.jsx'
import WC2026Picker from './WC2026Picker.jsx'
import TodayMatches from './TodayMatches.jsx'
import { FIXTURES } from '../data/wc2026.js'

const API = 'http://localhost:8000'

const MODES = [
  { id: 'single',     label: 'Partido especifico', icon: '⚽', desc: 'Predice cualquier partido manualmente' },
  { id: 'jornada',    label: 'Jornada del dia',    icon: 'Hoy', desc: 'Todos los partidos del dia con combinada Baley' },
  { id: 'resultados', label: 'Resultados vs Modelo', icon: '📊', desc: 'Compara el modelo con resultados reales' },
]

const MATCH_TYPES = [
  { value: 'mundial',            label: 'Mundial' },
  { value: 'clasificatoria',     label: 'Clasificatoria' },
  { value: 'torneo_continental', label: 'Torneo Continental' },
  { value: 'nations_league',     label: 'Nations League' },
  { value: 'amistoso',           label: 'Amistoso' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: barra 1X2 y marcadores
// ─────────────────────────────────────────────────────────────────────────────
function ProbBar({ pA, pX, pB, nameA, nameB }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className="font-bold text-green-400">{nameA}</span>
        <span>Empate</span>
        <span className="font-bold text-blue-400">{nameB}</span>
      </div>
      <div className="flex h-6 rounded-full overflow-hidden text-[11px] font-bold">
        <div className="bg-green-600 flex items-center justify-center" style={{ width: `${pA}%` }}>
          {pA >= 10 && `${pA}%`}
        </div>
        <div className="bg-gray-600 flex items-center justify-center" style={{ width: `${pX}%` }}>
          {pX >= 8 && `${pX}%`}
        </div>
        <div className="bg-blue-600 flex items-center justify-center" style={{ width: `${pB}%` }}>
          {pB >= 10 && `${pB}%`}
        </div>
      </div>
    </div>
  )
}

function TopScores({ scores }) {
  if (!scores?.length) return null
  return (
    <div className="card mt-4">
      <h3 className="card-header">Marcadores Mas Probables</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {scores.slice(0, 8).map((s, i) => (
          <div key={i} className={`rounded-lg p-2 text-center border ${i === 0 ? 'border-green-700 bg-green-950/50' : 'border-gray-800 bg-gray-900'}`}>
            <div className="text-xl font-bold text-white">{s.score_a}-{s.score_b}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{(s.probability * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PredictionResult({ result, teamA, teamB }) {
  if (!result) return null
  const probs = result.probabilities || {}
  const pA = Math.round((probs.home_win || 0) * 100)
  const pX = Math.round((probs.draw || 0) * 100)
  const pB = Math.round((probs.away_win || 0) * 100)
  const xg    = result.expected_goals || {}
  const score = result.most_likely_score || {}
  const str   = result.strengths || {}

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="text-center flex-1">
            <div className="text-2xl font-black text-white leading-tight">{teamA}</div>
            <div className="text-xs text-gray-500 mt-1">xG: <span className="text-green-400 font-bold">{xg.team_a}</span></div>
            <div className="text-[11px] text-gray-600">Fuerza: {((str.team_a_adjusted || 0) * 100).toFixed(1)}</div>
          </div>
          <div className="text-center shrink-0">
            <div className="text-4xl font-black text-white">{score.score_a ?? '-'}-{score.score_b ?? '-'}</div>
            <div className="text-[10px] text-gray-600 mt-1">marcador mas probable</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-2xl font-black text-white leading-tight">{teamB}</div>
            <div className="text-xs text-gray-500 mt-1">xG: <span className="text-blue-400 font-bold">{xg.team_b}</span></div>
            <div className="text-[11px] text-gray-600">Fuerza: {((str.team_b_adjusted || 0) * 100).toFixed(1)}</div>
          </div>
        </div>
        <ProbBar pA={pA} pX={pX} pB={pB} nameA={teamA} nameB={teamB} />
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          {[
            [teamA + ' gana', pA + '%', 'text-green-400'],
            ['Empate',        pX + '%', 'text-gray-300'],
            [teamB + ' gana', pB + '%', 'text-blue-400'],
          ].map(([label, val, cls]) => (
            <div key={label} className="bg-gray-800 rounded-lg py-2">
              <div className={`text-xl font-black ${cls}`}>{val}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
      <TopScores scores={result.top_scores} />
      <StatsBreakdown stats={result.stats} teamA={teamA} teamB={teamB} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modo: Resultados vs Modelo
// ─────────────────────────────────────────────────────────────────────────────
function ProbCell({ label, pct, isModel, isActual }) {
  let badge = null
  if (isModel && isActual) badge = <div className="text-[8px] text-green-400">modelo + real</div>
  else if (isModel)        badge = <div className="text-[8px] text-blue-400">modelo</div>
  else if (isActual)       badge = <div className="text-[8px] text-green-400">real</div>

  return (
    <div className={`rounded-lg py-1.5 text-center ${isActual ? 'bg-green-900/30 border border-green-700/50' : 'bg-gray-900'}`}>
      <div className="text-[9px] text-gray-500">{label}</div>
      <div className={`text-base font-black ${isModel ? 'text-white' : 'text-gray-500'}`}>{pct}%</div>
      {badge}
    </div>
  )
}

function MatchCompareCard({ fix, pred, onPredict, isLoading }) {
  const p   = pred?.probabilities || {}
  const xg  = pred?.expected_goals || {}
  const pHW = Math.round((p.home_win || 0) * 100)
  const pD  = Math.round((p.draw     || 0) * 100)
  const pAW = Math.round((p.away_win || 0) * 100)

  const borderClass =
    pred?._correct === true  ? 'border-green-800/60' :
    pred?._correct === false ? 'border-red-800/60'   :
    'border-gray-800'

  const modelLabel  = pred ? (pred._model  === 'home' ? '1 ' + fix.team_a : pred._model  === 'away' ? '2 ' + fix.team_b : 'X Empate') : ''
  const actualLabel = pred ? (pred._actual === 'home' ? '1 ' + fix.team_a : pred._actual === 'away' ? '2 ' + fix.team_b : 'X Empate') : ''

  const xgError = xg.home != null
    ? (Math.abs(xg.home - fix.result.a) + Math.abs(xg.away - fix.result.b)).toFixed(2)
    : null

  return (
    <div className={`card border ${borderClass}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="font-bold text-white text-sm">
            {fix.team_a} <span className="text-gray-600 font-normal">vs</span> {fix.team_b}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 flex gap-2 flex-wrap">
            {fix.date  && <span>{fix.date}</span>}
            {fix.venue && <span>{fix.venue}</span>}
            {fix.group && <span>Grupo {fix.group}</span>}
          </div>
        </div>
        <div className="text-center shrink-0">
          <div className="text-2xl font-black text-white leading-none">{fix.result.a}-{fix.result.b}</div>
          <div className="text-[9px] text-green-500 uppercase tracking-wide">Real</div>
        </div>
      </div>

      {!pred && !isLoading && (
        <button
          onClick={onPredict}
          className="w-full text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg py-2 transition-colors"
        >
          Predecir con el modelo
        </button>
      )}

      {isLoading && (
        <div className="text-xs text-yellow-400 animate-pulse text-center py-2">Calculando...</div>
      )}

      {pred && pred.error && (
        <div className="text-xs text-red-400">Error: {pred.error}</div>
      )}

      {pred && !pred.error && (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${pred._correct ? 'bg-green-900/25 text-green-300' : 'bg-red-900/25 text-red-300'}`}>
            <span>{pred._correct ? 'OK' : 'X'}</span>
            <span>Modelo: <strong>{modelLabel}</strong> | Real: <strong>{actualLabel}</strong></span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <ProbCell label="1" pct={pHW} isModel={pred._model === 'home'} isActual={pred._actual === 'home'} />
            <ProbCell label="X" pct={pD}  isModel={pred._model === 'draw'} isActual={pred._actual === 'draw'} />
            <ProbCell label="2" pct={pAW} isModel={pred._model === 'away'} isActual={pred._actual === 'away'} />
          </div>

          {xg.home != null && (
            <div className="text-[10px] text-gray-500 flex gap-3 justify-center flex-wrap">
              <span>xG: <span className="text-white">{xg.home.toFixed(2)}-{xg.away.toFixed(2)}</span></span>
              <span className="text-gray-700">|</span>
              <span>Real: <span className="text-green-300">{fix.result.a}-{fix.result.b}</span></span>
              <span className="text-gray-700">|</span>
              <span>Error xG: <span className={parseFloat(xgError) < 1.5 ? 'text-green-400' : 'text-gray-400'}>{xgError}</span></span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultsComparison() {
  const finished = FIXTURES.filter(f => f.result !== null && f.team_a && f.team_b)
  const [preds, setPreds]           = useState({})
  const [loadingId, setLoadingId]   = useState(null)
  const [filter, setFilter]         = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const dates = [...new Set(finished.map(f => f.date))].sort()

  const visible = finished.filter(f => {
    if (dateFilter && f.date !== dateFilter) return false
    const p = preds[f.id]
    if (!p || p.error) return filter === 'all'
    if (filter === 'correct') return p._correct === true
    if (filter === 'wrong')   return p._correct === false
    return true
  })

  async function predictOne(fix) {
    setLoadingId(fix.id)
    try {
      const { data } = await axios.post(`${API}/predict_match`, {
        team_a:     fix.team_a,
        team_b:     fix.team_b,
        venue_name: fix.venue || 'Sede Neutral',
        match_type: 'mundial',
      })
      const p   = data.probabilities || {}
      const pHW = p.home_win || 0
      const pD  = p.draw     || 0
      const pAW = p.away_win || 0
      const ra  = fix.result.a
      const rb  = fix.result.b
      const actualOutcome = ra > rb ? 'home' : rb > ra ? 'away' : 'draw'
      const modelOutcome  = pHW >= pD && pHW >= pAW ? 'home' : pAW > pD ? 'away' : 'draw'
      setPreds(prev => ({
        ...prev,
        [fix.id]: { ...data, _actual: actualOutcome, _model: modelOutcome, _correct: actualOutcome === modelOutcome },
      }))
    } catch (err) {
      setPreds(prev => ({ ...prev, [fix.id]: { error: err.response?.data?.detail || 'Error' } }))
    }
    setLoadingId(null)
  }

  async function predictAll() {
    for (const fix of visible) {
      if (!preds[fix.id]) await predictOne(fix)
    }
  }

  const predicted = Object.values(preds).filter(p => !p.error && p._correct !== undefined)
  const correct   = predicted.filter(p => p._correct).length
  const accuracy  = predicted.length ? Math.round((correct / predicted.length) * 100) : null
  const pending   = visible.filter(f => !preds[f.id]).length

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h2 className="card-header mb-0">Resultados vs Modelo</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {finished.length} partidos finalizados. Compara la prediccion del modelo con el resultado real para calibrar.
            </p>
          </div>
          {accuracy !== null && (
            <div className="text-center bg-gray-900 rounded-xl px-4 py-2">
              <div className={`text-3xl font-black ${accuracy >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                {accuracy}%
              </div>
              <div className="text-[10px] text-gray-500">aciertos ({correct}/{predicted.length})</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <select
            className="select-field text-xs py-1 flex-1 min-w-[160px]"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          >
            <option value="">Todas las fechas</option>
            {dates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <div className="flex rounded-lg overflow-hidden border border-gray-700 text-xs">
            {[['all', 'Todos'], ['correct', 'Acertados'], ['wrong', 'Fallados']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-3 py-1.5 ${filter === v ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={predictAll}
            disabled={loadingId !== null || pending === 0}
            className="btn-secondary text-xs py-1.5"
          >
            {loadingId ? 'Calculando...' : `Predecir todos (${pending} pendientes)`}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map(fix => (
          <MatchCompareCard
            key={fix.id}
            fix={fix}
            pred={preds[fix.id] || null}
            onPredict={() => predictOne(fix)}
            isLoading={loadingId === fix.id}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="card text-center py-10 text-gray-500">
          No hay partidos finalizados{dateFilter ? ` el ${dateFilter}` : ''}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function MatchPredictor() {
  const [mode, setMode]             = useState('single')
  const [teams, setTeams]           = useState([])
  const [venues, setVenues]         = useState([])
  const [teamA, setTeamA]           = useState(null)
  const [teamB, setTeamB]           = useState(null)
  const [venue, setVenue]           = useState('Sede Neutral')
  const [matchType, setMatchType]   = useState('mundial')
  const [homeA, setHomeA]           = useState(false)
  const [useLocalLlm, setUseLocalLlm] = useState(false)
  const [llmUrl, setLlmUrl]         = useState('http://127.0.0.1:1234')
  const [llmModel, setLlmModel]     = useState('google/gemma-3-4b')
  const [useGemini, setUseGemini]   = useState(false)
  const [geminiKey, setGeminiKey]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)
  const [baleyText, setBaleyText]   = useState(null)
  const [showExternal, setShowExternal] = useState(false)

  const usingLlm = useLocalLlm || useGemini

  useEffect(() => {
    axios.get(`${API}/teams`).then(r => setTeams(r.data.teams || [])).catch(() => {})
    axios.get(`${API}/venues`).then(r => setVenues(r.data.venues || [])).catch(() => {})
  }, [])

  async function handlePredict() {
    if (!teamA || !teamB) { setError('Selecciona ambos equipos'); return }
    if (teamA.name === teamB.name) { setError('Los equipos no pueden ser el mismo'); return }
    setLoading(true); setError(null); setResult(null); setBaleyText(null)
    try {
      const { data } = await axios.post(`${API}/predict_match`, {
        team_a:          teamA.name,
        team_b:          teamB.name,
        venue_name:      venue,
        match_type:      matchType,
        team_a_is_home:  homeA,
        use_gemini:      useGemini && !!geminiKey,
        gemini_api_key:  geminiKey || null,
        use_local_llm:   useLocalLlm,
        local_llm_url:   llmUrl,
        local_llm_model: llmModel,
      })
      setResult(data)
      if (data.gemini_interpretation) setBaleyText(data.gemini_interpretation)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al predecir el partido')
    } finally {
      setLoading(false)
    }
  }

  function handlePickerSelect({ team_a, team_b, venue_name, match_type }) {
    const findTeam = name => teams.find(t => t.name === name) || { name, code: name }
    setTeamA(findTeam(team_a))
    setTeamB(findTeam(team_b))
    if (venue_name) setVenue(venue_name)
    if (match_type) setMatchType(match_type)
    setResult(null); setBaleyText(null); setError(null)
    setMode('single')
  }

  return (
    <div className="space-y-4">

      {/* Selector de modo */}
      <div className="flex flex-wrap gap-2">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 min-w-[180px] text-left px-4 py-3 rounded-xl border transition-all ${
              mode === m.id
                ? 'bg-green-600/20 border-green-600 text-white'
                : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            <div className="font-semibold text-sm">{m.icon} {m.label}</div>
            <div className="text-[10px] opacity-60 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Modo: Jornada */}
      {mode === 'jornada' && <TodayMatches />}

      {/* Modo: Resultados vs Modelo */}
      {mode === 'resultados' && <ResultsComparison />}

      {/* Modo: Partido especifico */}
      {mode === 'single' && (
        <div className={usingLlm ? 'grid grid-cols-[1fr_440px] gap-4 h-[calc(100vh-200px)]' : 'flex gap-4'}>

          {/* Columna izquierda */}
          <div className={`min-w-0 space-y-4 ${usingLlm ? 'overflow-y-auto pr-1' : 'flex-1'}`}>

            <WC2026Picker onSelectMatch={handlePickerSelect} />

            <div className="card">
              <h2 className="card-header">Predictor de Partido</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <SearchableSelect
                  label="Equipo A (local / favorito)"
                  options={teams}
                  value={teamA?.name || ''}
                  onChange={setTeamA}
                  placeholder="Buscar equipo A..."
                />
                <SearchableSelect
                  label="Equipo B (visitante)"
                  options={teams}
                  value={teamB?.name || ''}
                  onChange={setTeamB}
                  placeholder="Buscar equipo B..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">Sede</label>
                  <select className="select-field" value={venue} onChange={e => setVenue(e.target.value)}>
                    <option value="Sede Neutral">Sede Neutral</option>
                    {venues.map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.country})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">Tipo de partido</label>
                  <select className="select-field" value={matchType} onChange={e => setMatchType(e.target.value)}>
                    {MATCH_TYPES.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300 mb-4 cursor-pointer select-none w-fit">
                <input type="checkbox" checked={homeA} onChange={e => setHomeA(e.target.checked)} className="accent-green-500 w-4 h-4" />
                El equipo A juega de local
              </label>

              <div className="border-t border-gray-800 pt-4 space-y-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Interpretacion IA (Baley)</p>

                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none w-fit">
                    <input type="checkbox" checked={useLocalLlm}
                      onChange={e => { setUseLocalLlm(e.target.checked); if (e.target.checked) setUseGemini(false) }}
                      className="accent-green-500 w-4 h-4" />
                    Modelo local (Ollama, LM Studio)
                  </label>
                  {useLocalLlm && (
                    <div className="grid grid-cols-2 gap-3 mt-2 pl-6">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">URL del servidor</label>
                        <input type="text" className="input-field text-sm" value={llmUrl}
                          onChange={e => setLlmUrl(e.target.value)} placeholder="http://127.0.0.1:1234" />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Modelo</label>
                        <input type="text" className="input-field text-sm" value={llmModel}
                          onChange={e => setLlmModel(e.target.value)} placeholder="google/gemma-3-4b" />
                      </div>
                    </div>
                  )}
                </div>

                {!useLocalLlm && (
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none w-fit">
                      <input type="checkbox" checked={useGemini} onChange={e => setUseGemini(e.target.checked)} className="accent-green-500 w-4 h-4" />
                      Gemini API
                    </label>
                    {useGemini && (
                      <div className="mt-2 pl-6">
                        <label className="text-[11px] text-gray-500 block mb-1">API Key de Gemini</label>
                        <input type="password" className="input-field text-sm" value={geminiKey}
                          onChange={e => setGeminiKey(e.target.value)} placeholder="AIza..." />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={handlePredict}
                  disabled={loading || !teamA || !teamB}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? <><span className="animate-spin">O</span> Calculando...</> : 'Predecir Partido'}
                </button>
                {teamA && teamB && (
                  <button onClick={() => setShowExternal(v => !v)} className="btn-secondary text-sm">
                    {showExternal ? 'Cerrar' : 'Vista previa externa'}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-3 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2">
                  {error}
                </div>
              )}
            </div>

            {showExternal && teamA && teamB && (
              <ExternalPreview
                teamACode={teamA.code}
                teamBCode={teamB.code}
                teamAName={teamA.name}
                teamBName={teamB.name}
                venueName={venue}
              />
            )}

            {loading && (
              <div className="card text-center py-10">
                <p className="text-gray-400">Ejecutando modelo Klement + Monte Carlo...</p>
                {usingLlm && <p className="text-xs text-gray-600 mt-1">Baley esta analizando...</p>}
              </div>
            )}

            {result && !loading && (
              <PredictionResult result={result} teamA={teamA?.name} teamB={teamB?.name} />
            )}

          </div>

          {/* Sidebar Baley */}
          {usingLlm && (
            <div className="h-full min-h-0">
              <BaleySidebar
                rawText={baleyText}
                loading={loading}
                teamA={teamA?.name || ''}
                teamB={teamB?.name || ''}
                predictionData={result}
                useLocalLlm={useLocalLlm}
                llmUrl={llmUrl}
                llmModel={llmModel}
                useGemini={useGemini}
                geminiKey={geminiKey}
              />
            </div>
          )}

        </div>
      )}

    </div>
  )
}
