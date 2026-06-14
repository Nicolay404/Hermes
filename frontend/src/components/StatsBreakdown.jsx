/**
 * StatsBreakdown.jsx
 * Panel de estadísticas comparativas del partido: tiros, corners, tarjetas, posesión.
 */

function StatBar({ labelA, labelB, valA, valB, unit = '' }) {
  const total = (valA || 0) + (valB || 0)
  const pctA = total > 0 ? Math.round((valA / total) * 100) : 50
  const pctB = 100 - pctA

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className="font-medium text-blue-300">{valA}{unit}</span>
        <span className="text-gray-500 text-[10px] uppercase tracking-wide">{labelA === labelB ? labelA : `${labelA} / ${labelB}`}</span>
        <span className="font-medium text-red-300">{valB}{unit}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
        <div className="bg-blue-500 transition-all" style={{ width: `${pctA}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${pctB}%` }} />
      </div>
    </div>
  )
}

function StatRow({ label, a, b }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-blue-300 font-medium text-sm w-28 text-right pr-3">{a}</span>
      <span className="text-[11px] text-gray-500 uppercase tracking-wide text-center flex-1">{label}</span>
      <span className="text-red-300 font-medium text-sm w-28 pl-3">{b}</span>
    </div>
  )
}

export default function StatsBreakdown({ stats, teamA, teamB }) {
  if (!stats) return null

  const a = stats.team_a || {}
  const b = stats.team_b || {}

  const get = (obj, key) => obj[key]?.mean != null
    ? obj[key].mean
    : obj[key]?.range_display || '?'

  const getRange = (obj, key) => obj[key]?.range_display || '–'
  const getMean  = (obj, key) => obj[key]?.mean ?? obj[key] ?? 0

  return (
    <div className="card mt-4">
      <h3 className="card-header">📊 Estadísticas Proyectadas</h3>

      {/* Encabezado de equipos */}
      <div className="flex justify-between text-xs font-bold mb-4">
        <span className="text-blue-400 uppercase tracking-wide">🔵 {teamA}</span>
        <span className="text-red-400 uppercase tracking-wide">{teamB} 🔴</span>
      </div>

      {/* Barras de comparación */}
      <div className="mb-4 space-y-1">
        <StatBar
          labelA={teamA} labelB={teamB}
          valA={getMean(a, 'shots_total')}
          valB={getMean(b, 'shots_total')}
        />
        <div className="text-center text-[10px] text-gray-600 -mt-1 mb-2">Tiros totales</div>

        <StatBar
          labelA={teamA} labelB={teamB}
          valA={parseFloat((a.possession?.range_display || '50').split('–')[0]) || 50}
          valB={parseFloat((b.possession?.range_display || '50').split('–')[0]) || 50}
          unit="%"
        />
        <div className="text-center text-[10px] text-gray-600 -mt-1">Posesión estimada</div>
      </div>

      {/* Tabla de stats */}
      <div className="bg-gray-950 rounded-lg px-3 py-1 mt-4">
        <StatRow label="xG (goles esperados)" a={a.xg} b={b.xg} />
        <StatRow label="Tiros totales"         a={getRange(a,'shots_total')}    b={getRange(b,'shots_total')} />
        <StatRow label="A puerta"              a={getRange(a,'shots_on_target')} b={getRange(b,'shots_on_target')} />
        <StatRow label="Corners"               a={getRange(a,'corners')}         b={getRange(b,'corners')} />
        <StatRow label="Faltas"                a={getRange(a,'fouls')}           b={getRange(b,'fouls')} />
        <StatRow label="Amarillas"             a={getRange(a,'yellow_cards')}    b={getRange(b,'yellow_cards')} />
        <StatRow label="Rojas"                 a={getRange(a,'red_cards')}       b={getRange(b,'red_cards')} />
        <StatRow label="Posesión"              a={getRange(a,'possession')}      b={getRange(b,'possession')} />
      </div>

      {/* Totales */}
      {stats.totals && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['⚽ Goles esp.', stats.totals.total_goals_expected],
            ['🎯 Tiros esp.', stats.totals.total_shots_expected],
            ['🚩 Corners esp.', stats.totals.total_corners_expected],
          ].map(([label, val]) => (
            <div key={label} className="bg-gray-800 rounded-lg py-2 px-1">
              <div className="text-lg font-bold text-white">{val}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
