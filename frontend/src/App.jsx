import { useState, useEffect } from 'react'
import MatchPredictor from './components/MatchPredictor.jsx'
import TournamentBracket from './components/TournamentBracket.jsx'
import ModelTransparency from './components/ModelTransparency.jsx'
import RecalibrationPanel from './components/RecalibrationPanel.jsx'
import BetSlipAnalyzer from './components/BetSlipAnalyzer.jsx'
const TABS = [
  { id: 'predict',    label: 'Prediccion de Partido' },
  { id: 'tournament', label: 'Simulacion de Torneo' },
  { id: 'model',      label: 'Transparencia del Modelo' },
  { id: 'calibrate',  label: 'Recalibracion' },
  { id: 'betslip',    label: 'Boleta (standalone)' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('predict')
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(r => r.ok ? setApiStatus('online') : setApiStatus('offline'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Football Predictor</h1>
              <p className="text-xs text-gray-500">Modelo Klement • Poisson + Monte Carlo + Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-green-400' : apiStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'}`} />
            <span className="text-xs text-gray-400">
              {apiStatus === 'online' ? 'API conectada' : apiStatus === 'offline' ? 'API desconectada' : 'Conectando...'}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 py-2 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn whitespace-nowrap ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Offline warning */}
      {apiStatus === 'offline' && (
        <div className="bg-red-900/50 border-b border-red-800 px-4 py-2">
          <p className="text-red-300 text-sm text-center">
            ⚠️ El backend FastAPI no está disponible en localhost:8000.
            Ejecuta <code className="bg-red-900 px-1 rounded">run.sh</code> o <code className="bg-red-900 px-1 rounded">run.bat</code> para iniciarlo.
          </p>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'predict'    && <MatchPredictor />}
        {activeTab === 'betslip'    && <BetSlipAnalyzer />}
        {activeTab === 'tournament' && <TournamentBracket />}
        {activeTab === 'model'      && <ModelTransparency />}
        {activeTab === 'calibrate'  && <RecalibrationPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6 text-center">
        <p className="text-gray-600 text-xs">
          Modelo inspirado en Klement (Liberum/Panmure, 2014) y Hoffmann, Ging & Ramasamy (2002).
          Los datos son aproximaciones con fines de modelado. No constituyen asesoramiento deportivo.
        </p>
      </footer>
    </div>
  )
}
