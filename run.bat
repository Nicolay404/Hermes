@echo off
REM run.bat — Arranque único: backend FastAPI + frontend Vite (Windows)
REM Requisitos: Python 3.11+, Node.js 18+

title Football Predictor — Modelo Klement

echo.
echo  ^^  Football Predictor — Modelo Klement
echo ========================================
echo.

set SCRIPT_DIR=%~dp0

REM --- Backend ---
echo [1/4] Instalando dependencias del backend...
cd /d "%SCRIPT_DIR%backend"

if not exist ".venv\" (
    python -m venv .venv
    echo     Entorno virtual creado en backend\.venv
)

call .venv\Scripts\activate.bat
pip install -r requirements.txt -q
echo [OK] Dependencias del backend instaladas.

echo.
echo [2/4] Iniciando API FastAPI en http://localhost:8000 ...
start "FastAPI Backend" cmd /k "cd /d %SCRIPT_DIR%backend && .venv\Scripts\activate.bat && pip install -r requirements.txt -q && uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"

REM Esperar 3 segundos para que el backend arranque
timeout /t 3 /nobreak > nul

REM --- Frontend ---
echo.
echo [3/4] Instalando dependencias del frontend...
cd /d "%SCRIPT_DIR%frontend"
npm install -q
echo [OK] Dependencias del frontend instaladas.

echo.
echo [4/4] Iniciando Frontend Vite en http://localhost:5173 ...
start "Vite Frontend" cmd /k "cd /d %SCRIPT_DIR%frontend && npm run dev"

echo.
echo ========================================
echo  OK Ambos servidores iniciados en ventanas separadas.
echo.
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API docs: http://localhost:8000/docs
echo.
echo  Cierra las ventanas de CMD para detener los servidores.
echo ========================================
echo.

REM Abrir el navegador automáticamente después de 4 segundos
timeout /t 4 /nobreak > nul
start http://localhost:5173

pause
