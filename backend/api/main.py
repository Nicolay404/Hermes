"""
main.py — API FastAPI para el modelo econométrico de predicción de fútbol.

Endpoints:
  POST /predict_match       → Predicción completa de un partido
  POST /simulate_tournament → Simulación de bracket completo
  GET  /weights             → Leer pesos actuales del modelo
  PUT  /weights             → Actualizar pesos del modelo
  POST /recalibrate         → Recalibrar pesos con resultados históricos
  GET  /teams               → Lista de selecciones disponibles
  GET  /venues              → Lista de sedes disponibles
  POST /gemini_interpret    → Interpretación enriquecida con Gemini AI
  GET  /external_preview    → Vista previa de datos externos (clima, plantilla, noticias)
  POST /analyze_bet_slip   → Análisis de boleta de apuesta vía IA (imagen + Gemini / LLM local)
"""

import base64
import json
import os
import sys
import httpx
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, Form, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Añadir el directorio backend al path para imports relativos
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from core.strength_model import load_weights, load_teams, get_team_strength, get_all_strengths
from core.match_model import predict_match, load_venues
from core.stats_model import compute_match_stats
from core.tournament_sim import simulate_tournament
from core.wc2026_sim import simulate_wc2026
from core.calibration import (
    load_current_weights, save_weights, parse_historical_csv,
    calibrate, apply_suggested_weights
)

ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIR = ROOT / "config"

# =====================================================================
# FastAPI App
# =====================================================================
app = FastAPI(
    title="⚽ Football Match Predictor",
    description=(
        "Modelo econométrico inspirado en Klement (Liberum/Panmure) para predicción "
        "de partidos internacionales de fútbol. Stack: NumPy + SciPy + Monte Carlo + Gemini AI."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS para desarrollo local (Vite en 5173, FastAPI en 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# Pydantic Models (request/response schemas)
# =====================================================================

class MatchRequest(BaseModel):
    team_a: str = Field(..., example="Argentina", description="Nombre o código ISO del equipo A")
    team_b: str = Field(..., example="France", description="Nombre o código ISO del equipo B")
    venue_name: str = Field("Sede Neutral", example="Lusail Stadium", description="Nombre de la sede")
    match_type: str = Field("amistoso", example="mundial",
                            description="mundial | clasificatoria | amistoso | torneo_continental | nations_league")
    team_a_is_home: bool = Field(False, description="True si el equipo A es local")
    use_gemini: bool = Field(False, description="Usar Gemini para interpretación narrativa")
    gemini_api_key: Optional[str] = Field(None, description="API Key de Gemini (capa gratuita)")
    # LLM local (Ollama u otro servidor OpenAI-compatible)
    use_local_llm: bool = Field(False, description="Usar LLM local (Ollama, LM Studio, etc.)")
    local_llm_url: str = Field("http://localhost:11434", description="URL base del servidor local (sin /v1)")
    local_llm_model: str = Field("llama3.2", description="Nombre del modelo local a usar")


class TournamentRequest(BaseModel):
    bracket: List[str] = Field(...,
        example=["Argentina", "Mexico", "France", "Poland", "Brazil", "South Korea", "England", "Senegal"],
        description="Lista de equipos en el bracket (debe ser potencia de 2)"
    )
    venue_name: str = Field("Sede Neutral", description="Sede del torneo")
    match_type: str = Field("mundial", description="Tipo de partido")
    n_simulations: int = Field(10000, ge=1000, le=100000, description="Iteraciones Monte Carlo")


class ActualResult(BaseModel):
    team_a: str
    team_b: str
    goals_a: int
    goals_b: int

class WC2026SimRequest(BaseModel):
    n_simulations: int = Field(5000, ge=500, le=25000, description="Simulaciones Monte Carlo")
    venue_name: str = Field("Sede Neutral", description="Sede para fases eliminatorias")
    match_type: str = Field("mundial", description="Tipo de partido")
    actual_results: Optional[List[ActualResult]] = Field(
        None,
        description="Resultados reales ya jugados. Se fijan en cada iteración; el resto se simula."
    )


class WeightsUpdateRequest(BaseModel):
    structural_weights: dict = Field(..., description="Nuevos pesos estructurales")
    other_params: Optional[dict] = Field(None, description="Otros parámetros del modelo")


class ApplyWeightsRequest(BaseModel):
    full_weights: dict = Field(..., description="Dict completo de pesos a aplicar")


class GeminiInterpretRequest(BaseModel):
    prediction_data: dict = Field(..., description="Datos de predicción del partido")
    gemini_api_key: str = Field(..., description="API Key de Gemini")
    language: str = Field("es", description="Idioma de la respuesta: 'es' o 'en'")


class ExternalPreviewRequest(BaseModel):
    team_a_code: str = Field(..., example="ARG")
    team_b_code: str = Field(..., example="FRA")
    venue_name: Optional[str] = Field("Sede Neutral")


# =====================================================================
# Endpoints
# =====================================================================

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "app": "Football Match Predictor",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


# --- Teams ---

@app.get("/teams", tags=["Data"])
def get_teams():
    """Lista todas las selecciones disponibles con sus datos e índice de fuerza."""
    try:
        df = load_teams()
        weights = load_weights()
        teams = []
        for _, row in df.iterrows():
            from core.strength_model import compute_structural_strength
            strength = compute_structural_strength(row, weights)
            teams.append({
                "name": row["name"],
                "code": row["code"],
                "fifa_ranking": int(row["fifa_ranking"]),
                "elo_points": float(row["elo_points"]),
                "gdp_per_capita": float(row["gdp_per_capita"]),
                "population_millions": float(row["population_millions"]),
                "avg_temp_celsius": float(row["avg_temp_celsius"]),
                "football_culture_index": float(row["football_culture_index"]),
                "squad_strength_index": float(row["squad_strength_index"]),
                "confederation": row["confederation"],
                "structural_strength": round(strength, 4),
            })
        # Ordenar por ranking FIFA
        teams.sort(key=lambda x: x["fifa_ranking"])
        return {"teams": teams, "count": len(teams)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Venues ---

@app.get("/venues", tags=["Data"])
def get_venues():
    """Lista todas las sedes disponibles."""
    try:
        df = load_venues()
        venues = df.to_dict(orient="records")
        return {"venues": venues, "count": len(venues)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Predict Match ---

@app.post("/predict_match", tags=["Prediction"])
def api_predict_match(req: MatchRequest):
    """
    Predice el resultado de un partido individual.

    Retorna:
    - Probabilidades 1X2 (analítico + Monte Carlo combinados)
    - goles esperados (xG) por equipo
    - Marcador más probable y top 5 marcadores
    - Estadísticas completas: tiros, corners, tarjetas, faltas, posesión
    - Fuerza ajustada por equipo con desglose de componentes
    - Interpretación narrativa vía Gemini (opcional)
    """
    try:
        weights = load_weights()

        # Predicción principal
        match_result = predict_match(
            team_a=req.team_a,
            team_b=req.team_b,
            venue_name=req.venue_name,
            match_type=req.match_type,
            team_a_is_home=req.team_a_is_home,
            weights=weights
        )

        # Estadísticas secundarias
        stats = compute_match_stats(
            xg_a=match_result["expected_goals"]["team_a"],
            xg_b=match_result["expected_goals"]["team_b"],
            adj_strength_a=match_result["strengths"]["team_a_adjusted"],
            adj_strength_b=match_result["strengths"]["team_b_adjusted"],
            match_type=req.match_type
        )

        # Detalle de fuerza de cada equipo
        team_a_detail = get_team_strength(req.team_a, weights)
        team_b_detail = get_team_strength(req.team_b, weights)

        response = {
            **match_result,
            "stats": stats,
            "team_details": {
                "team_a": team_a_detail,
                "team_b": team_b_detail,
            }
        }

        # Interpretación con LLM (Gemini o modelo local, opcionales)
        if req.use_local_llm:
            llm_text = _call_local_llm(
                prediction=response,
                base_url=req.local_llm_url,
                model=req.local_llm_model,
            )
            response["gemini_interpretation"] = llm_text
        elif req.use_gemini and req.gemini_api_key:
            gemini_text = _call_gemini(
                prediction=response,
                api_key=req.gemini_api_key,
                language="es"
            )
            response["gemini_interpretation"] = gemini_text

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# --- Simulate Tournament ---

@app.post("/simulate_tournament", tags=["Prediction"])
def api_simulate_tournament(req: TournamentRequest):
    """
    Simula un torneo de eliminación directa.

    Los equipos deben pasarse en orden de bracket:
    [slot_1, slot_2, slot_3, slot_4, ...] donde slot_1 juega vs slot_2, etc.
    """
    try:
        weights = load_weights()
        result = simulate_tournament(
            bracket=req.bracket,
            venue_name=req.venue_name,
            match_type=req.match_type,
            weights=weights,
            n_simulations=req.n_simulations
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de simulación: {str(e)}")


# --- Simulate WC2026 ---

@app.post("/simulate_wc2026", tags=["Prediction"])
def api_simulate_wc2026(req: WC2026SimRequest):
    """
    Simula el Mundial 2026 completo (grupos + eliminatorias).
    Retorna probabilidades de campeón, clasificación por grupo y avance por ronda.
    """
    try:
        weights = load_weights()
        actual = [r.dict() for r in req.actual_results] if req.actual_results else []
        result = simulate_wc2026(
            weights=weights,
            n_simulations=req.n_simulations,
            venue_name=req.venue_name,
            match_type=req.match_type,
            actual_results=actual,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error simulación WC2026: {str(e)}")


# --- Weights ---

@app.get("/weights", tags=["Model"])
def get_weights():
    """Retorna los pesos actuales del modelo."""
    try:
        weights = load_current_weights()
        # Filtrar comentarios internos para la respuesta
        clean = {k: v for k, v in weights.items() if not k.startswith("_")}
        return clean
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/weights", tags=["Model"])
def update_weights(req: WeightsUpdateRequest):
    """
    Actualiza los pesos estructurales del modelo.
    Los pesos estructurales deben sumar ~1.0.
    """
    try:
        current = load_current_weights()

        # Validar que los pesos sumen ~1.0
        sw = req.structural_weights
        total = sum(sw.values())
        if abs(total - 1.0) > 0.01:
            # Auto-normalizar
            sw = {k: round(v / total, 4) for k, v in sw.items()}

        current["structural_weights"] = sw

        if req.other_params:
            for key, value in req.other_params.items():
                if not key.startswith("_"):  # No sobreescribir comentarios
                    current[key] = value

        save_weights(current)
        return {
            "status": "ok",
            "message": "Pesos actualizados correctamente.",
            "structural_weights": sw
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Recalibration ---

@app.post("/recalibrate", tags=["Model"])
async def api_recalibrate(
    file: UploadFile = File(...),
    max_iter: int = Query(50, ge=10, le=500)
):
    """
    Recalibra los pesos usando un CSV de resultados históricos reales.

    Formato CSV: team_a, team_b, date, goals_a, goals_b, match_type, venue_name
    Mínimo 5 partidos. Los pesos NO se aplican automáticamente.
    """
    try:
        content = await file.read()
        csv_content = content.decode("utf-8")

        result = calibrate(csv_content, max_iter=max_iter)
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de recalibración: {str(e)}")


@app.post("/apply_weights", tags=["Model"])
def api_apply_weights(req: ApplyWeightsRequest):
    """
    Aplica pesos sugeridos por la recalibración (requiere confirmación del usuario).
    """
    try:
        apply_suggested_weights(req.full_weights)
        return {"status": "ok", "message": "Pesos aplicados exitosamente."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Gemini Interpretation ---

@app.post("/gemini_interpret", tags=["AI"])
def api_gemini_interpret(req: GeminiInterpretRequest):
    """
    Genera una interpretación narrativa del partido usando Gemini AI (capa gratuita).
    """
    try:
        text = _call_gemini(
            prediction=req.prediction_data,
            api_key=req.gemini_api_key,
            language=req.language
        )
        return {"interpretation": text, "model": "gemini-2.0-flash"}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error Gemini: {str(e)}")


# --- External Preview ---

@app.post("/external_preview", tags=["External"])
def api_external_preview(req: ExternalPreviewRequest):
    """
    Retorna URLs y datos para previsualización externa:
    - URL de plantilla en Transfermarkt
    - URL de clima actual en la sede
    - URL de noticias recientes del equipo
    - Datos de temperatura actual (via Open-Meteo, sin API key)
    """
    try:
        result = _build_external_preview(
            team_a_code=req.team_a_code,
            team_b_code=req.team_b_code,
            venue_name=req.venue_name or "Sede Neutral"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Team Detail ---

@app.get("/team/{team_name_or_code}", tags=["Data"])
def api_team_detail(team_name_or_code: str):
    """Retorna detalles y fuerza estructural de un equipo específico."""
    try:
        weights = load_weights()
        detail = get_team_strength(team_name_or_code, weights)
        return detail
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================================
# Funciones auxiliares internas
# =====================================================================

def _build_baley_prompt(prediction: dict) -> str:
    """Construye el prompt de apuestas para Baley (compartido por Gemini y LLM local)."""
    team_a     = prediction.get("match", {}).get("team_a", "Equipo A")
    team_b     = prediction.get("match", {}).get("team_b", "Equipo B")
    probs      = prediction.get("probabilities", {})
    xg         = prediction.get("expected_goals", {})
    score      = prediction.get("most_likely_score", {})
    top_scores = prediction.get("top_scores", [])[:4]
    stats      = prediction.get("stats", {})

    pA  = probs.get('home_win', 0) * 100
    pX  = probs.get('draw', 0) * 100
    pB  = probs.get('away_win', 0) * 100
    xgA = xg.get('team_a', 0)
    xgB = xg.get('team_b', 0)
    xgTotal = round(xgA + xgB, 2)
    sA  = score.get('score_a', 0)
    sB  = score.get('score_b', 0)

    # Extraer stats en variables antes del f-string para evitar dicts anidados en expresiones
    stats_a   = stats.get('team_a') or {}
    stats_b   = stats.get('team_b') or {}
    poss_a    = (stats_a.get('possession') or {}).get('range_display', 'N/A')
    shots_a   = (stats_a.get('shots_total') or {}).get('range_display', 'N/A')
    shots_b   = (stats_b.get('shots_total') or {}).get('range_display', 'N/A')
    favorito  = team_a if pA >= pB else team_b
    underdog  = team_b if pA >= pB else team_a

    scores_txt = " | ".join(
        f"{s.get('score_a')}-{s.get('score_b')} ({s.get('probability', 0)*100:.1f}%)"
        for s in top_scores
    ) if top_scores else "N/A"

    # Plantilla JSON como string normal (no f-string) para evitar conflictos con llaves
    json_template = (
        '{\n'
        f'  "favorito": "{favorito}",\n'
        '  "resumen": "<una frase de diagnóstico, 20 palabras max>",\n'
        '  "segura": {\n'
        f'    "apuesta": "<ej: Doble oportunidad {favorito} o empate>",\n'
        '    "mercado": "<1X2 / Doble oportunidad / Menos X.X goles / Ambos anotan NO / etc>",\n'
        '    "confianza": "<alta / media>",\n'
        '    "razon": "<por que es segura, 1 frase>"\n'
        '  },\n'
        '  "combinada": {\n'
        '    "apuestas": ["<mercado 1>", "<mercado 2>"],\n'
        '    "razon": "<por que combinar estos, 1 frase>",\n'
        '    "riesgo": "<bajo / medio>"\n'
        '  },\n'
        '  "arriesgada": {\n'
        f'    "apuesta": "<ej: {sA}-{sB} marcador exacto o mercado de alto valor>",\n'
        '    "mercado": "<Marcador exacto / Ambos anotan SI + mas de X.X / etc>",\n'
        '    "razon": "<valor potencial, 1 frase>",\n'
        '    "riesgo": "<alto / muy alto>"\n'
        '  },\n'
        '  "goles": {\n'
        f'    "xg_total": {xgTotal},\n'
        '    "over_1_5": "<SI / NO / DUDA>",\n'
        '    "over_2_5": "<SI / NO / DUDA>",\n'
        '    "over_3_5": "<SI / NO / DUDA>",\n'
        '    "btts": "<SI / NO / DUDA>",\n'
        f'    "marcador_clave": "{sA}-{sB}"\n'
        '  }\n'
        '}'
    )

    return (
        f"Eres Baley, analista experto en apuestas deportivas. "
        f"Analiza estos datos del modelo econométrico y responde ÚNICAMENTE con un JSON válido "
        f"(sin markdown, sin texto extra antes o después).\n\n"
        f"PARTIDO: {team_a} vs {team_b}\n"
        f"PROBABILIDADES: {team_a} gana {pA:.1f}% | Empate {pX:.1f}% | {team_b} gana {pB:.1f}%\n"
        f"xG: {team_a} {xgA} | {team_b} {xgB} | Total esperado: {xgTotal}\n"
        f"MARCADORES MÁS PROBABLES: {scores_txt}\n"
        f"POSESIÓN {team_a}: {poss_a}\n"
        f"TIROS {team_a}: {shots_a} | {team_b}: {shots_b}\n\n"
        f"Devuelve SOLO este JSON completado con los valores reales:\n"
        + json_template
    )


def _call_gemini(prediction: dict, api_key: str, language: str = "es") -> str:
    """
    Llama a Gemini 2.0 Flash para análisis de apuestas estructurado (Baley).
    Retorna string JSON que el frontend parsea en BaleySidebar.
    """
    prompt = _build_baley_prompt(prediction)
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 600,
            "responseMimeType": "application/json",
        }
    }

    with httpx.Client(timeout=30.0) as client:
        response = client.post(url, json=payload)

    if response.status_code != 200:
        raise Exception(f"Gemini API error {response.status_code}: {response.text[:200]}")

    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return "{}"


def _call_local_llm(prediction: dict, base_url: str = "http://localhost:11434", model: str = "llama3.2") -> str:
    """
    Llama a un LLM local (Ollama, LM Studio…) vía API OpenAI-compatible.
    Retorna string JSON que el frontend parsea en BaleySidebar.
    """
    prompt = _build_baley_prompt(prediction)
    url = base_url.rstrip("/") + "/v1/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Responde siempre con JSON válido, sin markdown ni texto extra."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 600,
        "stream": False,
    }

    try:
        with httpx.Client(timeout=90.0) as client:
            response = client.post(url, json=payload)
        if response.status_code != 200:
            raise Exception(f"LLM local error {response.status_code}: {response.text[:200]}")
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except httpx.ConnectError:
        raise Exception(
            f"No se pudo conectar al LLM local en {url}. "
            "Verifica que Ollama esté corriendo: 'ollama serve'"
        )


def _build_external_preview(
    team_a_code: str,
    team_b_code: str,
    venue_name: str
) -> dict:
    """
    Construye URLs y datos para previsualización externa sin APIs de pago.

    Usa:
    - Transfermarkt (URLs directas sin scraping)
    - Google News (búsqueda directa)
    - Open-Meteo (clima gratuito, sin API key)
    """
    df = load_venues()
    venue_row = None
    vm = df["name"].str.lower() == venue_name.lower()
    if vm.any():
        venue_row = df[vm].iloc[0]

    # Mapeo de código ISO → slug de Transfermarkt (muestra los más comunes)
    tm_slugs = {
        "ARG": "argentina", "BRA": "brasilien", "FRA": "frankreich",
        "ENG": "england", "ESP": "spanien", "GER": "deutschland",
        "ITA": "italien", "POR": "portugal", "NED": "niederlande",
        "URU": "uruguay", "COL": "kolumbien", "MEX": "mexiko",
        "USA": "usa", "CRO": "kroatien", "BEL": "belgien",
        "DEN": "daenemark", "SUI": "schweiz", "JPN": "japan",
        "KOR": "suedkorea", "MOR": "marokko", "MAR": "marokko",
        "SEN": "senegal", "AUS": "australien", "TUR": "tuerkei",
        "POL": "polen", "SRB": "serbien", "UKR": "ukraine",
        "ECU": "ecuador", "CHI": "chile", "CAN": "kanada",
        "QAT": "katar", "KSA": "saudi-arabien",
    }

    slug_a = tm_slugs.get(team_a_code.upper(), team_a_code.lower())
    slug_b = tm_slugs.get(team_b_code.upper(), team_b_code.lower())

    # URLs de Transfermarkt (visualización de plantilla)
    tm_base = "https://www.transfermarkt.com"
    tm_url_a = f"{tm_base}/{slug_a}/startseite/verein/3262"
    tm_url_b = f"{tm_base}/{slug_b}/startseite/verein/3262"

    # Transfermarkt team pages (país)
    tm_team_a = f"https://www.transfermarkt.com/wettbewerbe/nationalmannschaft/wettbewerb/{team_a_code.upper()}"
    tm_team_b = f"https://www.transfermarkt.com/wettbewerbe/nationalmannschaft/wettbewerb/{team_b_code.upper()}"

    # Wikipedia (páginas de las selecciones)
    wiki_a = f"https://en.wikipedia.org/wiki/{team_a_code}_national_football_team"
    wiki_b = f"https://en.wikipedia.org/wiki/{team_b_code}_national_football_team"

    # Google News URLs
    news_a = f"https://news.google.com/search?q={team_a_code}+football+squad&hl=es"
    news_b = f"https://news.google.com/search?q={team_b_code}+football+squad&hl=es"

    # SofaScore (estadísticas en tiempo real)
    sofascore_base = "https://www.sofascore.com"

    # Fbref (estadísticas avanzadas)
    fbref_a = f"https://fbref.com/en/squads/search.fcgi?search={team_a_code}"
    fbref_b = f"https://fbref.com/en/squads/search.fcgi?search={team_b_code}"

    # Clima en sede (Open-Meteo API gratuita)
    weather_data = None
    if venue_row is not None:
        try:
            lat = float(venue_row["latitude"])
            lon = float(venue_row["longitude"])
            if lat != 0 or lon != 0:
                weather_url = (
                    f"https://api.open-meteo.com/v1/forecast"
                    f"?latitude={lat}&longitude={lon}"
                    f"&current=temperature_2m,wind_speed_10m,precipitation,weather_code"
                    f"&timezone=auto"
                )
                with httpx.Client(timeout=10.0) as client:
                    resp = client.get(weather_url)
                if resp.status_code == 200:
                    wdata = resp.json()
                    current = wdata.get("current", {})
                    weather_data = {
                        "temperature_celsius": current.get("temperature_2m"),
                        "wind_speed_kmh": current.get("wind_speed_10m"),
                        "precipitation_mm": current.get("precipitation"),
                        "weather_code": current.get("weather_code"),
                        "source": "Open-Meteo (datos en tiempo real)",
                    }
        except Exception:
            weather_data = None

    return {
        "team_a": {
            "code": team_a_code,
            "links": {
                "transfermarkt": tm_team_a,
                "wikipedia": wiki_a,
                "news": news_a,
                "fbref": fbref_a,
                "sofascore": f"{sofascore_base}/team/{slug_a}",
            }
        },
        "team_b": {
            "code": team_b_code,
            "links": {
                "transfermarkt": tm_team_b,
                "wikipedia": wiki_b,
                "news": news_b,
                "fbref": fbref_b,
                "sofascore": f"{sofascore_base}/team/{slug_b}",
            }
        },
        "venue": {
            "name": venue_name,
            "weather_live": weather_data,
            "links": {
                "weather_forecast": (
                    f"https://openweathermap.org/find?q={venue_name.replace(' ', '+')}"
                ),
            }
        },
        "note": (
            "Las URLs de Transfermarkt y FBRef son para verificación manual de plantillas. "
            "El clima en tiempo real proviene de Open-Meteo (gratuito, sin API key)."
        )
    }


# =====================================================================
# Analyze Bet Slip (imagen → Baley)
# =====================================================================

def _bet_slip_prompt(team_a: str = "", team_b: str = "", prediction_ctx: str = "") -> str:
    ctx_block = f"\nDATOS DEL MODELO PARA {team_a} vs {team_b}:\n{prediction_ctx}\n" if prediction_ctx else ""
    return (
        "Eres Baley, analista experto en apuestas deportivas.\n"
        "El usuario te envía una captura de pantalla de su boleta de apuesta.\n"
        "Analiza CADA selección visible en la imagen y evalúa la apuesta globalmente.\n"
        f"{ctx_block}\n"
        "Responde ÚNICAMENTE con un JSON válido, sin markdown ni texto extra:\n"
        "{\n"
        '  "partido": "<Equipo A vs Equipo B>",\n'
        '  "tipo": "<Simple / Acumulada / Bet Builder>",\n'
        '  "cuota_total": <número o null>,\n'
        '  "stake": "<monto o null>",\n'
        '  "ganancia_potencial": "<monto o null>",\n'
        '  "evaluacion_global": "<buena | arriesgada | muy_arriesgada | mala>",\n'
        '  "selecciones": [\n'
        '    {\n'
        '      "mercado": "<nombre del mercado>",\n'
        '      "linea": "<valor, ej: Mas 2.5>",\n'
        '      "equipo": "<equipo al que aplica o null>",\n'
        '      "opinion": "<favorable | neutral | desfavorable>",\n'
        '      "razon": "<razon en 1 frase>"\n'
        '    }\n'
        '  ],\n'
        '  "resumen": "<diagnostico general de la apuesta en 2 frases>",\n'
        '  "recomendacion": "<que harias tu con esta apuesta, 1-2 frases>"\n'
        "}"
    )


@app.post("/analyze_bet_slip", tags=["AI"])
async def api_analyze_bet_slip(
    file: UploadFile = File(...),
    team_a: str = Form(""),
    team_b: str = Form(""),
    prediction_context: str = Form(""),
    use_gemini: bool = Form(False),
    gemini_api_key: str = Form(""),
    use_local_llm: bool = Form(False),
    local_llm_url: str = Form("http://127.0.0.1:1234"),
    local_llm_model: str = Form("google/gemma-3-4b"),
):
    """
    Recibe una imagen de boleta de apuesta y la analiza con IA (Gemini o LLM local con visión).
    Retorna análisis estructurado de Baley en formato JSON.
    """
    image_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"
    b64 = base64.b64encode(image_bytes).decode()
    prompt = _bet_slip_prompt(team_a, team_b, prediction_context)

    try:
        if use_gemini and gemini_api_key:
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-2.0-flash:generateContent?key={gemini_api_key}"
            )
            payload = {
                "contents": [{
                    "parts": [
                        {"inline_data": {"mime_type": mime_type, "data": b64}},
                        {"text": prompt},
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 900,
                    "responseMimeType": "application/json",
                },
            }
            with httpx.Client(timeout=40.0) as client:
                resp = client.post(url, json=payload)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Gemini error: {resp.text[:300]}")
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]

        elif use_local_llm:
            endpoint = local_llm_url.rstrip("/") + "/v1/chat/completions"
            payload = {
                "model": local_llm_model,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                        {"type": "text", "text": prompt},
                    ],
                }],
                "temperature": 0.3,
                "max_tokens": 900,
                "stream": False,
            }
            with httpx.Client(timeout=120.0) as client:
                resp = client.post(endpoint, json=payload)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"LLM local error: {resp.text[:300]}")
            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()

        else:
            raise HTTPException(status_code=400, detail="Debes activar Gemini o LLM local para analizar la boleta.")

        return {"analysis": text, "raw": text}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================================
# Baley Chat — conversación libre con contexto de predicción
# =====================================================================

class BaleyChatMessage(BaseModel):
    role: str           # "user" | "assistant"
    content: str

class BaleyChatRequest(BaseModel):
    message: str
    prediction_context: Optional[str] = None   # JSON stringificado de los datos del modelo
    history: Optional[List[BaleyChatMessage]] = None
    use_gemini: bool = False
    gemini_api_key: Optional[str] = None
    use_local_llm: bool = False
    local_llm_url: str = "http://127.0.0.1:1234"
    local_llm_model: str = "google/gemma-3-4b"


def _baley_system_prompt(prediction_context: Optional[str]) -> str:
    ctx = f"\n\nDATOS DEL MODELO ECONOMÉTRICO (usa estos datos para responder):\n{prediction_context}" if prediction_context else ""
    return (
        "Eres Baley, analista experto en apuestas deportivas. "
        "Responde siempre en español, de forma concisa y directa. "
        "Cuando el usuario pida apuestas concretas o combinadas, responde con texto natural claro "
        "(no necesariamente JSON, a menos que el usuario lo pida específicamente). "
        "Máximo 120 palabras por respuesta."
        + ctx
    )


@app.post("/baley_chat", tags=["AI"])
async def api_baley_chat(req: BaleyChatRequest):
    """
    Chat libre con Baley. Acepta historial de conversación y contexto de predicción.
    Retorna la respuesta de Baley como texto plano.
    """
    system = _baley_system_prompt(req.prediction_context)
    history = req.history or []

    # Construir mensajes para el LLM
    messages = [{"role": "system", "content": system}]
    for msg in history[-10:]:   # máximo 10 turnos de historial
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    try:
        if req.use_gemini and req.gemini_api_key:
            # Gemini: convertir historial a formato "contents"
            contents = []
            for m in messages[1:]:   # skip system
                role = "user" if m["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m["content"]}]})

            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-2.0-flash:generateContent?key={req.gemini_api_key}"
            )
            payload = {
                "system_instruction": {"parts": [{"text": system}]},
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.5,
                    "maxOutputTokens": 400,
                },
            }
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, json=payload)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Gemini error: {resp.text[:300]}")
            data = resp.json()
            reply = data["candidates"][0]["content"]["parts"][0]["text"].strip()

        elif req.use_local_llm:
            endpoint = req.local_llm_url.rstrip("/") + "/v1/chat/completions"
            payload = {
                "model": req.local_llm_model,
                "messages": messages,
                "temperature": 0.5,
                "max_tokens": 400,
                "stream": False,
            }
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(endpoint, json=payload)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"LLM local error: {resp.text[:300]}")
            data = resp.json()
            reply = data["choices"][0]["message"]["content"].strip()

        else:
            raise HTTPException(status_code=400, detail="Activa Gemini o LLM local para usar el chat.")

        return {"reply": reply}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================================
# Run para desarrollo directo
# =====================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
