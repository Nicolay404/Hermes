/**
 * WC2026Picker — Selector interactivo de partidos del Mundial 2026.
 * Al hacer clic en un partido, pre-rellena el formulario del predictor.
 */
import { useState } from 'react'
import { GROUPS, GROUP_TEAMS, FIXTURES, PHASE_LABELS, isPlayed } from '../data/wc2026.js'

const TODAY = '2026-06-13'

const PHASE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final']

// Formato de fecha legible
function fmtDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  const months = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(d)} ${months[parseInt(m)]}`
}

function ResultBadge({ result }) {
  if (!result) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-700 text-xs font-bold tabular-nums">
      {result.a} – {result.b}
    </span>
  )
}

function MatchRow({ fixture, onSelect }) {
  const played = isPlayed(fixture)
  const hasTeams = fixture.team_a && fixture.team_b
  const isToday = fixture.date === TODAY
  const isPast = fixture.date < TODAY

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm
      ${played ? 'opacity-70' : 'hover:bg-gray-700/60'}
      ${isToday ? 'bg-green-900/20 border border-green-800/40' : ''}
    `}>
      {/* Fecha + hora */}
      <div className="w-16 shrink-0 text-xs text-gray-500 text-right leading-tight">
        <div>{fmtDate(fixture.date)}</div>
        {fixture.time && <div className="text-gray-600">{fixture.time}</div>}
      </div>

      {/* Equipos o TBD */}
      <div className="flex-1 min-w-0">
        {hasTeams ? (
          <div className="flex items-center gap-1.5">
            <span className={played ? 'text-gray-400' : 'text-gray-200 font-medium'}>
              {fixture.team_a}
            </span>
            <span className="text-gray-600 text-xs">vs</span>
            <span className={played ? 'text-gray-400' : 'text-gray-200 font-medium'}>
              {fixture.team_b}
            </span>
          </div>
        ) : (
          <div className="text-gray-600 text-xs italic">{fixture.label || 'Por definir'}</div>
        )}
        <div className="text-xs text-gray-600 truncate">{fixture.venue}</div>
      </div>

      {/* Badge resultado o botón predecir */}
      <div className="shrink-0">
        {played && <ResultBadge result={fixture.result} />}
        {!played && hasTeams && (
          <button
            type="button"
            onClick={() => onSelect(fixture)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors
              ${isToday
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
          >
            {isToday ? 'Predecir ↓' : '↓ Predecir'}
          </button>
        )}
      </div>
    </div>
  )
}

function GroupTab({ group, active, onClick }) {
  // Contar partidos jugados en el grupo
  const fixtures = FIXTURES.filter(f => f.group === group)
  const played = fixtures.filter(isPlayed).length

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border
        ${active
          ? 'bg-green-600 border-green-500 text-white'
          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
        }`}
    >
      {group}
      {played > 0 && (
        <span className={`ml-1 text-xs font-normal ${active ? 'text-green-200' : 'text-gray-600'}`}>
          {played}/6
        </span>
      )}
    </button>
  )
}

export default function WC2026Picker({ onSelectMatch }) {
  const [view, setView] = useState('group') // 'group' | 'knockout'
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [expanded, setExpanded] = useState(true)

  const groupFixtures = FIXTURES
    .filter(f => f.group === selectedGroup)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))

  // Fixtures de eliminatorias agrupados por fase
  const knockoutFixtures = FIXTURES.filter(f => f.phase !== 'group')

  const handleSelect = (fixture) => {
    if (onSelectMatch) {
      onSelectMatch({
        team_a: fixture.team_a,
        team_b: fixture.team_b,
        venue_name: fixture.venue,
        match_type: 'mundial',
      })
    }
    // Scroll al formulario
    document.getElementById('predictor-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="card border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-white">Copa del Mundo 2026</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Selecciona un partido para pre-rellenar el predictor
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1"
          title={expanded ? 'Colapsar' : 'Expandir'}
        >
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <>
          {/* Pestañas de fase */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setView('group')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${view === 'group'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'}`}
            >
              Fase de Grupos
            </button>
            <button
              type="button"
              onClick={() => setView('knockout')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${view === 'knockout'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'}`}
            >
              Eliminatorias
            </button>
          </div>

          {view === 'group' && (
            <>
              {/* Selector de grupo */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {GROUPS.map(g => (
                  <GroupTab
                    key={g}
                    group={g}
                    active={g === selectedGroup}
                    onClick={() => setSelectedGroup(g)}
                  />
                ))}
              </div>

              {/* Equipos del grupo */}
              <div className="flex flex-wrap gap-1 mb-3 text-xs text-gray-500">
                <span className="text-gray-600">Grupo {selectedGroup}:</span>
                {GROUP_TEAMS[selectedGroup].map((t, i) => (
                  <span key={t}>
                    {t}{i < GROUP_TEAMS[selectedGroup].length - 1 ? <span className="mx-0.5 text-gray-700">·</span> : ''}
                  </span>
                ))}
              </div>

              {/* Lista de partidos del grupo */}
              <div className="space-y-0.5">
                {[1, 2, 3].map(round => {
                  const roundFixtures = groupFixtures.filter(f => f.round === round)
                  return (
                    <div key={round}>
                      <div className="text-xs text-gray-600 px-3 pt-2 pb-1">Jornada {round}</div>
                      {roundFixtures.map(f => (
                        <MatchRow key={f.id} fixture={f} onSelect={handleSelect} />
                      ))}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {view === 'knockout' && (
            <div className="space-y-4">
              {PHASE_ORDER.filter(p => p !== 'group').map(phase => {
                const pFixtures = knockoutFixtures.filter(f => f.phase === phase)
                if (!pFixtures.length) return null
                return (
                  <div key={phase}>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 pb-1 border-b border-gray-800 mb-1">
                      {PHASE_LABELS[phase]}
                    </div>
                    <div className="space-y-0.5">
                      {pFixtures.map(f => (
                        <MatchRow key={f.id} fixture={f} onSelect={handleSelect} />
                      ))}
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-gray-600 px-3 pb-1">
                Los cruces se actualizarán conforme avance el torneo.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
