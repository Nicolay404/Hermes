# ⚽ Football Predictor — Modelo Econométrico Klement

Aplicación completa para predecir resultados de partidos de fútbol internacionales, inspirada en el modelo econométrico de Joachim Klement (Liberum/Panmure), con simulación Monte Carlo, integración con Gemini AI y previsualización de datos externos.

---

## Requisitos Previos

| Herramienta | Versión mínima |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Instalación y Arranque Rápido

### Opción 1 — Script único (recomendado)

**Linux/Mac:**
```bash
chmod +x run.sh && ./run.sh
```

**Windows:**
```bat
run.bat
```

Esto instala todas las dependencias y levanta ambos servidores automáticamente.

### Opción 2 — Manual (dos terminales)

**Terminal 1 — Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate.bat     # Windows
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### URLs de acceso
- **Frontend:** http://localhost:5173
- **API Backend:** http://localhost:8000
- **Documentación API (Swagger):** http://localhost:8000/docs

---

## Descripción del Modelo

### Base teórica

Inspirado en:
- **Klement, J. (2014-2022)** — Predicción de Copas del Mundo via factores socioeconómicos (Liberum/Panmure).
- **Hoffmann, Ging & Ramasamy (2002)** — "The socioeconomic determinants of international soccer performance", *Journal of Applied Economics*.

**IMPORTANTE:** Los pesos exactos de Klement no son públicos. Esta es una aproximación.

### Factores del Índice de Fuerza Estructural

| Factor | Peso default | Descripción |
|---|---|---|
| GDP per cápita | 20% | Rendimientos decrecientes sobre $60,000 USD |
| Población × Cultura | 10% | Población log-normalizada × índice cultural |
| Ranking FIFA / Elo | 40% | Forma reciente |
| Fortaleza del Plantel | 30% | Proxy Transfermarkt (editable en teams.csv) |

### Factores Contextuales

- 🏠 **Localía:** Bonus según tipo de partido
- 🌡️ **Clima:** Penalización por diferencia de temperatura
- ⛰️ **Altitud:** Penalización para sedes >1500m
- 📅 **H2H:** Historial reciente con decaimiento exponencial
- 🎲 **Varianza por tipo:** Amistosos más impredecibles que Mundiales

### Pipeline de cálculo

```
Fuerza estructural
    → Ajuste contextual (localía + clima + altitud + H2H)
        → xG por equipo (función lineal calibrada)
            → Distribución Poisson bivariada (matriz de marcadores)
                → Monte Carlo (50,000 iters) → Probabilidades finales
                    → Estadísticas secundarias (tiros, corners, tarjetas, etc.)
```

---

## Archivos de Datos

### `/data/teams.csv` — Columnas clave

| Columna | Descripción | Actualizar |
|---|---|---|
| `fifa_ranking` | Posición ranking FIFA | Mensualmente (fifa.com) |
| `elo_points` | Puntos Elo | Mensualmente (eloratings.net) |
| `squad_strength_index` | 0-100, calidad plantel | Por torneo (Transfermarkt) |
| `football_culture_index` | 0-100, popularidad fútbol | Anualmente |
| `gdp_per_capita` | USD, datos Banco Mundial | Anualmente |

### `/data/h2h_history.csv` — Formato

```csv
team_a, team_b, date, goals_a, goals_b, match_type, venue_name
Argentina, France, 2022-12-18, 3, 3, mundial, Lusail Stadium
```

`match_type`: `mundial | clasificatoria | amistoso | torneo_continental | nations_league`

### `/config/model_weights.json` — Pesos configurables

Todos los parámetros del modelo se configuran aquí sin tocar código.
Se editan también desde la pestaña "⚙️ Transparencia del Modelo".

---

## Integración Gemini AI (gratuita)

1. Obtén tu API Key en [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. En la app, activa "🤖 Gemini AI" e ingresa tu key
3. Usa **Gemini 1.5 Flash** (capa gratuita, sin costo)

---

## Previsualización Externa

La app incluye links directos para verificar datos antes de confiar en la predicción:

| Fuente | Uso |
|---|---|
| 💰 Transfermarkt | Plantillas, valores de mercado, lesiones |
| 📈 FBRef | Estadísticas avanzadas (xG, presión, pases) |
| 📰 Google News | Noticias recientes, lesiones confirmadas |
| 🌡️ Open-Meteo | Clima en tiempo real en la sede (sin API key) |

---

## Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

---

## Endpoints API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/teams` | Lista de selecciones |
| `GET` | `/venues` | Lista de sedes |
| `POST` | `/predict_match` | Predicción completa |
| `POST` | `/simulate_tournament` | Simulación de torneo |
| `GET/PUT` | `/weights` | Leer/actualizar pesos |
| `POST` | `/recalibrate` | Recalibrar con CSV histórico |
| `POST` | `/gemini_interpret` | Interpretación Gemini |
| `POST` | `/external_preview` | Links externos + clima |

---

## Resultado de Prueba: Argentina vs Francia (Mundial, Sede Neutral)

Ejecutando `/predict_match`:
```json
{
  "probabilities": {
    "home_win": ~0.40,   // Argentina gana
    "draw": ~0.26,
    "away_win": ~0.34    // Francia gana
  },
  "expected_goals": { "team_a": ~1.3, "team_b": ~1.5 },
  "most_likely_score": { "score_a": 1, "score_b": 1, "probability": ~0.12 }
}
```

Francia tiene ventaja ligera (squad_strength_index: 96 vs 91). El partido es muy parejo.

---

## Limitaciones

1. No es una réplica exacta del modelo de Klement — pesos exactos no son públicos
2. No captura lesiones, estilo táctico ni motivación del partido
3. Los datos socioeconómicos son estimaciones 2023-2025
4. La posesión es una aproximación (no captura estilos de juego como el tiki-taka)
5. Los amistosos tienen alta varianza real no siempre capturada por el modelo

---

*Herramienta de análisis personal. No usar para apuestas deportivas.*
