/**
 * MatchResult.jsx — Panel de resultado de partido (modo resultado histórico).
 * No es el resultado de predicción; es para mostrar resultados reales ingresados.
 */
export default function MatchResult({ match, result, onBack }) {
  if (!match) return null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">Resultado del Partido</h2>
        <div className="flex items-center gap-2">
          <span className="badge bg-green-900/50 text-green-400 border border-green-800">FINALIZADO</span>
          {onBack && (
            <button onClick={onBack} className="btn-secondary text-xs">← Volver</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-4 text-center bg-gray-950 rounded-xl p-6 mb-4">
        <div>
          <div className="text-xl font-black text-white">{match.team1Name || match.team_a}</div>
          <div className="text-xs text-gray-500 mt-1">{match.groupName || ''}</div>
        </div>
        <div>
          <div className="text-5xl font-black text-white">
            {result?.score1 ?? '?'} – {result?.score2 ?? '?'}
          </div>
          <div className="text-xs text-gray-600 mt-1">Marcador Final</div>
        </div>
        <div>
          <div className="text-xl font-black text-white">{match.team2Name || match.team_b}</div>
          <div className="text-xs text-gray-500 mt-1">{match.venue || ''}</div>
        </div>
      </div>

      {result?.events?.length > 0 && (
        <div className="bg-gray-950 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">Eventos</h3>
          <div className="space-y-2">
            {result.events.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                <span className="text-xs text-gray-600 font-mono w-8">{ev.minute}'</span>
                <span>{ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : ev.type === 'red' ? '🟥' : '📋'}</span>
                <span>{ev.player} ({ev.team})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
