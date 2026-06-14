import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

export default function RecalibrationPanel() {
  const [file, setFile] = useState(null)
  const [maxIter, setMaxIter] = useState(50)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState(null)

  function handleFile(e) {
    setFile(e.target.files[0] || null)
    setResult(null)
    setApplied(false)
    setError(null)
  }

  function calibrate() {
    if (!file) { setError('Selecciona un archivo CSV primero'); return }
    setLoading(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    axios.post(API + '/recalibrate?max_iter=' + maxIter, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(function(r) {
      setResult(r.data)
    }).catch(function(e) {
      setError((e.response && e.response.data && e.response.data.detail) || 'Error de recalibracion')
    }).finally(function() {
      setLoading(false)
    })
  }

  function applyWeights() {
    if (!result || !result.suggested_weights) return
    axios.post(API + '/apply_weights', { full_weights: result.suggested_weights })
      .then(function() { setApplied(true) })
      .catch(function(e) {
        setError((e.response && e.response.data && e.response.data.detail) || 'Error al aplicar pesos')
      })
  }

  const sw = result && result.suggested_weights && result.suggested_weights.structural_weights
  const curr = result && result.current_weights && result.current_weights.structural_weights

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="card-header">Recalibracion del Modelo</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sube un CSV con resultados historicos reales para recalibrar los pesos estructurales.
          Los pesos sugeridos NO se aplican automaticamente — debes confirmar.
        </p>

        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 font-mono mb-2">Formato CSV esperado:</p>
          <pre className="text-[11px] text-green-400 font-mono overflow-x-auto">
            team_a,team_b,date,goals_a,goals_b,match_type,venue_name
          </pre>
          <p className="text-xs text-gray-600 mt-1">Minimo 5 partidos. Fecha en formato YYYY-MM-DD.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">Archivo CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-700 file:text-white file:font-medium hover:file:bg-gray-600 cursor-pointer"
            />
            {file && <p className="text-xs text-green-400 mt-1">Archivo: {file.name}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1 font-medium">
              Iteraciones maximas: <span className="text-white font-bold">{maxIter}</span>
            </label>
            <input
              type="range" min="10" max="200" step="10"
              value={maxIter}
              onChange={function(e) { setMaxIter(Number(e.target.value)) }}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>10 (rapido)</span><span>200 (preciso)</span>
            </div>
          </div>

          <button
            onClick={calibrate}
            disabled={loading || !file}
            className="btn-primary w-full">
            {loading ? 'Calibrando...' : 'Calibrar con datos historicos'}
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
          <h3 className="card-header">Resultado de Calibracion</h3>

          {result.metrics && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                ['Partidos analizados', result.metrics.n_matches || '-'],
                ['Error inicial', result.metrics.initial_error ? result.metrics.initial_error.toFixed(4) : '-'],
                ['Error final', result.metrics.final_error ? result.metrics.final_error.toFixed(4) : '-'],
              ].map(function(item) {
                return (
                  <div key={item[0]} className="bg-gray-800 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-white">{item[1]}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{item[0]}</div>
                  </div>
                )
              })}
            </div>
          )}

          {sw && curr && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-500 uppercase border-b border-gray-800">
                    <th className="text-left pb-2">Factor</th>
                    <th className="text-right pb-2">Actual</th>
                    <th className="text-right pb-2">Sugerido</th>
                    <th className="text-right pb-2">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {Object.entries(sw).map(function(entry) {
                    var k = entry[0]; var suggested = entry[1]
                    var current = curr[k] || 0
                    var diff = suggested - current
                    return (
                      <tr key={k} className="hover:bg-gray-800/50">
                        <td className="py-2 text-gray-300">{k.replace(/_/g, ' ')}</td>
                        <td className="py-2 text-right font-mono text-gray-400">{(current * 100).toFixed(1)}%</td>
                        <td className="py-2 text-right font-mono text-white">{(suggested * 100).toFixed(1)}%</td>
                        <td className={'py-2 text-right font-mono font-bold ' + (diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-600')}>
                          {diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {applied ? (
            <div className="bg-green-900/30 border border-green-800 text-green-300 text-sm rounded-lg px-4 py-3 text-center">
              Pesos aplicados correctamente. El modelo usara los nuevos parametros.
            </div>
          ) : (
            <button onClick={applyWeights} className="btn-primary w-full">
              Aplicar pesos sugeridos al modelo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
