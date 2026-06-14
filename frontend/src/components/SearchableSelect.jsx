import { useState, useRef, useEffect } from 'react'

/**
 * SearchableSelect — dropdown buscable con tema oscuro.
 * Props:
 *   options   : [{ name, code, fifa_ranking, confederation, structural_strength }]
 *   value     : string (name del equipo seleccionado)
 *   onChange  : (option) => void
 *   placeholder: string
 *   label     : string (opcional)
 */
export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Buscar...', label }) {
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const containerRef          = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(query.toLowerCase()) ||
    (o.code || '').toLowerCase().includes(query.toLowerCase())
  )

  function select(opt) {
    onChange(opt)
    setOpen(false)
    setQuery('')
  }

  function clear(e) {
    e.stopPropagation()
    onChange(null)
    setQuery('')
  }

  const confColor = {
    UEFA: 'bg-blue-900/50 text-blue-300',
    CONMEBOL: 'bg-yellow-900/50 text-yellow-300',
    CONCACAF: 'bg-red-900/50 text-red-300',
    CAF: 'bg-green-900/50 text-green-300',
    AFC: 'bg-purple-900/50 text-purple-300',
    OFC: 'bg-gray-700 text-gray-300',
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {label && <label className="block text-xs text-gray-400 mb-1 font-medium">{label}</label>}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full input-field flex items-center justify-between text-left"
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <span
              onClick={clear}
              className="text-gray-500 hover:text-white px-1 text-xs"
              title="Limpiar"
            >✕</span>
          )}
          <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-800">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar equipo..."
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2
                         focus:outline-none focus:border-green-500 placeholder-gray-500"
            />
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-600 text-sm">
                Sin resultados para "{query}"
              </div>
            )}
            {filtered.map(opt => (
              <button
                key={opt.code || opt.name}
                type="button"
                onClick={() => select(opt)}
                className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-800 transition-colors text-left
                            ${value === opt.name ? 'bg-gray-800 text-green-400' : 'text-gray-200'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-gray-500 w-5 shrink-0">
                    {opt.fifa_ranking || '?'}
                  </span>
                  <span className="text-sm font-medium truncate">{opt.name}</span>
                  {opt.confederation && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${confColor[opt.confederation] || 'bg-gray-800 text-gray-400'}`}>
                      {opt.confederation}
                    </span>
                  )}
                </div>
                {opt.structural_strength != null && (
                  <span className="text-[10px] text-gray-600 font-mono shrink-0 ml-2">
                    {(opt.structural_strength * 100).toFixed(1)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
