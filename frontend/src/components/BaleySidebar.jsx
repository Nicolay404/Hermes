/**
 * BaleySidebar.jsx
 * Panel lateral de Baley — altura fija, scroll independiente.
 * - Muestra análisis del modelo (segura / combinada / arriesgada / goles)
 * - Chat libre para follow-up con la IA
 * - Sección colapsable de upload de boleta
 */
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

// ── Avatar ────────────────────────────────────────────────────────────────────
function BaleyAvatar({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={sz + ' rounded-xl bg-gradient-to-br from-green-400 via-emerald-500 to-green-700 flex items-center justify-center font-black text-white shadow-md shadow-green-500/30 shrink-0'}>
      B
    </div>
  )
}

// ── Chips ─────────────────────────────────────────────────────────────────────
function RiskChip({ level }) {
  const map = {
    'alta':     'bg-green-900/60 text-green-300 border-green-700',
    'media':    'bg-yellow-900/60 text-yellow-300 border-yellow-700',
    'bajo':     'bg-green-900/60 text-green-300 border-green-700',
    'medio':    'bg-yellow-900/60 text-yellow-300 border-yellow-700',
    'alto':     'bg-orange-900/60 text-orange-300 border-orange-700',
    'muy alto': 'bg-red-900/60 text-red-300 border-red-700',
  }
  const labels = {
    'alta': 'ALTA CONF.', 'media': 'MEDIA CONF.',
    'bajo': 'BAJO RIESGO', 'medio': 'RIESGO MEDIO',
    'alto': 'ALTO RIESGO', 'muy alto': 'MUY ALTO',
  }
  const key = level?.toLowerCase()
  const cls = map[key] || 'bg-gray-800 text-gray-400 border-gray-700'
  return (
    <span className={'text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ' + cls}>
      {labels[key] || (level || '').toUpperCase()}
    </span>
  )
}

function GoalPill({ label, value }) {
  const v = value?.toUpperCase()
  const color = v === 'SI'
    ? 'bg-green-500/20 border-green-500/40 text-green-300'
    : v === 'NO'
    ? 'bg-red-500/20 border-red-500/40 text-red-300'
    : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
  return (
    <div className='flex items-center justify-between px-2.5 py-1.5 rounded-lg border bg-white/[0.02]'>
      <span className='text-gray-400 text-[10px]'>{label}</span>
      <span className={'px-1.5 py-0.5 rounded text-[9px] font-bold border ' + color}>{v || '?'}</span>
    </div>
  )
}

// ── Burbujas de chat ──────────────────────────────────────────────────────────
function BubbleBaley({ children, typing }) {
  return (
    <div className='flex gap-2 items-start'>
      <BaleyAvatar size='sm' />
      <div className='flex-1 bg-white/[0.04] border border-white/10 rounded-2xl rounded-tl-none px-3 py-2.5 text-[12px] leading-relaxed shadow min-w-0'>
        {typing ? (
          <div className='flex gap-1 items-center h-4'>
            <span className='w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce' style={{ animationDelay: '0ms' }} />
            <span className='w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce' style={{ animationDelay: '150ms' }} />
            <span className='w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce' style={{ animationDelay: '300ms' }} />
          </div>
        ) : children}
      </div>
    </div>
  )
}

function BubbleUser({ text }) {
  return (
    <div className='flex justify-end'>
      <div className='max-w-[82%] bg-green-700/30 border border-green-700/40 rounded-2xl rounded-tr-none px-3 py-2 text-[12px] text-green-100 leading-relaxed'>
        {text}
      </div>
    </div>
  )
}

// ── Tarjeta de apuesta ────────────────────────────────────────────────────────
function BetCard({ icon, title, colorClass, children }) {
  return (
    <div className={'relative overflow-hidden rounded-xl border p-3 ' + colorClass}>
      <div className='flex items-center gap-2 mb-2'>
        <span className='text-base'>{icon}</span>
        <span className='text-[11px] font-bold text-white'>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ── Parseo JSON Baley ─────────────────────────────────────────────────────────
function parseBaley(rawText) {
  if (!rawText) return null
  try {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch { return null }
}

// ── Render del análisis inicial de Baley ─────────────────────────────────────
function BaleyAnalysis({ data, teamA, teamB }) {
  if (!data) return null
  return (
    <div className='space-y-2.5'>
      {/* Header partido */}
      <div className='rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-3 py-2.5'>
        <div className='text-[9px] text-cyan-400 uppercase tracking-wider mb-0.5'>Partido analizado</div>
        <div className='text-white font-bold text-sm'>{teamA} vs {teamB}</div>
      </div>

      {/* Resumen */}
      <BubbleBaley>
        <span className='font-bold text-white'>{data.favorito || teamA}.</span>{' '}
        <span className='text-gray-200'>{data.resumen}</span>
      </BubbleBaley>

      {/* Segura */}
      {data.segura && (
        <BetCard icon='🟢' title='Apuesta Segura' colorClass='bg-green-950/40 border-green-800/50'>
          <div className='flex items-start justify-between gap-1'>
            <span className='text-green-200 text-[11px] font-semibold leading-snug'>{data.segura.apuesta}</span>
            <RiskChip level={data.segura.confianza} />
          </div>
          <div className='text-[10px] text-gray-500 mt-1'>
            Mercado: <span className='text-gray-300'>{data.segura.mercado}</span>
          </div>
          {data.segura.razon && <p className='text-[10px] text-gray-400 mt-0.5 leading-snug'>{data.segura.razon}</p>}
        </BetCard>
      )}

      {/* Combinada */}
      {data.combinada && (
        <BetCard icon='🟡' title='Combinada' colorClass='bg-yellow-950/40 border-yellow-800/50'>
          <div className='flex flex-wrap gap-1 mb-1.5'>
            {(data.combinada.apuestas || []).map(function(a, i) {
              return <span key={i} className='text-[10px] bg-yellow-900/50 text-yellow-200 rounded px-1.5 py-0.5 border border-yellow-800/40'>{a}</span>
            })}
          </div>
          <div className='flex items-center gap-2'>
            {data.combinada.razon && <p className='text-[10px] text-gray-400 flex-1 leading-snug'>{data.combinada.razon}</p>}
            <RiskChip level={data.combinada.riesgo} />
          </div>
        </BetCard>
      )}

      {/* Arriesgada */}
      {data.arriesgada && (
        <BetCard icon='🔴' title='Arriesgada con valor' colorClass='bg-red-950/40 border-red-800/50'>
          <div className='flex items-start justify-between gap-1'>
            <span className='text-red-200 text-[11px] font-semibold leading-snug'>{data.arriesgada.apuesta}</span>
            <RiskChip level={data.arriesgada.riesgo} />
          </div>
          <div className='text-[10px] text-gray-500 mt-1'>
            Mercado: <span className='text-gray-300'>{data.arriesgada.mercado}</span>
          </div>
          {data.arriesgada.razon && <p className='text-[10px] text-gray-400 mt-0.5 leading-snug'>{data.arriesgada.razon}</p>}
        </BetCard>
      )}

      {/* Goles */}
      {data.goles && (
        <BetCard icon='⚽' title='Mercados de goles' colorClass='bg-blue-950/40 border-blue-800/50'>
          <div className='text-[10px] text-blue-300 mb-1.5'>
            xG total: <span className='font-bold text-white'>{data.goles.xg_total}</span>
            {data.goles.marcador_clave && <span className='ml-2 text-gray-500'>· Clave: <span className='text-gray-300'>{data.goles.marcador_clave}</span></span>}
          </div>
          <div className='grid grid-cols-2 gap-1.5'>
            <GoalPill label='Más de 1.5' value={data.goles.over_1_5} />
            <GoalPill label='Más de 2.5' value={data.goles.over_2_5} />
            <GoalPill label='Más de 3.5' value={data.goles.over_3_5} />
            <GoalPill label='BTTS' value={data.goles.btts} />
          </div>
        </BetCard>
      )}

      <p className='text-[9px] text-gray-700 text-center leading-snug'>
        Modelo Klement • No garantiza resultados • Apuesta responsable
      </p>
    </div>
  )
}

// ── Resultado de boleta ───────────────────────────────────────────────────────
const EVAL_META = {
  buena:          { cls: 'text-green-400 border-green-800 bg-green-900/20', label: 'Buena apuesta' },
  arriesgada:     { cls: 'text-yellow-400 border-yellow-800 bg-yellow-900/20', label: 'Arriesgada' },
  muy_arriesgada: { cls: 'text-orange-400 border-orange-800 bg-orange-900/20', label: 'Muy arriesgada' },
  mala:           { cls: 'text-red-400 border-red-800 bg-red-900/20', label: 'Mala apuesta' },
}
const OPINION_CLS = {
  favorable:    'border-green-800 bg-green-900/20 text-green-300',
  neutral:      'border-yellow-800 bg-yellow-900/10 text-yellow-300',
  desfavorable: 'border-red-800 bg-red-900/20 text-red-300',
}

function BetSlipResult({ raw }) {
  const d = parseBaley(raw)
  if (!d) return (
    <BubbleBaley>
      <pre className='text-[10px] text-gray-300 whitespace-pre-wrap'>{raw}</pre>
    </BubbleBaley>
  )
  const meta = EVAL_META[d.evaluacion_global] || { cls: 'text-gray-400 border-gray-700 bg-gray-800/20', label: d.evaluacion_global }
  return (
    <div className='space-y-2'>
      <div className={'rounded-xl border px-3 py-2.5 ' + meta.cls}>
        <div className='text-[9px] uppercase tracking-wider mb-0.5 opacity-70'>Boleta analizada</div>
        <div className='font-bold text-white text-[12px]'>{d.partido || 'Partido'}</div>
        <div className='text-[10px] mt-0.5 opacity-60'>{d.tipo} · {d.stake} · Ganancia: {d.ganancia_potencial}</div>
        <div className={'font-bold text-[10px] mt-1.5 ' + meta.cls.split(' ')[0]}>{meta.label}</div>
      </div>
      {d.resumen && <BubbleBaley><p className='text-gray-200 leading-snug'>{d.resumen}</p></BubbleBaley>}
      {d.recomendacion && (
        <div className='border-l-2 border-green-600 pl-2.5 text-[11px] text-green-300 italic leading-snug'>{d.recomendacion}</div>
      )}
      {d.selecciones && d.selecciones.length > 0 && (
        <div className='space-y-1'>
          <div className='text-[9px] text-gray-500 uppercase tracking-wider'>Selecciones</div>
          {d.selecciones.map(function(sel, i) {
            const cls = OPINION_CLS[sel.opinion] || 'border-gray-700 bg-gray-800/20 text-gray-300'
            return (
              <div key={i} className={'border rounded-lg px-2.5 py-1.5 ' + cls}>
                <div className='flex items-center justify-between gap-1'>
                  <span className='text-[11px] font-bold'>{sel.linea}</span>
                  <span className='text-[9px] capitalize opacity-80'>{sel.opinion}</span>
                </div>
                <div className='text-[9px] opacity-60'>{sel.mercado}{sel.equipo ? ' · ' + sel.equipo : ''}</div>
                {sel.razon && <p className='text-[9px] mt-0.5 opacity-60 leading-snug'>{sel.razon}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Sección de upload de boleta ───────────────────────────────────────────────
function BetSlipUpload({ predictionData, teamA, teamB, useLocalLlm, llmUrl, llmModel, useGemini, geminiKey, onResult }) {
  const [open, setOpen]       = useState(false)
  const [image, setImage]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const fileRef = useRef(null)

  function pickFile(f) {
    if (!f) return
    setImage(f)
    setError(null)
    const reader = new FileReader()
    reader.onload = function(e) { setPreview(e.target.result) }
    reader.readAsDataURL(f)
  }

  async function analyze() {
    if (!image) return
    if (!useLocalLlm && !useGemini) { setError('Activa Gemini o LLM local'); return }
    if (useGemini && !geminiKey) { setError('Falta la API Key de Gemini'); return }

    setLoading(true)
    setError(null)

    let ctx = ''
    if (predictionData) {
      try {
        ctx = JSON.stringify({
          probabilities:     predictionData.probabilities,
          expected_goals:    predictionData.expected_goals,
          most_likely_score: predictionData.most_likely_score,
          top_scores:        (predictionData.top_scores || []).slice(0, 5),
          stats:             predictionData.stats,
        })
      } catch {}
    }

    const form = new FormData()
    form.append('file', image)
    form.append('team_a', teamA || '')
    form.append('team_b', teamB || '')
    form.append('prediction_context', ctx)
    form.append('use_gemini', useGemini ? 'true' : 'false')
    form.append('gemini_api_key', geminiKey || '')
    form.append('use_local_llm', useLocalLlm ? 'true' : 'false')
    form.append('local_llm_url', llmUrl || 'http://127.0.0.1:1234')
    form.append('local_llm_model', llmModel || 'google/gemma-3-4b')

    try {
      const { data } = await axios.post(API + '/analyze_bet_slip', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      onResult(data.analysis)
      setOpen(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al analizar la boleta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='border-t border-white/10 bg-black/20 shrink-0'>
      <button
        type='button'
        onClick={function() { setOpen(function(v) { return !v }) }}
        className='w-full flex items-center justify-between px-3 py-2.5 text-[11px] text-gray-500 hover:text-white transition-colors'
      >
        <span className='flex items-center gap-2'>
          <span>📸</span>
          <span className='font-medium'>Adjuntar boleta</span>
          {preview && <span className='text-green-400'>· lista</span>}
        </span>
        <svg className={'w-3 h-3 transition-transform ' + (open ? 'rotate-180' : '')} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {open && (
        <div className='px-3 pb-3 space-y-2'>
          <div
            onDrop={function(e) { e.preventDefault(); pickFile(e.dataTransfer.files[0]) }}
            onDragOver={function(e) { e.preventDefault() }}
            onClick={function() { fileRef.current && fileRef.current.click() }}
            className='border border-dashed border-gray-700 rounded-lg p-2.5 text-center cursor-pointer hover:border-green-600 transition-colors'
          >
            <input ref={fileRef} type='file' accept='image/*' className='hidden' onChange={function(e) { pickFile(e.target.files[0]) }} />
            {preview ? (
              <div>
                <img src={preview} alt='boleta' className='max-h-28 mx-auto rounded object-contain' />
                <p className='text-[9px] text-gray-600 mt-1'>Clic para cambiar</p>
              </div>
            ) : (
              <div className='py-2 text-gray-600'>
                <div className='text-xl mb-0.5'>📷</div>
                <div className='text-[10px]'>Arrastra o haz clic</div>
              </div>
            )}
          </div>

          {predictionData
            ? <p className='text-[9px] text-green-700'>Baley usará los datos del modelo como contexto.</p>
            : <p className='text-[9px] text-yellow-700'>Predice primero para dar contexto a Baley.</p>
          }

          <button
            onClick={analyze}
            disabled={loading || !image}
            className='btn-primary w-full text-[11px] py-2 flex items-center justify-center gap-1.5'
          >
            {loading ? <><span className='animate-spin'>⟳</span> Analizando…</> : 'Analizar con Baley'}
          </button>

          {error && (
            <div className='bg-red-900/30 border border-red-800 text-red-300 text-[10px] rounded px-2 py-1.5'>{error}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function BaleySidebar({
  rawText, loading, teamA, teamB,
  predictionData,
  useLocalLlm, llmUrl, llmModel,
  useGemini, geminiKey,
}) {
  const [showTyping, setShowTyping]   = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [betAnalysis, setBetAnalysis] = useState(null)

  // Chat libre
  const [chatInput, setChatInput]     = useState('')
  const [chatHistory, setChatHistory] = useState([])   // [{role, content}]
  const [chatLoading, setChatLoading] = useState(false)

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Procesar análisis inicial cuando llega rawText
  useEffect(function() {
    if (loading) { setShowTyping(true); setAnalysisData(null); return }
    if (rawText) {
      setShowTyping(true)
      const t = setTimeout(function() {
        setShowTyping(false)
        setAnalysisData(parseBaley(rawText))
      }, 600)
      return function() { clearTimeout(t) }
    }
    setShowTyping(false)
  }, [rawText, loading])

  // Limpiar al cambiar partido
  useEffect(function() {
    setBetAnalysis(null)
    setChatHistory([])
    setChatInput('')
  }, [teamA, teamB])

  // Auto-scroll
  useEffect(function() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [analysisData, betAnalysis, chatHistory, showTyping])

  async function sendChat(e) {
    e && e.preventDefault()
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    if (!useLocalLlm && !useGemini) return

    const newHistory = [...chatHistory, { role: 'user', content: msg }]
    setChatHistory(newHistory)
    setChatInput('')
    setChatLoading(true)

    let ctx = ''
    if (predictionData) {
      try {
        ctx = JSON.stringify({
          team_a: teamA, team_b: teamB,
          probabilities:     predictionData.probabilities,
          expected_goals:    predictionData.expected_goals,
          most_likely_score: predictionData.most_likely_score,
          top_scores:        (predictionData.top_scores || []).slice(0, 5),
          stats:             predictionData.stats,
        })
      } catch {}
    }

    try {
      const { data } = await axios.post(API + '/baley_chat', {
        message:            msg,
        prediction_context: ctx || null,
        history:            chatHistory,   // historial previo (sin el nuevo msg)
        use_gemini:         useGemini,
        gemini_api_key:     geminiKey || null,
        use_local_llm:      useLocalLlm,
        local_llm_url:      llmUrl || 'http://127.0.0.1:1234',
        local_llm_model:    llmModel || 'google/gemma-3-4b',
      }, { timeout: 60000 })

      setChatHistory(function(prev) {
        return [...prev, { role: 'assistant', content: data.reply }]
      })
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Error al conectar con Baley'
      setChatHistory(function(prev) {
        return [...prev, { role: 'assistant', content: '⚠️ ' + errMsg }]
      })
    } finally {
      setChatLoading(false)
      setTimeout(function() { inputRef.current?.focus() }, 100)
    }
  }

  const isEmpty = !loading && !rawText && chatHistory.length === 0

  return (
    <div className='flex flex-col bg-gradient-to-b from-[#0B1220] via-[#0f1a2e] to-[#0B1220] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl h-full'>

      {/* ── Header fijo ── */}
      <div className='flex items-center gap-2.5 px-3 py-3 border-b border-white/10 bg-white/[0.02] shrink-0'>
        <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 via-emerald-500 to-green-700 flex items-center justify-center font-black text-white text-sm shadow'>B</div>
        <div className='flex-1 min-w-0'>
          <div className='font-bold text-white text-sm'>Baley AI</div>
          <div className='flex items-center gap-1.5 text-[10px] text-green-400'>
            <span className='relative flex h-1.5 w-1.5'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75' />
              <span className='relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400' />
            </span>
            Analizando mercados
          </div>
        </div>
        {(analysisData || chatHistory.length > 0) && (
          <button
            type='button'
            onClick={function() { setChatHistory([]); setBetAnalysis(null) }}
            className='text-[9px] text-gray-600 hover:text-gray-400 transition-colors'
            title='Limpiar chat'
          >
            ✕ limpiar
          </button>
        )}
      </div>

      {/* ── Área de chat — scrollable ── */}
      <div className='flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0'>

        {/* Bienvenida */}
        <BubbleBaley>
          <span className='text-gray-300'>
            Hola. Predice un partido con IA activa y te daré mis recomendaciones.
            {(useLocalLlm || useGemini) && ' También puedes escribirme directamente abajo.'}
          </span>
        </BubbleBaley>

        {isEmpty && (
          <p className='text-center text-[10px] text-gray-700 pt-2'>Esperando predicción…</p>
        )}

        {/* Typing inicial */}
        {showTyping && <BubbleBaley typing />}

        {/* Análisis del modelo */}
        {analysisData && !showTyping && (
          <BaleyAnalysis data={analysisData} teamA={teamA} teamB={teamB} />
        )}

        {/* Texto sin parsear */}
        {rawText && !analysisData && !showTyping && (
          <BubbleBaley>
            <p className='text-gray-300 whitespace-pre-wrap text-[11px]'>{rawText}</p>
          </BubbleBaley>
        )}

        {/* Análisis de boleta */}
        {betAnalysis && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-[9px] text-gray-600'>
              <span className='flex-1 border-t border-gray-800' />
              <span>BOLETA</span>
              <span className='flex-1 border-t border-gray-800' />
            </div>
            <BetSlipResult raw={betAnalysis} />
          </div>
        )}

        {/* Historial de chat libre */}
        {chatHistory.map(function(msg, i) {
          return msg.role === 'user'
            ? <BubbleUser key={i} text={msg.content} />
            : (
              <BubbleBaley key={i}>
                <span className='text-gray-200 whitespace-pre-wrap'>{msg.content}</span>
              </BubbleBaley>
            )
        })}

        {/* Typing de respuesta chat */}
        {chatLoading && <BubbleBaley typing />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input de chat ── */}
      {(useLocalLlm || useGemini) && (
        <div className='border-t border-white/10 bg-black/20 px-3 py-2.5 shrink-0'>
          <form onSubmit={sendChat} className='flex gap-2 items-center'>
            <input
              ref={inputRef}
              type='text'
              value={chatInput}
              onChange={function(e) { setChatInput(e.target.value) }}
              placeholder='Pregunta a Baley… ej: dame la combinada segura'
              disabled={chatLoading}
              className='flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-green-700 transition-colors'
            />
            <button
              type='submit'
              disabled={chatLoading || !chatInput.trim()}
              className='w-8 h-8 rounded-xl bg-green-700 hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0'
            >
              <svg className='w-3.5 h-3.5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 12h14M12 5l7 7-7 7' />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ── Upload boleta ── */}
      <BetSlipUpload
        predictionData={predictionData}
        teamA={teamA}
        teamB={teamB}
        useLocalLlm={useLocalLlm}
        llmUrl={llmUrl}
        llmModel={llmModel}
        useGemini={useGemini}
        geminiKey={geminiKey}
        onResult={setBetAnalysis}
      />
    </div>
  )
}
