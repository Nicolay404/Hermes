/**
 * BetSlipAnalyzer.jsx
 * Permite subir una foto de boleta de apuesta y obtener análisis de Baley (IA).
 */
import { useState, useRef } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const OPINION_STYLE = {
  favorable:    'text-green-400 bg-green-900/30 border-green-800',
  neutral:      'text-yellow-400 bg-yellow-900/20 border-yellow-800',
  desfavorable: 'text-red-400 bg-red-900/30 border-red-800',
}

const EVAL_STYLE = {
  buena:          { cls: 'text-green-400', label: 'Buena apuesta' },
  arriesgada:     { cls: 'text-yellow-400', label: 'Arriesgada' },
  muy_arriesgada: { cls: 'text-orange-400', label: 'Muy arriesgada' },
  mala:           { cls: 'text-red-400', label: 'Mala apuesta' },
}

function parseAnalysis(raw) {
  if (!raw) return null
  try {
    // Strip ```json ... ``` if present
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

function AnalysisResult({ raw }) {
  const data = parseAnalysis(raw)

  if (!data) {
    return (
      <div className="card mt-4">
        <h3 className="card-header">Respuesta de Baley</h3>
        <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono bg-gray-900 rounded-lg p-4 overflow-x-auto">
          {raw}
        </pre>
      </div>
    )
  }

  const evalMeta = EVAL_STYLE[data.evaluacion_global] || { cls: 'text-gray-400', label: data.evaluacion_global }

  return (
    <div className="space-y-4 mt-4">
      {/* Cabecera */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="text-lg font-black text-white">{data.partido || 'Partido'}</div>
            <div className="text-xs text-gray-500 mt-0.5">{data.tipo} · Stake: {data.stake} · Ganancia: {data.ganancia_potencial}</div>
          </div>
          <div className={'text-right font-bold text-sm ' + evalMeta.cls}>
            {evalMeta.label}
          </div>
        </div>

        {data.resumen && (
          <p className="text-sm text-gray-300 bg-gray-800/60 rounded-lg px-4 py-3 leading-relaxed">
            {data.resumen}
          </p>
        )}

        {data.recomendacion && (
          <div className="mt-3 border-l-2 border-green-600 pl-3 text-sm text-green-300 italic">
            Baley recomienda: {data.recomendacion}
          </div>
        )}
      </div>

      {/* Selecciones */}
      {data.selecciones && data.selecciones.length > 0 && (
        <div className="card">
          <h3 className="card-header">Selecciones ({data.selecciones.length})</h3>
          <div className="space-y-2">
            {data.selecciones.map(function(sel, i) {
              const style = OPINION_STYLE[sel.opinion] || 'text-gray-400 bg-gray-800 border-gray-700'
              return (
                <div key={i} className={'border rounded-lg px-4 py-3 ' + style}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm">{sel.linea}</span>
                      <span className="text-xs ml-2 opacity-80">{sel.mercado}</span>
                      {sel.equipo && <span className="text-xs ml-2 opacity-60">({sel.equipo})</span>}
                    </div>
                    <span className="text-xs font-semibold capitalize shrink-0">{sel.opinion}</span>
                  </div>
                  {sel.razon && (
                    <p className="text-xs mt-1 opacity-80 leading-relaxed">{sel.razon}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BetSlipAnalyzer() {
  const [image, setImage]           = useState(null)
  const [preview, setPreview]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)

  // IA config
  const [useLocalLlm, setUseLocalLlm] = useState(false)
  const [llmUrl, setLlmUrl]           = useState('http://127.0.0.1:1234')
  const [llmModel, setLlmModel]       = useState('google/gemma-3-4b')
  const [useGemini, setUseGemini]     = useState(false)
  const [geminiKey, setGeminiKey]     = useState('')

  const fileRef = useRef(null)

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setImage(f)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = function(ev) { setPreview(ev.target.result) }
    reader.readAsDataURL(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (!f) return
    // Trigger same logic
    const input = fileRef.current
    if (input) {
      const dt = new DataTransfer()
      dt.items.add(f)
      input.files = dt.files
      handleFile({ target: { files: [f] } })
    }
  }

  async function handleAnalyze() {
    if (!image) { setError('Sube una imagen primero'); return }
    if (!useGemini && !useLocalLlm) { setError('Activa Gemini o un LLM local para analizar'); return }
    if (useGemini && !geminiKey) { setError('Introduce tu API Key de Gemini'); return }

    setLoading(true)
    setError(null)
    setResult(null)

    const form = new FormData()
    form.append('file', image)
    form.append('use_gemini', useGemini ? 'true' : 'false')
    form.append('gemini_api_key', geminiKey || '')
    form.append('use_local_llm', useLocalLlm ? 'true' : 'false')
    form.append('local_llm_url', llmUrl)
    form.append('local_llm_model', llmModel)

    try {
      const { data } = await axios.post(API + '/analyze_bet_slip', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      setResult(data.analysis)
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.detail) || 'Error al analizar la boleta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card">
        <h2 className="card-header">Analizar Boleta de Apuesta</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sube una captura de pantalla de tu apuesta y Baley te dirá si vas bien,
          qué selecciones son riesgosas y qué cambiaría.
        </p>

        {/* Zona de drop */}
        <div
          onDrop={handleDrop}
          onDragOver={function(e) { e.preventDefault() }}
          onClick={function() { fileRef.current && fileRef.current.click() }}
          className="relative border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-green-600 transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Boleta" className="max-h-72 mx-auto rounded-lg object-contain" />
              <div className="mt-2 text-xs text-gray-500">{image && image.name} · Haz clic para cambiar</div>
            </div>
          ) : (
            <div className="py-6 text-gray-500">
              <div className="text-4xl mb-2">📸</div>
              <div className="text-sm">Arrastra tu boleta aquí o haz clic para seleccionar</div>
              <div className="text-xs mt-1 text-gray-600">JPG, PNG, WebP</div>
            </div>
          )}
        </div>

        {/* Config IA */}
        <div className="border-t border-gray-800 pt-4 mt-4 space-y-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Motor de análisis</p>

          {/* LLM Local */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={useLocalLlm}
                onChange={function(e) { setUseLocalLlm(e.target.checked); if (e.target.checked) setUseGemini(false) }}
                className="accent-green-500 w-4 h-4"
              />
              Modelo local (LM Studio, Ollama…) — requiere soporte de visión
            </label>
            {useLocalLlm && (
              <div className="grid grid-cols-2 gap-3 mt-2 pl-6">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">URL</label>
                  <input type="text" className="input-field text-sm" value={llmUrl}
                    onChange={function(e) { setLlmUrl(e.target.value) }} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Modelo</label>
                  <input type="text" className="input-field text-sm" value={llmModel}
                    onChange={function(e) { setLlmModel(e.target.value) }} />
                </div>
              </div>
            )}
          </div>

          {/* Gemini */}
          {!useLocalLlm && (
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={useGemini}
                  onChange={function(e) { setUseGemini(e.target.checked) }}
                  className="accent-green-500 w-4 h-4"
                />
                Gemini API (recomendado para visión)
              </label>
              {useGemini && (
                <div className="mt-2 pl-6">
                  <label className="text-[11px] text-gray-500 block mb-1">API Key de Gemini</label>
                  <input type="password" className="input-field text-sm" value={geminiKey}
                    onChange={function(e) { setGeminiKey(e.target.value) }} placeholder="AIza..." />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !image}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          {loading
            ? <><span className="animate-spin inline-block">⟳</span> Baley está analizando…</>
            : 'Analizar boleta con Baley'}
        </button>

        {error && (
          <div className="mt-3 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="card text-center py-8">
          <div className="text-3xl mb-3 animate-spin inline-block">⟳</div>
          <p className="text-gray-400 text-sm">Baley está leyendo tu boleta…</p>
          <p className="text-xs text-gray-600 mt-1">Esto puede tomar hasta 30 segundos</p>
        </div>
      )}

      {result && !loading && <AnalysisResult raw={result} />}
    </div>
  )
}
