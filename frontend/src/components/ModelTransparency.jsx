import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const WEIGHT_LABELS = {
  fifa_ranking:           { label: 'Ranking FIFA',         icon: '📋', desc: 'Posicion actual en el ranking FIFA' },
  elo_points:             { label: 'Puntos Elo',           icon: '📈', desc: 'Rating Elo dinamico del equipo' },
  gdp_per_capita:         { label: 'PIB per capita',       icon: '💰', desc: 'Proxy de inversion en infraestructura futbolistica' },
  population_culture:     { label: 'Poblacion y Cultura',  icon: '🌍', desc: 'Masa de aficionados y cultura futbolistica' },
  squad_strength:         { label: 'Plantilla',            icon: '⚽', desc: 'Calidad de jugadores (valor de mercado / rendimiento)' },
  avg_temp:               { label: 'Temperatura media',    icon: '🌡️', desc: 'Adaptacion climatica del equipo' },
}

function WeightBar({ label, icon, desc, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
      <span className="text-xl shrink-0 w-7 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-white">{label}</span>
          <span className="text-sm font-mono text-green-400">{(value * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-600 rounded-full" style={{ width: pct + '%' }} />
        </div>
        <p className="text-[11px] text-gray-600 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

export default function ModelTransparency() {
  const [weights, setWeights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(function() {
    axios.get(API + '/weights').then(function(r) {
      setWeights(r.data)
    }).catch(function(e) {
      setError('No se pudieron cargar los pesos del modelo')
    }).finally(function() {
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="card text-center py-10 text-gray-500">Cargando modelo...</div>
  )
  if (error) return (
    <div className="card border-red-800 text-red-400 text-sm">{error}</div>
  )

  // Filtrar claves internas (_comment, etc.) de structural_weights
  const rawSw = (weights && weights.structural_weights) || {}
  const sw = Object.fromEntries(
    Object.entries(rawSw).filter(function(e) { return !e[0].startsWith('_') && typeof e[1] === 'number' })
  )
  const maxVal = Math.max.apply(null, Object.values(sw).concat([0.001]))

  // match_type_variance es el multiplicador por tipo de partido
  const matchMults = (weights && weights.match_type_variance) || {}

  // home_advantage es un objeto por tipo de partido — calcular promedio para mostrar
  const rawHa = (weights && weights.home_advantage) || {}
  const haValues = Object.entries(rawHa)
    .filter(function(e) { return !e[0].startsWith('_') && typeof e[1] === 'number' })
    .map(function(e) { return e[1] })
  const homeAdv = haValues.length > 0
    ? (haValues.reduce(function(a, b) { return a + b }, 0) / haValues.length).toFixed(2)
    : '—'

  // h2h_weight puede ser un objeto con .value o un número directo
  const rawH2h = (weights && weights.h2h_weight) || 0
  const h2hW = typeof rawH2h === 'object' ? (rawH2h.value || 0) : rawH2h

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="card-header">Modelo Klement — Transparencia</h2>
        <p className="text-sm text-gray-500 mb-4">
          Inspirado en Klement (Liberum/Panmure, 2014) y Hoffmann, Ging &amp; Ramasamy (2002).
          Combina factores estructurales con Poisson bivariado y simulacion Monte Carlo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            ['Modelo base', 'Poisson bivariado', '🎲'],
            ['Simulaciones', '10.000 iteraciones MC', '🔄'],
            ['Combinacion', '50% analitico + 50% MC', '⚖️'],
          ].map(function(item) {
            return (
              <div key={item[0]} className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{item[2]}</div>
                <div className="text-xs font-bold text-white">{item[0]}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{item[1]}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="card-header">Pesos Estructurales</h3>
        <div>
          {Object.entries(sw).map(function(entry) {
            var key = entry[0]; var val = entry[1]
            var meta = WEIGHT_LABELS[key] || { label: key, icon: '📊', desc: '' }
            return (
              <WeightBar
                key={key}
                label={meta.label}
                icon={meta.icon}
                desc={meta.desc}
                value={val}
                max={maxVal}
              />
            )
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="card-header">Parametros del Modelo</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Ventaja local</div>
            <div className="text-lg font-bold text-white">x{homeAdv}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-1">Peso H2H</div>
            <div className="text-lg font-bold text-white">{(h2hW * 100).toFixed(0)}%</div>
          </div>
          {Object.entries(matchMults)
            .filter(function(e) { return !e[0].startsWith('_') && typeof e[1] === 'number' })
            .slice(0, 4).map(function(entry) {
              return (
                <div key={entry[0]} className="bg-gray-800 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">{entry[0].replace(/_/g, ' ')}</div>
                  <div className="text-lg font-bold text-white">x{entry[1]}</div>
                </div>
              )
            })}
        </div>
      </div>

      <div className="card">
        <h3 className="card-header">Multiplicadores por Tipo de Partido</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-500 uppercase border-b border-gray-800">
                <th className="text-left pb-2">Tipo</th>
                <th className="text-right pb-2">Multiplicador</th>
                <th className="text-right pb-2">Intensidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {Object.entries(matchMults)
                .filter(function(e) { return !e[0].startsWith('_') && typeof e[1] === 'number' })
                .map(function(entry) {
                var k = entry[0]; var v = entry[1]
                return (
                  <tr key={k} className="hover:bg-gray-800/50">
                    <td className="py-2 text-gray-300 capitalize">{k.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-right font-mono text-green-400">x{v}</td>
                    <td className="py-2 text-right">
                      <div className="inline-flex h-1.5 w-20 bg-gray-800 rounded-full overflow-hidden">
                        <div className="bg-green-600 h-full" style={{ width: Math.min(100, v * 60) + '%' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
