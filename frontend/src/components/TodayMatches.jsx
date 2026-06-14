/**
 * TodayMatches.jsx
 * Pronóstico completo de la jornada del día.
 * → Detecta todos los partidos de la fecha en wc2026.js
 * → Los predice uno a uno con /predict_match
 * → Muestra mini-tarjeta por partido (probs, xG, recomendación Baley)
 * → Al final Baley genera combinada óptima, conservadora y arriesgada
 */

import { useState } from 'react'
import axios from 'axios'
import { FIXTURES } from '../data/wc2026.js'

const API = 'http://localhost:8000'

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0]  // "2026-06-13"
}

function parseInterp(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

function pct(v) { return ((v || 0) * 100).toFixed(0) + '%' }

function probBarColor(p) {
  if (p >= 0.55) return '#22c55e'
  if (p >= 0.38) return '#f59e0b'
  return '#ef4444'
}

function phaseLabel(phase) {
  const m = { group: 'Grupos', r32: 'Ronda 32', r16: 'Octavos', qf: 'Cuartos', sf: 'Semis', final: 'Final' }
  return m[phase] || phase
}

// ── Mini tarjeta por partido ──────────────────────────────────────────────────
function MatchCard({ fixture, pred, isLoading }) {
  const [expanded, setExpanded] = useState(false)
  const probs = pred?.probabilities || {}
  const xg   = pred?.expected_goals || {}
  const mc   = pred?.monte_carlo || {}
  const interp = parseInterp(pred?.gemini_interpretation)

  const homeW = probs.home_win || 0
  const draw  = probs.draw     || 0
  const awayW = probs.away_win || 0

  const apuesta     = interp?.apuesta_segura || null
  const combinada   = interp?.combinada      || null
  const golesRec    = interp?.goles          || null

  const hasResult = fixture.result !== null

  return (
    <div className={`card transition-all ${isLoading ? 'opacity-70' : ''}`}>
      {/* Cabecera: equipos + resultado real */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{fixture.team_a}</span>
            <span className="text-gray-600 text-xs">vs</span>
            <span className="font-bold text-white text-sm">{fixture.team_b}</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 flex flex-wrap gap-x-2">
            {fixture.time && <span>🕐 {fixture.time}</span>}
            {fixture.venue && <span>🏟️ {fixture.venue}</span>}
            {fixture.group && <span>Grupo {fixture.group}</span>}
            <span className="text-gray-700">{phaseLabel(fixture.phase)}</span>
          </div>
        </div>

        {/* Resultado real */}
        {hasResult ? (
          <div className="text-center shrink-0">
            <div className="text-2xl font-black text-white leading-none">
              {fixture.result.a} – {fixture.result.b}
            </div>
            <div className="text-[9px] text-green-500 uppercase tracking-wider mt-0.5">Jugado</div>
          </div>
        ) : isLoading ? (
          <div className="text-[10px] text-yellow-400 animate-pulse shrink-0">Analizando...</div>
        ) : null}
      </div>

      {/* Sin predicción aún */}
      {!pred && !isLoading && (
        <div className="text-[11px] text-gray-600 italic">Pendiente de análisis</div>
      )}

      {pred?.error && (
        <div className="text-xs text-red-400">⚠️ Error al predecir este partido</div>
      )}

      {/* Predicción disponible */}
      {pred && !pred.error && (
        <div className="space-y-2.5">
          {/* Barras 1 / X / 2 */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: `1 · ${fixture.team_a}`, p: homeW },
              { label: 'Empate', p: draw },
              { label: `2 · ${fixture.team_b}`, p: awayW },
            ].map(({ label, p }) => (
              <div key={label} className="bg-gray-900 rounded-lg p-2 text-center relative overflow-hidden">
                {/* Fondo de probabilidad */}
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{ background: probBarColor(p), width: `${Math.round(p * 100)}%` }}
                />
                <div className="text-[8px] text-gray-500 truncate z-10 relative">{label}</div>
                <div className="text-xl font-black z-10 relative" style={{ color: probBarColor(p) }}>
                  {Math.round(p * 100)}%
                </div>
              </div>
            ))}
          </div>

          {/* xG + goles esperados */}
          <div className="flex items-center justify-between text-[10px] bg-gray-900/50 rounded px-2 py-1">
            <span className="text-gray-400">
              xG: <span className="text-white font-mono">{xg.home?.toFixed(2) || '–'}</span>
              <span className="text-gray-600 mx-1">–</span>
              <span className="text-white font-mono">{xg.away?.toFixed(2) || '–'}</span>
            </span>
            {xg.home != null && xg.away != null && (
              <span className={
                (xg.home + xg.away) > 2.5
                  ? 'text-orange-400 font-medium'
                  : 'text-gray-500'
              }>
                Total: {(xg.home + xg.away).toFixed(2)} goles esp.
                {(xg.home + xg.away) > 2.5 ? ' 🔥' : ''}
              </span>
            )}
          </div>

          {/* Recomendación Baley individual */}
          {apuesta && (
            <div className="bg-green-900/20 border border-green-800/40 rounded-lg px-3 py-2">
              <div className="text-[8px] text-green-500 uppercase tracking-widest mb-0.5">
                ✅ Apuesta segura
              </div>
              <div className="text-[11px] text-green-300 leading-snug">{apuesta}</div>
            </div>
          )}

          {/* Expandir detalles */}
          {(combinada || golesRec || mc.btts_prob) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-[10px] text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 pt-1"
            >
              {expanded ? '▲ Menos detalles' : '▼ Más detalles (combinada, goles, BTTS)'}
            </button>
          )}

          {expanded && (
            <div className="space-y-2 border-t border-gray-800 pt-2">
              {combinada && (
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2">
                  <div className="text-[8px] text-blue-400 uppercase tracking-widest mb-0.5">Combinada sugerida</div>
                  <div className="text-[11px] text-blue-300">{combinada}</div>
                </div>
              )}
              {golesRec && (
                <div className="text-[10px] text-gray-400">
                  <span className="text-gray-600">Línea de goles:</span> {golesRec}
                </div>
              )}
              {mc.btts_prob != null && (
                <div className="text-[10px] text-gray-400">
                  <span className="text-gray-600">Ambos anotan:</span>{' '}
                  <span className={mc.btts_prob > 0.5 ? 'text-orange-400' : 'text-gray-300'}>
                    {Math.round(mc.btts_prob * 100)}%
                  </span>
                </div>
              )}
              {mc.over_2_5_prob != null && (
                <div className="text-[10px] text-gray-400">
                  <span className="text-gray-600">Más de 2.5 goles:</span>{' '}
                  <span className={mc.over_2_5_prob > 0.5 ? 'text-orange-400' : 'text-gray-300'}>
                    {Math.round(mc.over_2_5_prob * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Panel de combinada Baley ───────────────────────────────────────────────────
function CombinadaPanel({ text, loading }) {
  if (loading) {
    return (
      <div className="card flex items-center gap-3 py-6">
        <div className="w-8 h-8 rounded-full bg-green-900/40 border border-green-700 flex items-center justify-center text-lg shrink-0 animate-pulse">
          🤖
        </div>
        <div>
          <div className="text-sm text-white font-semibold">Baley está armando la combinada...</div>
          <div className="text-xs text-gray-500 mt-0.5">Analizando todos los partidos de la jornada</div>
        </div>
      </div>
    )
  }

  if (!text) return null

  // Renderizar el texto de Baley con formato básico
  const lines = text.split('\n').filter(Boolean)

  return (
    <div className="card border border-green-900/40">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-green-900/40 border border-green-700 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <div className="font-bold text-white">Combinada de la Jornada · Baley</div>
          <div className="text-[10px] text-gray-500">Análisis completo de todos los partidos del día</div>
        </div>
      </div>

      <div className="space-y-2">
        {lines.map((line, i) => {
          // Formateo básico: headers en negritas, bullet points
          const isBold = line.startsWith('**') || line.match(/^[1-4]\.\s*\*/)
          const cleaned = line.replace(/\*\*/g, '')

          if (isBold || /^\d\./.test(line)) {
            return (
              <div key={i} className="font-semibold text-green-300 text-sm mt-3 first:mt-0">
                {cleaned}
              </div>
            )
          }
          if (line.startsWith('- ') || line.startsWith('• ')) {
            return (
              <div key={i} className="flex gap-2 text-xs text-gray-300 pl-2">
                <span className="text-green-500 shrink-0">›</span>
                <span>{line.replace(/^[-•]\s*/, '')}</span>
              </div>
            )
          }
          return (
            <p key={i} className="text-xs text-gray-400 leading-relaxed">
              {cleaned}
            </p>
          )
        })}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function TodayMatches() {
  const [selectedDate, setSelectedDate]   = useState(todayStr())
  const [useLocalLlm, setUseLocalLlm]     = useState(false)
  const [llmUrl,      setLlmUrl]          = useState('http://127.0.0.1:1234')
  const [llmModel,    setLlmModel]        = useState('google/gemma-3-4b')
  const [useGemini,   setUseGemini]       = useState(false)
  const [geminiKey,   setGeminiKey]       = useState('')
  const [showLlm,     setShowLlm]         = useState(false)

  const [predictions, setPredictions]     = useState({})
  const [loadingId,   setLoadingId]       = useState(null)
  const [analyzedAll, setAnalyzedAll]     = useState(false)
  const [combinada,   setCombinada]       = useState(null)
  const [combLoading, setCombLoading]     = useState(false)
  const [error,       setError]           = useState(null)

  const usingLlm = useLocalLlm || useGemini

  // Partidos de la fecha seleccionada con equipos definidos
  const fixtures = FIXTURES.filter(f =>
    f.date === selectedDate && f.team_a && f.team_b
  )

  const analyzedCount = Object.keys(predictions).length

  // ── Analizar todos los partidos ──────────────────────────────────────────
  async function runAll() {
    setPredictions({})
    setCombinada(null)
    setAnalyzedAll(false)
    setError(null)

    const allResults = {}

    for (const fix of fixtures) {
      setLoadingId(fix.id)
      try {
        const { data } = await axios.post(`${API}/predict_match`, {
          team_a:          fix.team_a,
          team_b:          fix.team_b,
          venue_name:      fix.venue || 'Sede Neutral',
          match_type:      'mundial',
          use_gemini:      useGemini && !!geminiKey,
          gemini_api_key:  geminiKey || null,
          use_local_llm:   useLocalLlm,
          local_llm_url:   llmUrl,
          local_llm_model: llmModel,
        })
        allResults[fix.id] = data
        setPredictions(prev => ({ ...prev, [fix.id]: data }))
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Error'
        allResults[fix.id] = { error: msg }
        setPredictions(prev => ({ ...prev, [fix.id]: { error: msg } }))
      }
    }

    setLoadingId(null)
    setAnalyzedAll(true)

    // Combinada solo si hay IA activa
    if (usingLlm) {
      await buildCombinadaBaley(allResults)
    }
  }

  // ── Pedir combinada a Baley ───────────────────────────────────────────────
  async function buildCombinadaBaley(allResults) {
    setCombLoading(true)

    // Contexto estructurado de todos los partidos
    const ctx = fixtures.map(f => {
      const r = allResults[f.id]
      if (!r || r.error) return `${f.team_a} vs ${f.team_b}: sin datos de predicción`
      const p   = r.probabilities || {}
      const xg  = r.expected_goals || {}
      const mc  = r.monte_carlo || {}
      const itp = parseInterp(r.gemini_interpretation)
      return [
        `PARTIDO: ${f.team_a} vs ${f.team_b}`,
        `Sede: ${f.venue} | Grupo ${f.group || ''} | ${f.time || ''}`,
        `Probabilidades: 1=${pct(p.home_win)} X=${pct(p.draw)} 2=${pct(p.away_win)}`,
        `xG esperado: ${xg.home?.toFixed(2) || '?'} – ${xg.away?.toFixed(2) || '?'}`,
        mc.over_2_5_prob != null ? `+2.5 goles: ${pct(mc.over_2_5_prob)}` : '',
        mc.btts_prob != null ? `Ambos anotan: ${pct(mc.btts_prob)}` : '',
        itp?.apuesta_segura ? `Apuesta segura sugerida: ${itp.apuesta_segura}` : '',
      ].filter(Boolean).join('\n')
    }).join('\n\n')

    const message =
      `Tienes el análisis completo de ${fixtures.length} partidos del Mundial ` +
      `que se juegan el ${selectedDate}. ` +
      `Dame un análisis experto de apuestas con lo siguiente:\n\n` +
      `1. **APUESTA SEGURA DEL DÍA**: el mercado más seguro de toda la jornada (1 selección)\n` +
      `2. **COMBINADA CONSERVADORA**: 2-3 selecciones de bajo riesgo, mercados claros\n` +
      `3. **COMBINADA EQUILIBRADA**: 3-4 selecciones con buen equilibrio riesgo/retorno\n` +
      `4. **COMBINADA ARRIESGADA**: 4-5 selecciones para multiplicar, asumiendo riesgo\n\n` +
      `Para cada selección indica: partido, mercado exacto (ej: "1 · Brasil", "+2.5 goles", "Ambos anotan: Sí"), ` +
      `y una línea de justificación. Sé directo y práctico.`

    try {
      const { data } = await axios.post(`${API}/baley_chat`, {
        message,
        history:            [],
        prediction_context: ctx,
        use_gemini:         useGemini && !!geminiKey,
        gemini_api_key:     geminiKey || null,
        use_local_llm:      useLocalLlm,
        local_llm_url:      llmUrl,
        local_llm_model:    llmModel,
      })
      setCombinada(data.reply || data.message || '(Sin respuesta)')
    } catch (err) {
      setCombinada('⚠️ No se pudo obtener la combinada. Verifica que la IA esté activa.')
    }

    setCombLoading(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="card-header mb-0">🗓️ Pronósticos de la Jornada</h2>
            <p className="text-xs text-gray-500 mt-1">
              Predice todos los partidos del día y obtén la combinada óptima con Baley
            </p>
          </div>

          {/* Selector de fecha */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Fecha:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value)
                setPredictions({})
                setCombinada(null)
                setAnalyzedAll(false)
              }}
              className="input-field text-sm py-1 px-2"
              min="2026-06-11"
              max="2026-07-19"
            />
            <button
              onClick={() => setSelectedDate(todayStr())}
              className="text-[10px] text-gray-500 hover:text-gray-300 border border-gray-700 rounded px-2 py-1"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* IA settings toggle */}
        <div className="mt-3 pt-3 border-t border-gray-800">
          <button
            onClick={() => setShowLlm(!showLlm)}
            className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
          >
            🤖 Configuración IA (Baley) {showLlm ? '▲' : '▼'}
          </button>

          {showLlm && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-4">
                {/* Local LLM */}
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useLocalLlm}
                    onChange={e => { setUseLocalLlm(e.target.checked); if (e.target.checked) setUseGemini(false) }}
                    className="accent-green-500"
                  />
                  Modelo local (LM Studio)
                </label>
                {/* Gemini */}
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGemini}
                    onChange={e => { setUseGemini(e.target.checked); if (e.target.checked) setUseLocalLlm(false) }}
                    className="accent-blue-500"
                  />
                  Gemini API
                </label>
              </div>
              {useLocalLlm && (
                <div className="flex gap-2 flex-wrap">
                  <input
                    className="input-field text-xs flex-1 min-w-0"
                    placeholder="URL LLM (ej: http://127.0.0.1:1234)"
                    value={llmUrl}
                    onChange={e => setLlmUrl(e.target.value)}
                  />
                  <input
                    className="input-field text-xs flex-1 min-w-0"
                    placeholder="Modelo"
                    value={llmModel}
                    onChange={e => setLlmModel(e.target.value)}
                  />
                </div>
              )}
              {useGemini && (
                <input
                  type="password"
                  className="input-field text-xs w-full"
                  placeholder="Gemini API Key"
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sin partidos en la fecha */}
      {fixtures.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-gray-400 font-medium">No hay partidos el {selectedDate}</div>
          <p className="text-xs text-gray-600 mt-1">
            La fase de grupos del Mundial 2026 va del 11 Jun al 27 Jun.
            Las eliminatorias del 28 Jun al 19 Jul (con equipos ya clasificados).
          </p>
        </div>
      )}

      {/* Partidos encontrados */}
      {fixtures.length > 0 && (
        <>
          {/* Barra de acción */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={runAll}
              disabled={loadingId !== null}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingId !== null ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analizando {analyzedCount + 1}/{fixtures.length}...
                </>
              ) : (
                `⚡ Analizar todos (${fixtures.length} partidos)`
              )}
            </button>

            {analyzedAll && !usingLlm && (
              <div className="text-xs text-gray-500">
                💡 Activa la IA para obtener la combinada de Baley
              </div>
            )}

            {analyzedCount > 0 && analyzedCount < fixtures.length && (
              <div className="text-xs text-gray-500">
                Progreso: {analyzedCount}/{fixtures.length} partidos analizados
              </div>
            )}

            {analyzedAll && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <span>✓</span>
                <span>Todos analizados</span>
              </div>
            )}
          </div>

          {/* Progreso visual */}
          {loadingId && (
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(analyzedCount / fixtures.length) * 100}%` }}
              />
            </div>
          )}

          {/* Tarjetas de partidos */}
          <div className={`grid gap-4 ${fixtures.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : ''}`}>
            {fixtures.map(fix => (
              <MatchCard
                key={fix.id}
                fixture={fix}
                pred={predictions[fix.id] || null}
                isLoading={loadingId === fix.id}
              />
            ))}
          </div>

          {/* Resumen rápido cuando hay predicciones */}
          {analyzedCount > 0 && !combLoading && !combinada && (
            <div className="card border border-gray-700">
              <h3 className="text-sm font-bold text-white mb-3">📊 Resumen de la Jornada</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-600 uppercase text-[10px]">
                      <th className="text-left pb-2">Partido</th>
                      <th className="text-right pb-2">1</th>
                      <th className="text-right pb-2">X</th>
                      <th className="text-right pb-2">2</th>
                      <th className="text-right pb-2">xG</th>
                      <th className="text-right pb-2">+2.5</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {fixtures.map(fix => {
                      const r = predictions[fix.id]
                      if (!r || r.error) return null
                      const p = r.probabilities || {}
                      const xg = r.expected_goals || {}
                      const mc = r.monte_carlo || {}
                      const bestOutcome =
                        p.home_win > p.away_win && p.home_win > p.draw
                          ? { label: `1 · ${fix.team_a}`, color: probBarColor(p.home_win) }
                          : p.away_win > p.home_win && p.away_win > p.draw
                            ? { label: `2 · ${fix.team_b}`, color: probBarColor(p.away_win) }
                            : { label: 'X', color: probBarColor(p.draw) }
                      return (
                        <tr key={fix.id}>
                          <td className="py-1.5 text-gray-300">
                            <span className="font-medium">{fix.team_a}</span>
                            <span className="text-gray-600 mx-1">vs</span>
                            <span className="font-medium">{fix.team_b}</span>
                            {' '}
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full ml-1"
                              style={{ background: bestOutcome.color + '20', color: bestOutcome.color }}
                            >
                              {bestOutcome.label}
                            </span>
                          </td>
                          <td className="py-1.5 text-right font-mono" style={{ color: probBarColor(p.home_win) }}>
                            {Math.round((p.home_win || 0) * 100)}%
                          </td>
                          <td className="py-1.5 text-right font-mono text-gray-400">
                            {Math.round((p.draw || 0) * 100)}%
                          </td>
                          <td className="py-1.5 text-right font-mono" style={{ color: probBarColor(p.away_win) }}>
                            {Math.round((p.away_win || 0) * 100)}%
                          </td>
                          <td className="py-1.5 text-right font-mono text-gray-400">
                            {xg.home?.toFixed(1)}-{xg.away?.toFixed(1)}
                          </td>
                          <td className="py-1.5 text-right font-mono">
                            <span className={mc.over_2_5_prob > 0.5 ? 'text-orange-400' : 'text-gray-600'}>
                              {mc.over_2_5_prob != null ? Math.round(mc.over_2_5_prob * 100) + '%' : '–'}
                            </span>
                          </td>
                        </tr>
                      )
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Combinada de Baley */}
          <CombinadaPanel text={combinada} loading={combLoading} />

          {/* Botón para re-pedir combinada si ya tiene predicciones */}
          {analyzedAll && usingLlm && !combLoading && !combinada && (
            <button
              onClick={() => buildCombinadaBaley(predictions)}
              className="btn-secondary text-sm"
            >
              🤖 Pedir combinada a Baley
            </button>
          )}
        </>
      )}
    </div>
  )
}
