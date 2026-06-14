# PROJECT_CONTEXT.md

> **Instrucción para cualquier IA:** Este es el primer archivo que debes leer. Resume el estado actual del proyecto. No asumas nada que no esté aquí o en los documentos enlazados.

---

## Identidad del proyecto

| Campo | Valor |
|---|---|
| **Nombre** | Hermes — Football Predictor |
| **Tipo** | Herramienta interna / MVP web |
| **Estado actual** | Desarrollo activo |
| **Última actualización** | 2026-06-13 |
| **Responsable principal** | Patroclo |

---

## Problema que resuelve

Los aficionados al fútbol y apostadores no tienen acceso a un modelo econométrico serio para predecir resultados de partidos internacionales. Hermes aplica el modelo Klement (Poisson bivariado + Monte Carlo) con factores estructurales reales y una IA analista de apuestas (Baley) para dar recomendaciones fundamentadas.

---

## Cliente objetivo

- **Segmento:** Apostadores deportivos y analistas de fútbol (uso personal/interno)
- **Dolor principal:** Las predicciones basadas en "intuición" o estadísticas superficiales no son suficientes para apostar con criterio
- **Alternativa actual:** Plataformas de apuestas (Betano, etc.) sin contexto analítico profundo

---

## Propuesta de valor

Un predictor de partidos de fútbol internacional con modelo econométrico (Klement), simulación Monte Carlo, y un analista IA (Baley) que evalúa apuestas con datos reales — incluyendo análisis de boletas por foto.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python 3.11 + FastAPI + Uvicorn |
| Modelo estadístico | NumPy + SciPy (Poisson bivariado + Monte Carlo) |
| Base de datos | Sin DB — archivos CSV en `/data/` (teams.csv, venues.csv) |
| IA (Baley) | Gemini 2.0 Flash (API) o LLM local (Ollama / LM Studio, OpenAI-compatible) |
| Hosting | Local (desarrollo). run.sh / run.bat para iniciar |
| Auth | Sin autenticación (herramienta interna) |

---

## Módulos principales

1. **Predictor de Partido** (`/predict_match`) — Predice resultado 1X2, xG, marcadores, estadísticas con modelo Klement
2. **Simulador de Torneo** (`/simulate_tournament`, `/simulate_wc2026`) — Bracket personalizado o simulación completa del Mundial 2026
3. **WC2026Picker** — Selector interactivo de partidos del Mundial con fechas, resultados en vivo y botón "Predecir"
4. **Baley** — Analista IA de apuestas integrado en el predictor; también analiza boletas por imagen
5. **Transparencia del Modelo** — Visualiza pesos estructurales y parámetros
6. **Recalibración** — Recalibra pesos con CSV de resultados históricos reales
7. **Vista Previa Externa** — Clima en sede (Open-Meteo) + links a Transfermarkt, FBRef, Wikipedia, SofaScore

---

## Estado de desarrollo

| Módulo | Estado | Notas |
|---|---|---|
| Predictor de Partido | Completado | Funcional con modelo Klement + Baley IA |
| Simulador WC2026 | Completado | Grupos A-L + bracket eliminatorias |
| WC2026Picker | Completado | Con resultados reales (se actualiza via script) |
| BetSlipAnalyzer | Completado | Nuevo — análisis de boletas por foto |
| ExternalPreview | Completado | Clima Open-Meteo + links externos |
| Transparencia del Modelo | Completado | Pesos estructurales en tiempo real |
| Recalibración | Completado | Upload CSV → pesos sugeridos → aplicar |
| Auto-update resultados | Completado | Script Python + tarea programada cada hora |

---

## Decisiones técnicas clave

- **Sin base de datos:** Los datos de equipos, sedes e historial se leen de CSV en `/data/`. Simple y suficiente para MVP.
- **Modelo combinado:** 50% analítico (Poisson) + 50% Monte Carlo (10k iteraciones). Ver `docs/03_ARCHITECTURE.md`.
- **LLM local primero:** Se prefiere LM Studio (`http://127.0.0.1:1234`, modelo `google/gemma-3-4b`) sobre Gemini para no depender de API keys. Baley usa API OpenAI-compatible.
- **wc2026.js como fuente de verdad de fixtures:** Los resultados del Mundial se actualizan manualmente o via `scripts/update_wc2026_results.py` (ESPN API).
- **Sin auth:** Herramienta de uso personal, sin necesidad de login.

---

## Cambios recientes

- [2026-06-13] Nueva pestaña "Jornada de Hoy": TodayMatches.jsx — muestra todos los partidos del día, predicciones secuenciales automáticas, mini-cards por partido, y Baley genera una combinada general con análisis conservador/equilibrado/arriesgado
- [2026-06-13] Bracket WC2026 rediseñado: bracket completo R32→R16→QF→SF→Final con equipos resueltos desde simulación, connector lines entre rondas, tooltip de sede/fecha en hover, campeón proyectado con glow
- [2026-06-13] WC2026Picker reintegrado en MatchPredictor con `handlePickerSelect`
- [2026-06-13] ExternalPreview reconstruido (stub anterior no funcionaba)
- [2026-06-13] Nuevo: BetSlipAnalyzer + endpoint `/analyze_bet_slip` (análisis de boletas por imagen)
- [2026-06-13] Layout pantalla dividida: columna izquierda (stats) y derecha (Baley) con scroll independiente, altura fija `calc(100vh-140px)`
- [2026-06-13] BaleySidebar ampliado a 440px con upload de boleta integrado y datos del modelo como contexto para la IA
- [2026-06-13] Chat libre con Baley: input en el sidebar para follow-up ("dame la combinada segura", etc.) + endpoint `POST /baley_chat` con historial de conversación
- [2026-06-13] Nuevo: `scripts/update_wc2026_results.py` + tarea programada cada hora
- [2026-06-13] Fix: `_build_baley_prompt()` — TypeError unhashable type dict
- [2026-06-13] Reconstrucción completa de todos los componentes frontend (eran stubs)

---

## Tarea actual / próximo paso

El proyecto está funcional. Posibles mejoras:

1. Añadir más sedes al CSV (venues.csv) con coordenadas para el clima
2. Mejorar el mapa de nombres ESPN→Hermes en el script de resultados
3. Añadir historial de predicciones (localStorage o archivo JSON)
4. Deploy en servidor local de red (para acceso desde móvil)
5. Persistir historial de chat de Baley entre sesiones

---

## Endpoints del backend (FastAPI en puerto 8000)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/predict_match` | Predicción completa de partido |
| POST | `/simulate_wc2026` | Simulación del Mundial 2026 |
| POST | `/simulate_tournament` | Bracket personalizado |
| GET | `/weights` | Pesos actuales del modelo |
| PUT | `/weights` | Actualizar pesos |
| POST | `/recalibrate` | Recalibrar con CSV histórico |
| POST | `/apply_weights` | Aplicar pesos sugeridos |
| GET | `/teams` | Lista de selecciones |
| GET | `/venues` | Lista de sedes |
| POST | `/external_preview` | Clima + links externos |
| POST | `/analyze_bet_slip` | Análisis de boleta por imagen (IA) |
| POST | `/baley_chat` | Chat libre con Baley (historial + contexto predicción) |

---

## Documentos relevantes por rol

| Si eres... | Lee primero... |
|---|---|
| Nuevo en el proyecto | Este archivo + `docs/03_ARCHITECTURE.md` |
| Va a programar | `docs/03_ARCHITECTURE.md` + código en `backend/api/main.py` |
| Va a cambiar el modelo | `backend/core/strength_model.py` + `backend/core/match_model.py` |
| Va a actualizar resultados | `scripts/update_wc2026_results.py` + `frontend/src/data/wc2026.js` |

---

*Actualizar este archivo después de cada cambio importante.*
