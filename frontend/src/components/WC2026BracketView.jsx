/**
 * WC2026BracketView.jsx
 * Bracket eliminatorio completo del Mundial 2026.
 * Muestra R32 → R16 → QF → SF → Final con equipos resueltos desde simulación.
 * - Zoom/pan con rueda del mouse y arrastre
 * - Auto-fit al ancho del contenedor
 * - Filtro de búsqueda por país (resalta en el bracket)
 * - Hover sobre cualquier partido muestra: sede, fecha, equipos más probables
 */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { FIXTURES } from '../data/wc2026.js'

// ── Fixtures por fase ──────────────────────────────────────────────────────────
const KO_R32   = FIXTURES.filter(f => f.phase === 'r32')
const KO_R16   = FIXTURES.filter(f => f.phase === 'r16')
const KO_QF    = FIXTURES.filter(f => f.phase === 'qf')
const KO_SF    = FIXTURES.filter(f => f.phase === 'sf')
const KO_FINAL = FIXTURES.filter(f => f.phase === 'final')

// ── Colores por grupo ──────────────────────────────────────────────────────────
const GROUP_COLORS = {
  A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#ef4444',
  E: '#a855f7', F: '#06b6d4', G: '#f97316', H: '#14b8a6',
  I: '#e879f9', J: '#84cc16', K: '#94a3b8', L: '#fb923c',
}

// ── Resolver equipo más probable desde groupAdv ───────────────────────────────
// excludeSet: equipos ya asignados a otro slot del bracket (evita duplicados)
function resolveSlot(slotLabel, groupAdv, excludeSet = new Set()) {
  if (!slotLabel || !groupAdv) return { team: '?', prob: 0, group: null }
  const m = slotLabel.match(/(\d)º Grp ([\w/]+)/)
  if (!m) return { team: slotLabel, prob: 0, group: null }

  const pos = m[1]
  const groups = m[2].split('/')
  const probKey = pos === '1' ? 'p1st' : pos === '2' ? 'p2nd' : 'p3rd_adv'

  let best = '?', bestProb = 0, bestGroup = groups[0]
  for (const g of groups) {
    const gData = groupAdv[g] || {}
    for (const [team, probs] of Object.entries(gData)) {
      if (excludeSet.has(team)) continue   // ya asignado en otro slot
      const p = probs[probKey] || 0
      if (p > bestProb) { bestProb = p; best = team; bestGroup = g }
    }
  }
  return { team: best, prob: bestProb, group: bestGroup }
}

// ── Elegir ganador más probable de un partido ──────────────────────────────────
// excludeSet: equipos ya elegidos como ganadores de otros partidos de esta ronda
function likelyWinner(match, roundKey, roundProbs, excludeSet = new Set()) {
  if (!match) return { team: '?', prob: 0, group: null }
  const topTeam = match.top?.team
  const botTeam = match.bot?.team
  const tP = (!excludeSet.has(topTeam) ? roundProbs?.[topTeam]?.[roundKey] : -1) || 0
  const bP = (!excludeSet.has(botTeam) ? roundProbs?.[botTeam]?.[roundKey] : -1) || 0
  if (tP >= bP && topTeam && topTeam !== '?') {
    return { team: topTeam, prob: tP, group: match.top.group }
  }
  if (botTeam && botTeam !== '?') {
    return { team: botTeam, prob: bP, group: match.bot.group }
  }
  return { team: topTeam || '?', prob: tP, group: match.top?.group }
}

// ── Mapas de conexión entre rondas ────────────────────────────────────────────
const R16_SRCS = [
  [4, 5], [0, 1], [8, 9], [12, 13],
  [6, 7], [2, 3], [10, 11], [14, 15],
]
const QF_SRCS  = [[0,1],[2,3],[4,5],[6,7]]
const SF_SRCS  = [[0,1],[2,3]]
const FIN_SRCS = [0, 1]

const LEFT_R32_ORDER  = [4, 5, 0, 1, 8, 9, 12, 13]
const LEFT_R16_ORDER  = [0, 1, 2, 3]
const LEFT_QF_ORDER   = [0, 1]
const LEFT_SF_ORDER   = [0]
const RIGHT_R32_ORDER = [6, 7, 2, 3, 10, 11, 14, 15]
const RIGHT_R16_ORDER = [4, 5, 6, 7]
const RIGHT_QF_ORDER  = [2, 3]
const RIGHT_SF_ORDER  = [1]

function buildBracket(groupAdv, roundProbs) {
  if (!groupAdv || !roundProbs) return null

  // Asignar slots R32 sin duplicados: cada equipo aparece máximo una vez
  const assigned = new Set()
  const r32 = KO_R32.map(fix => {
    const part = (fix.label || '').split(' — ')[1] || ''
    const [aLbl, bLbl] = part.split(' vs ')
    const top = resolveSlot(aLbl?.trim(), groupAdv, assigned)
    if (top.team && top.team !== '?') assigned.add(top.team)
    const bot = resolveSlot(bLbl?.trim(), groupAdv, assigned)
    if (bot.team && bot.team !== '?') assigned.add(bot.team)
    return { id: fix.id, date: fix.date, venue: fix.venue, top, bot }
  })

  // Cada ronda: rastrear ganadores elegidos para evitar que un equipo gane dos partidos
  const r16Winners = new Set()
  const r16 = KO_R16.map((fix, i) => {
    const [si, ti] = R16_SRCS[i]
    const top = likelyWinner(r32[si], 'Octavos', roundProbs, r16Winners)
    if (top.team && top.team !== '?') r16Winners.add(top.team)
    const bot = likelyWinner(r32[ti], 'Octavos', roundProbs, r16Winners)
    if (bot.team && bot.team !== '?') r16Winners.add(bot.team)
    return { id: fix.id, date: fix.date, venue: fix.venue, top, bot }
  })

  const qfWinners = new Set()
  const qf = KO_QF.map((fix, i) => {
    const [si, ti] = QF_SRCS[i]
    const top = likelyWinner(r16[si], 'Cuartos', roundProbs, qfWinners)
    if (top.team && top.team !== '?') qfWinners.add(top.team)
    const bot = likelyWinner(r16[ti], 'Cuartos', roundProbs, qfWinners)
    if (bot.team && bot.team !== '?') qfWinners.add(bot.team)
    return { id: fix.id, date: fix.date, venue: fix.venue, top, bot }
  })

  const sfWinners = new Set()
  const sf = KO_SF.map((fix, i) => {
    const [si, ti] = SF_SRCS[i]
    const top = likelyWinner(qf[si], 'Semifinal', roundProbs, sfWinners)
    if (top.team && top.team !== '?') sfWinners.add(top.team)
    const bot = likelyWinner(qf[ti], 'Semifinal', roundProbs, sfWinners)
    if (bot.team && bot.team !== '?') sfWinners.add(bot.team)
    return { id: fix.id, date: fix.date, venue: fix.venue, top, bot }
  })

  const finalFix = KO_FINAL[0]
  const fin = finalFix ? {
    id: finalFix.id, date: finalFix.date, venue: finalFix.venue,
    top: likelyWinner(sf[FIN_SRCS[0]], 'Final', roundProbs),
    bot: likelyWinner(sf[FIN_SRCS[1]], 'Final', roundProbs),
  } : null

  return { r32, r16, qf, sf, fin }
}

// ── Tooltip de sede ───────────────────────────────────────────────────────────
function VenueTooltip({ match, side = 'right' }) {
  if (!match) return null
  const topProb  = match.top?.prob  || 0
  const botProb  = match.bot?.prob  || 0
  const topColor = GROUP_COLORS[match.top?.group]  || '#9ca3af'
  const botColor = GROUP_COLORS[match.bot?.group]  || '#9ca3af'

  return (
    <div
      className={`absolute z-50 top-1/2 -translate-y-1/2 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3 pointer-events-none
        ${side === 'right' ? 'left-[calc(100%+8px)]' : 'right-[calc(100%+8px)]'}`}
    >
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{match.id}</div>
      <div className="text-xs font-semibold text-white mb-0.5 flex items-center gap-1">
        🏟️ {match.venue}
      </div>
      <div className="text-[10px] text-gray-500 mb-2">📅 {match.date}</div>
      <div className="space-y-1 border-t border-gray-800 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: topColor }} />
            <span className="text-[11px] text-gray-200 truncate">{match.top?.team || '?'}</span>
          </div>
          <span className="text-[10px] font-mono text-green-400 shrink-0">{(topProb*100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: botColor }} />
            <span className="text-[11px] text-gray-200 truncate">{match.bot?.team || '?'}</span>
          </div>
          <span className="text-[10px] font-mono text-green-400 shrink-0">{(botProb*100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}

// ── Slot de equipo ─────────────────────────────────────────────────────────────
function TeamSlot({ slot, isWinner, hasBorderBottom, filterTeam }) {
  if (!slot) return null
  const color  = GROUP_COLORS[slot.group] || '#6b7280'
  const prob   = slot.prob || 0
  const pct    = Math.round(prob * 100)
  const bright = prob > 0.55 ? 'text-white' : prob > 0.3 ? 'text-gray-200' : 'text-gray-400'
  const isMatch = filterTeam && slot.team && slot.team !== '?'
    && slot.team.toLowerCase().includes(filterTeam.toLowerCase())

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 relative
        ${hasBorderBottom ? 'border-b border-gray-800' : ''}
        ${isWinner ? 'bg-gray-800/60' : ''}
        ${isMatch ? 'ring-1 ring-inset ring-yellow-400' : ''}`}
      style={isMatch ? { background: 'rgba(234,179,8,0.15)' } : undefined}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: color, width: `${pct}%`, maxWidth: '100%' }}
      />
      <div className="w-2 h-2 rounded-full shrink-0 z-10" style={{ background: color }} />
      <span className={`text-[11px] font-medium truncate z-10 ${isMatch ? 'text-yellow-300 font-bold' : bright}`} title={slot.team}>
        {slot.team || '?'}
      </span>
      {pct > 0 && (
        <span className="ml-auto text-[9px] font-mono text-gray-500 z-10 shrink-0">
          {pct}%
        </span>
      )}
    </div>
  )
}

// ── Tarjeta de partido ─────────────────────────────────────────────────────────
function MatchCard({ match, tooltipSide = 'right', highlight = false, filterTeam = '' }) {
  const [hovered, setHovered] = useState(false)
  if (!match) return <div className="h-14 w-36" />

  const topWins = (match.top?.prob || 0) >= (match.bot?.prob || 0)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`w-36 rounded-lg overflow-hidden cursor-pointer transition-all duration-150
          ${highlight ? 'border border-yellow-500/60 shadow-yellow-500/20 shadow-md'
                       : 'border border-gray-800 hover:border-gray-600'}`}
        style={{ background: '#111827' }}
      >
        <div className="bg-gray-900 px-2 py-0.5 text-[8px] text-gray-600 uppercase tracking-widest border-b border-gray-800">
          {match.id}
        </div>
        <TeamSlot slot={match.top} isWinner={topWins}  hasBorderBottom filterTeam={filterTeam} />
        <TeamSlot slot={match.bot} isWinner={!topWins} hasBorderBottom={false} filterTeam={filterTeam} />
      </div>

      {hovered && <VenueTooltip match={match} side={tooltipSide} />}
    </div>
  )
}

// ── Columna de ronda ──────────────────────────────────────────────────────────
function RoundColumn({ title, matches, totalSlots, tooltipSide = 'right', cardHighlight, filterTeam }) {
  const slots = Array.from({ length: totalSlots }, (_, i) => matches[i] || null)

  return (
    <div className="flex flex-col" style={{ minWidth: 144 }}>
      <div className="text-[9px] text-gray-600 uppercase tracking-widest text-center mb-2 h-4">
        {title}
      </div>
      <div className="flex flex-col flex-1">
        {slots.map((match, i) => (
          <div key={i} className="flex-1 flex items-center justify-center">
            <MatchCard
              match={match}
              tooltipSide={tooltipSide}
              highlight={cardHighlight?.(match)}
              filterTeam={filterTeam}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Líneas conector ───────────────────────────────────────────────────────────
function BracketLines({ srcCount, direction = 'right' }) {
  const pairs = srcCount / 2
  const isRight = direction === 'right'
  const BAR = '#374151'

  return (
    <div className="shrink-0 flex flex-col mt-6" style={{ width: 18 }}>
      {Array.from({ length: pairs }).map((_, pi) => (
        <div key={pi} className="flex-1 relative" style={{ minHeight: 0 }}>
          <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: 1, background: BAR }} />
          <div style={{ position: 'absolute', bottom: '25%', left: 0, right: 0, height: 1, background: BAR }} />
          <div style={{
            position: 'absolute',
            top: '25%', bottom: '25%',
            left: isRight ? undefined : 0,
            right: isRight ? 0 : undefined,
            width: 1, background: BAR,
          }} />
        </div>
      ))}
    </div>
  )
}

// ── Mitad de bracket ──────────────────────────────────────────────────────────
function BracketHalf({ side, bracket, groupsDict, roundProbs, filterTeam }) {
  const isLeft = side === 'left'

  const r32Matches = (isLeft ? LEFT_R32_ORDER : RIGHT_R32_ORDER).map(i => bracket.r32[i])
  const r16Matches = (isLeft ? LEFT_R16_ORDER : RIGHT_R16_ORDER).map(i => bracket.r16[i])
  const qfMatches  = (isLeft ? LEFT_QF_ORDER  : RIGHT_QF_ORDER ).map(i => bracket.qf[i])
  const sfMatches  = (isLeft ? LEFT_SF_ORDER  : RIGHT_SF_ORDER ).map(i => bracket.sf[i])

  const tooltipSide = isLeft ? 'right' : 'left'

  const cols = [
    <RoundColumn key="r32" title="Ronda 32" matches={r32Matches} totalSlots={8} tooltipSide={tooltipSide} filterTeam={filterTeam} />,
    <BracketLines key="l1" srcCount={8} direction={isLeft ? 'right' : 'left'} />,
    <RoundColumn key="r16" title="Octavos"  matches={r16Matches} totalSlots={4} tooltipSide={tooltipSide} filterTeam={filterTeam} />,
    <BracketLines key="l2" srcCount={4} direction={isLeft ? 'right' : 'left'} />,
    <RoundColumn key="qf"  title="Cuartos"  matches={qfMatches}  totalSlots={2} tooltipSide={tooltipSide} filterTeam={filterTeam} />,
    <BracketLines key="l3" srcCount={2} direction={isLeft ? 'right' : 'left'} />,
    <RoundColumn key="sf"  title="Semis"    matches={sfMatches}  totalSlots={1} tooltipSide={tooltipSide} filterTeam={filterTeam} />,
    <div key="cline" className="shrink-0 flex flex-col mt-6" style={{ width: 16 }}>
      <div className="flex-1 flex items-center">
        <div className="w-full border-t border-gray-700" />
      </div>
    </div>,
  ]

  return (
    <div className="flex gap-0.5 items-stretch" style={{ height: '100%' }}>
      {isLeft ? cols : [...cols].reverse()}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function WC2026BracketView({ groupAdv, roundProbs, champProbs, groups, allTeams }) {
  const groupsDict = !groups
    ? {}
    : Array.isArray(groups)
      ? Object.fromEntries(groups.map(g => [g, []]))
      : groups

  const bracket = useMemo(
    () => buildBracket(groupAdv, roundProbs),
    [groupAdv, roundProbs]
  )

  // ── Estado de zoom/pan ─────────────────────────────────────────────────────
  const [scale, setScale]     = useState(0.6)
  const [offset, setOffset]   = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef   = useRef({ startX: 0, startY: 0, ox: 0, oy: 0 })
  const outerRef  = useRef(null)
  const innerRef  = useRef(null)

  // Auto-fit al montar o cuando cambia el bracket
  useEffect(() => {
    if (!outerRef.current || !innerRef.current) return
    const ow = outerRef.current.offsetWidth
    const iw = innerRef.current.scrollWidth
    if (iw > 0) {
      const fit = Math.min(1, (ow - 16) / iw)
      setScale(parseFloat(fit.toFixed(2)))
      setOffset({ x: 0, y: 0 })
    }
  }, [bracket])

  // Zoom con rueda
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.08 : 0.08
    setScale(s => Math.min(2, Math.max(0.15, parseFloat((s + delta).toFixed(2)))))
  }, [])

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Pan con arrastre
  function onMouseDown(e) {
    if (e.button !== 0) return
    setDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y }
  }
  function onMouseMove(e) {
    if (!dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy })
  }
  function onMouseUp() { setDragging(false) }

  // ── Filtro de país ─────────────────────────────────────────────────────────
  const [filterTeam, setFilterTeam] = useState('')

  if (!bracket || !Object.keys(groupsDict).length) {
    return (
      <div className="card">
        <p className="text-gray-500 text-sm text-center py-8">
          Ejecuta la simulación para ver el bracket completo.
        </p>
      </div>
    )
  }

  // Campeón más probable
  const champEntries = Object.entries(champProbs || {})
    .sort((a, b) => b[1] - a[1])
  const champion = champEntries[0]
  const top5     = champEntries.slice(0, 5)

  const champColor = champion ? (GROUP_COLORS[
    Object.entries(groupsDict).find(([, teams]) => teams.includes(champion[0]))?.[0]
  ] || '#eab308') : '#eab308'

  function resetView() {
    if (!outerRef.current || !innerRef.current) return
    const ow = outerRef.current.offsetWidth
    const iw = innerRef.current.scrollWidth
    const fit = Math.min(1, (ow - 16) / iw)
    setScale(parseFloat(fit.toFixed(2)))
    setOffset({ x: 0, y: 0 })
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h3 className="card-header flex items-center gap-2 mb-0">
          🏆 Bracket WC2026
        </h3>

        {/* Filtro de país */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={filterTeam}
            onChange={e => setFilterTeam(e.target.value)}
            placeholder="Buscar país..."
            className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-1.5 w-40 focus:outline-none focus:border-yellow-500 placeholder-gray-600"
          />
          {filterTeam && (
            <button
              onClick={() => setFilterTeam('')}
              className="text-gray-500 hover:text-white text-xs"
            >✕ limpiar</button>
          )}
        </div>

        {/* Controles de zoom */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setScale(s => Math.min(2, parseFloat((s + 0.1).toFixed(2))))}
            className="w-7 h-7 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm font-bold flex items-center justify-center"
            title="Zoom +"
          >+</button>
          <span className="text-[10px] text-gray-500 w-10 text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.max(0.15, parseFloat((s - 0.1).toFixed(2))))}
            className="w-7 h-7 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm font-bold flex items-center justify-center"
            title="Zoom -"
          >−</button>
          <button
            onClick={resetView}
            className="ml-1 px-2 h-7 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 text-[10px] font-medium"
            title="Ajustar a pantalla"
          >Fit</button>
        </div>

        {champion && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: champColor + '22', color: champColor, border: `1px solid ${champColor}44` }}
          >
            {champion[0]} · {(champion[1] * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Top 5 campeones */}
      {top5.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {top5.map(([team, prob], i) => {
            const grp = Object.entries(groupsDict).find(([, ts]) => ts.includes(team))?.[0]
            const col = GROUP_COLORS[grp] || '#6b7280'
            return (
              <button
                key={team}
                onClick={() => setFilterTeam(team)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] transition-opacity hover:opacity-80 cursor-pointer"
                style={{ background: col + '15', border: `1px solid ${col}30` }}
                title="Clic para buscar en bracket"
              >
                <span className="text-gray-400">{i + 1}.</span>
                <span className="font-semibold" style={{ color: col }}>{team}</span>
                <span className="text-gray-500">{(prob * 100).toFixed(1)}%</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Contenedor con zoom/pan */}
      <div
        ref={outerRef}
        className="relative overflow-hidden rounded-lg"
        style={{
          height: 620,
          background: '#0a0f1a',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Hint */}
        <div className="absolute bottom-2 right-3 text-[9px] text-gray-700 pointer-events-none z-10">
          Rueda = zoom · Arrastrar = mover
        </div>

        <div
          ref={innerRef}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            display: 'inline-flex',
            alignItems: 'stretch',
            height: 600,
            padding: '8px 0',
          }}
        >
          {/* MITAD IZQUIERDA */}
          <BracketHalf
            side="left"
            bracket={bracket}
            groupsDict={groupsDict}
            roundProbs={roundProbs}
            filterTeam={filterTeam}
          />

          {/* CENTRO: FINAL + CAMPEÓN */}
          <div className="flex flex-col items-center justify-center gap-3 px-4" style={{ minWidth: 200 }}>
            <div className="text-[9px] text-gray-600 uppercase tracking-widest">Final · 19 Jul</div>
            <div className="text-3xl">🏆</div>
            <MatchCard
              match={bracket.fin}
              tooltipSide="right"
              highlight={true}
              filterTeam={filterTeam}
            />
            {champion && (
              <div className="text-center mt-2">
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Campeón proyectado</div>
                <div
                  className="px-3 py-1.5 rounded-xl text-sm font-bold"
                  style={{
                    background: champColor + '20',
                    color: champColor,
                    border: `1px solid ${champColor}50`,
                    boxShadow: `0 0 12px ${champColor}30`
                  }}
                >
                  {champion[0]}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {(champion[1] * 100).toFixed(1)}% probabilidad
                </div>
                <div className="text-[9px] text-gray-600 mt-0.5">MetLife Stadium</div>
              </div>
            )}
          </div>

          {/* MITAD DERECHA */}
          <BracketHalf
            side="right"
            bracket={bracket}
            groupsDict={groupsDict}
            roundProbs={roundProbs}
            filterTeam={filterTeam}
          />
        </div>
      </div>

      {/* Leyenda de grupos */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-800">
        <span className="text-[9px] text-gray-700 uppercase tracking-wider">Grupos</span>
        {Object.entries(GROUP_COLORS).map(([g, c]) => (
          <button
            key={g}
            onClick={() => {
              const teams = groupsDict[g] || []
              if (teams.length > 0) setFilterTeam(teams[0])
            }}
            className="flex items-center gap-1 hover:opacity-70"
            title={`Ver Grupo ${g}`}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: c }} />
            <span className="text-[9px] text-gray-600">{g}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
