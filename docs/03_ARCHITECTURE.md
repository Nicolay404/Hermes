# 03_ARCHITECTURE.md — Arquitectura del Sistema Hermes

> Referencia técnica del proyecto. Leer antes de proponer cambios de arquitectura.

---

## 1. Stack tecnológico

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend | React 18 + Vite | 18.x / 5.x | SPA rápida, hot reload, Tailwind nativo |
| Estilos | Tailwind CSS | 3.x | Dark theme, clases utilitarias, sin CSS extra |
| Backend | Python + FastAPI | 3.11 / 0.110+ | Async, tipado, auto-docs en `/docs` |
| Servidor | Uvicorn | — | ASGI, recarga automática en dev |
| Modelo estadístico | NumPy + SciPy | — | Poisson bivariado, Monte Carlo |
| HTTP client (backend) | httpx | — | Para llamadas a Gemini, Open-Meteo, LLM local |
| HTTP client (frontend) | axios | — | Llamadas a FastAPI |
| Datos | CSV en `/data/` | — | Sin DB: `teams.csv`, `venues.csv`, `historical_results.csv` |
| IA (Baley) | Gemini 2.0 Flash o LLM local | — | API key o LM Studio local (OpenAI-compatible) |
| Clima | Open-Meteo API | — | Gratuita, sin API key |

---

## 2. Diagrama de arquitectura

```
[Navegador — React 18 + Vite (puerto 5173)]
              │
              │ HTTP / REST (axios)
              ▼
[Backend — FastAPI + Uvicorn (puerto 8000)]
    │               │               │
    ▼               ▼               ▼
[CSV /data/]   [LLM local /    [APIs externas]
 teams.csv      LM Studio       - Gemini 2.0 Flash
 venues.csv     Ollama]         - Open-Meteo (clima)
 historical_               - ESPN (resultados WC)
 results.csv]
```

---

## 3. Modelo Klement — núcleo del sistema

El modelo estadístico vive en `backend/core/`:

```
backend/core/
├── strength_model.py     ← Fuerza estructural de equipos (6 factores)
├── match_model.py        ← Poisson bivariado + lambda ajustado
├── stats_model.py        ← Estadísticas derivadas (xG, corners, etc.)
├── tournament_sim.py     ← Simulación de bracket personalizado
├── wc2026_sim.py         ← Simulación específica del Mundial 2026
└── calibration.py        ← Recalibración de pesos con datos históricos
```

### Factores estructurales (pesos en `config/weights.json`)

| Factor | Descripción |
|---|---|
| `fifa_ranking` | Posición actual en ranking FIFA |
| `elo_points` | Rating Elo dinámico |
| `gdp_per_capita` | Proxy de inversión en infraestructura |
| `population_culture` | Masa de aficionados y cultura futbolística |
| `squad_strength` | Calidad de plantilla (valor de mercado) |
| `avg_temp` | Adaptación climática |

### Pipeline de predicción

```
1. load_teams()          → DataFrame con 6 factores estructurales
2. compute_structural_strength()  → Score normalizado [0-1] por equipo
3. Ajuste por tipo de partido (multiplicadores en weights.json)
4. Ajuste por ventaja local (home_advantage en weights.json)
5. Ajuste por H2H (head-to-head, peso configurable)
6. lambda_A, lambda_B → Parámetros Poisson de goles esperados (xG)
7. Distribución Poisson bivariada → probabilidades de cada marcador
8. 10.000 iteraciones Monte Carlo → distribución empírica adicional
9. Resultado final = 50% analítico + 50% Monte Carlo
```

---

## 4. Estructura del repositorio

```
Hermes/
├── backend/
│   ├── api/
│   │   └── main.py              ← FastAPI, todos los endpoints
│   └── core/
│       ├── strength_model.py
│       ├── match_model.py
│       ├── stats_model.py
│       ├── tournament_sim.py
│       ├── wc2026_sim.py
│       └── calibration.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx              ← Tabs + layout principal
│   │   ├── index.css            ← Clases dark theme (card, btn-primary, etc.)
│   │   ├── components/
│   │   │   ├── MatchPredictor.jsx    ← Predictor principal + WC2026Picker
│   │   │   ├── WC2026Picker.jsx     ← Selector de partidos del Mundial
│   │   │   ├── BaleySidebar.jsx     ← Analista IA sidebar
│   │   │   ├── BetSlipAnalyzer.jsx  ← Análisis de boletas por foto
│   │   │   ├── SearchableSelect.jsx ← Selector de equipos con búsqueda
│   │   │   ├── StatsBreakdown.jsx   ← Estadísticas del partido
│   │   │   ├── TournamentBracket.jsx ← Bracket Mundial + personalizado
│   │   │   ├── WC2026BracketView.jsx ← Vista del bracket eliminatorio
│   │   │   ├── ExternalPreview.jsx  ← Clima + links externos
│   │   │   ├── ModelTransparency.jsx ← Pesos y parámetros del modelo
│   │   │   └── RecalibrationPanel.jsx ← Recalibración con CSV
│   │   └── data/
│   │       └── wc2026.js        ← Fixtures y resultados del Mundial 2026
│   └── index.html
├── data/
│   ├── teams.csv                ← 48+ selecciones con factores estructurales
│   ├── venues.csv               ← Sedes con coordenadas GPS
│   └── historical_results.csv  ← Historial para recalibración
├── config/
│   └── weights.json             ← Pesos del modelo (modificables)
├── scripts/
│   └── update_wc2026_results.py ← Auto-actualiza resultados desde ESPN API
├── run.sh / run.bat             ← Inicio rápido (backend + frontend)
└── PROJECT_CONTEXT.md           ← Estado actual del proyecto (leer primero)
```

---

## 5. IA — Baley

Baley es el analista de apuestas integrado en la app. Funciona en tres modos dentro de `BaleySidebar.jsx`:

### Modo 1: Análisis de partido
- Se activa al marcar "Modelo local" o "Gemini API" en el predictor y pulsar "Predecir"
- Recibe los datos de predicción (probabilidades, xG, stats) como contexto
- Devuelve JSON estructurado con: resumen, apuesta segura, combinada, arriesgada, goles
- Endpoint: `POST /predict_match` → campo `gemini_interpretation`

### Modo 2: Chat libre con Baley
- Input de texto en la parte inferior del sidebar
- Permite follow-up conversacional: "dame la combinada segura", "qué línea de goles recomiendas", etc.
- Endpoint: `POST /baley_chat` — acepta `message` + `history` (últimos 10 turnos) + `prediction_context` (JSON del modelo)
- El historial se resetea al cambiar de partido

### Modo 3: Análisis de boleta por foto
- Sección colapsable "📸 Adjuntar boleta" al pie del sidebar
- Si hay predicción activa, se envía el contexto del modelo junto a la imagen para un análisis más preciso
- Endpoint: `POST /analyze_bet_slip` con imagen en base64 + `prediction_context`
- Funciona con Gemini (vision nativa) o LLM local con soporte de visión
- El resultado aparece como nuevo bloque en el chat

### Layout pantalla dividida (MatchPredictor)
- Cuando la IA está activa: `grid grid-cols-[1fr_440px]` con `h-[calc(100vh-140px)]`
- Columna izquierda (stats): `overflow-y-auto` — scroll independiente
- Columna derecha (Baley): `h-full` — scroll propio dentro del sidebar
- Sin IA activa: layout simple de una columna

### Config por defecto (LM Studio)
- URL: `http://127.0.0.1:1234`
- Modelo: `google/gemma-3-4b`
- API: OpenAI-compatible (`/v1/chat/completions`)

---

## 6. Datos del Mundial 2026

`frontend/src/data/wc2026.js` es la fuente de verdad de fixtures y resultados.

- **104 partidos:** 72 de grupos (A-L) + 32 de eliminatorias
- **Resultados:** Se actualizan manualmente o vía `scripts/update_wc2026_results.py`
- **Auto-actualización:** Tarea programada cada hora (Cowork) que corre el script via ESPN API
- Los nombres de equipos y sedes deben coincidir exactamente con `teams.csv` y `venues.csv`

---

## 7. APIs externas utilizadas

| Servicio | Propósito | Costo | Alternativa si falla |
|---|---|---|---|
| Gemini 2.0 Flash | Análisis Baley (texto + visión) | Gratis (cuota) | LLM local |
| Open-Meteo | Clima en tiempo real en la sede | Gratis, sin key | Mostrar "No disponible" |
| ESPN API (scoreboard) | Auto-update resultados WC2026 | Gratis (no oficial) | Actualización manual |
| Transfermarkt / FBRef / SofaScore | Links de referencia | Solo links, sin scraping | N/A |

---

## 8. Clases CSS del dark theme

Definidas en `frontend/src/index.css`:

| Clase | Uso |
|---|---|
| `card` | Contenedor principal con fondo oscuro y borde |
| `card-header` | Título de sección dentro de card |
| `btn-primary` | Botón principal verde |
| `btn-secondary` | Botón secundario gris |
| `input-field` | Input de texto dark |
| `select-field` | Select dark |
| `tab-btn` | Botón de tab |
| `tab-active` | Estado activo del tab |
| `tab-inactive` | Estado inactivo del tab |

---

## 9. Endpoints del backend (FastAPI — puerto 8000)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/predict_match` | Predicción completa + interpretación Baley |
| POST | `/simulate_wc2026` | Simulación del Mundial 2026 |
| POST | `/simulate_tournament` | Bracket personalizado |
| GET | `/weights` | Pesos actuales del modelo |
| PUT | `/weights` | Actualizar pesos |
| POST | `/recalibrate` | Recalibrar con CSV histórico |
| POST | `/apply_weights` | Aplicar pesos sugeridos |
| GET | `/teams` | Lista de selecciones |
| GET | `/venues` | Lista de sedes |
| POST | `/external_preview` | Clima + links externos |
| POST | `/analyze_bet_slip` | Análisis de boleta por imagen (IA + visión) |
| POST | `/baley_chat` | Chat libre con Baley (historial + contexto predicción) |

---

## 10. Restricciones y límites conocidos

- Sin persistencia: el historial de chat de Baley se pierde al recargar la página
- Sin autenticación: acceso local únicamente
- ESPN API no oficial: puede cambiar o fallar sin aviso
- Los LLM locales sin soporte de visión no pueden analizar boletas (solo Gemini o modelos multimodales)
- Monte Carlo con 10k iteraciones puede tardar 1-3 segundos en hardware modesto
- El chat de Baley manda máximo 10 turnos de historial por llamada para no exceder el contexto del LLM

---

## 11. Inicio rápido

```bash
# Desde la raíz del proyecto:
./run.sh          # Linux/Mac
run.bat           # Windows

# O manualmente:
cd backend && uvicorn api.main:app --reload --port 8000
cd frontend && npm run dev
```

API disponible en: `http://localhost:8000/docs`
Frontend en: `http://localhost:5173`

---

*Actualizar este documento al cambiar la arquitectura, añadir módulos o modificar el stack.*
