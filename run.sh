#!/usr/bin/env bash
# run.sh — Arranque único: backend FastAPI + frontend Vite
# Uso: chmod +x run.sh && ./run.sh
# Requisitos: Python 3.11+, Node.js 18+

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "⚽ Football Predictor — Modelo Klement"
echo "========================================"
echo ""

# --- Backend ---
echo "📦 Instalando dependencias del backend..."
cd "$SCRIPT_DIR/backend"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "   → Entorno virtual creado en backend/.venv"
fi

source .venv/bin/activate
pip install -r requirements.txt -q
echo "   ✅ Dependencias del backend instaladas"

# Arrancar FastAPI en segundo plano
echo ""
echo "🚀 Iniciando API FastAPI en http://localhost:8000 ..."
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "   PID backend: $BACKEND_PID"

# --- Frontend ---
echo ""
echo "📦 Instalando dependencias del frontend..."
cd "$SCRIPT_DIR/frontend"
npm install -q
echo "   ✅ Dependencias del frontend instaladas"

echo ""
echo "🚀 Iniciando Frontend Vite en http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!
echo "   PID frontend: $FRONTEND_PID"

echo ""
echo "========================================"
echo "✅ Ambos servidores iniciados."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores."
echo "========================================"

# Trap para matar ambos procesos al salir
trap "echo ''; echo 'Deteniendo servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait $BACKEND_PID $FRONTEND_PID
