import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

// WMO weather code → emoji + label
function weatherLabel(code) {
  if (code == null) return { icon: '?', label: 'Desconocido' }
  if (code === 0)              return { icon: 'Sol despejado', label: 'Despejado' }
  if (code <= 3)               return { icon: 'Parcialmente nublado', label: 'Parcialmente nublado' }
  if (code <= 48)              return { icon: 'Niebla', label: 'Niebla' }
  if (code <= 57)              return { icon: 'Llovizna', label: 'Llovizna' }
  if (code <= 67)              return { icon: 'Lluvia', label: 'Lluvia' }
  if (code <= 77)              return { icon: 'Nieve', label: 'Nieve' }
  if (code <= 82)              return { icon: 'Chubascos', label: 'Chubascos' }
  if (code >= 95)              return { icon: 'Tormenta', label: 'Tormenta' }
  return { icon: 'Nublado', label: 'Nublado' }
}

function WeatherBadge({ w }) {
  if (!w) return <span className="text-xs text-gray-600 italic">Clima no disponible</span>
  const { label } = weatherLabel(w.weather_code)
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <span className="bg-gray-800 px-3 py-1 rounded-full text-white font-bold">
        {w.temperature_celsius != null ? `${w.temperature_celsius}°C` : '--'}
      </span>
      <span className="bg-gray-800 px-3 py-1 rounded-full text-gray-300">{label}</span>
      {w.wind_speed_kmh != null && (
        <span className="bg-gray-800 px-3 py-1 rounded-full text-gray-300">
          Viento {w.wind_speed_kmh} km/h
        </span>
      )}
      {w.precipitation_mm != null && w.precipitation_mm > 0 && (
        <span className="bg-blue-900/50 border border-blue-800 px-3 py-1 rounded-full text-blue-300">
          Lluvia {w.precipitation_mm} mm
        </span>
      )}
    </div>
  )
}

function TeamLinks({ team, name }) {
  if (!team) return null
  const links = team.links || {}
  const items = [
    { label: 'Transfermarkt', url: links.transfermarkt, color: 'text-green-400' },
    { label: 'FBRef', url: links.fbref, color: 'text-blue-400' },
    { label: 'Wikipedia', url: links.wikipedia, color: 'text-gray-300' },
    { label: 'Noticias', url: links.news, color: 'text-yellow-400' },
    { label: 'SofaScore', url: links.sofascore, color: 'text-orange-400' },
  ]

  return (
    <div>
      <div className="text-sm font-bold text-white mb-2">{name}</div>
      <div className="flex flex-wrap gap-2">
        {items.map(function(item) {
          if (!item.url) return null
          return (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={'text-xs px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors ' + item.color}
            >
              {item.label}
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default function ExternalPreview({ teamACode, teamBCode, teamAName, teamBName, venueName }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(function() {
    if (!teamACode || !teamBCode) return
    setLoading(true)
    setData(null)
    setError(null)

    axios.post(API + '/external_preview', {
      team_a_code: teamACode,
      team_b_code: teamBCode,
      venue_name: venueName || 'Sede Neutral',
    }).then(function(r) {
      setData(r.data)
    }).catch(function(e) {
      setError((e.response && e.response.data && e.response.data.detail) || 'No se pudo cargar la vista previa')
    }).finally(function() {
      setLoading(false)
    })
  }, [teamACode, teamBCode, venueName])

  if (loading) {
    return (
      <div className="card text-center py-6 text-gray-500 text-sm">
        Cargando vista previa externa...
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-red-800 text-red-400 text-sm py-4">{error}</div>
    )
  }

  if (!data) return null

  const weather = data.venue && data.venue.weather_live
  const weatherLink = data.venue && data.venue.links && data.venue.links.weather_forecast

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="card-header mb-0">Vista Previa Externa</h3>
        <span className="text-[10px] text-gray-600 italic">Datos de terceros, solo para referencia</span>
      </div>

      {/* Clima */}
      <div className="bg-gray-800/60 rounded-xl p-4">
        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
          Clima en {venueName || 'la sede'}
          {weatherLink && (
            <a href={weatherLink} target="_blank" rel="noopener noreferrer"
              className="ml-2 text-blue-400 hover:underline normal-case font-normal">
              ver mas
            </a>
          )}
        </div>
        <WeatherBadge w={weather} />
      </div>

      {/* Links de equipos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeamLinks team={data.team_a} name={teamAName || data.team_a && data.team_a.code} />
        <TeamLinks team={data.team_b} name={teamBName || data.team_b && data.team_b.code} />
      </div>

      {data.note && (
        <p className="text-[11px] text-gray-600 italic border-t border-gray-800 pt-3">{data.note}</p>
      )}
    </div>
  )
}
