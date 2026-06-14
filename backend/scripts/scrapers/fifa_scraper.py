"""
fifa_scraper.py — Scraper de Ranking FIFA Oficial

FUENTE: https://www.fifa.com/fifa-world-ranking/men
MÉTODO: Endpoint JSON interno que el frontend de fifa.com consume.
        La API es no documentada pero estable desde 2021.
ESTADO: ✅ FACTIBLE — FIFA expone un JSON interno accesible con headers correctos

Endpoints probados (en orden de preferencia):
1. https://www.fifa.com/api/ranking-overview?locale=en&dateId=id{N}
   → dateId cambia con cada actualización. Se obtiene dinámicamente.
2. https://www.fifa.com/fifa-world-ranking/ranking-table/men/rank/id{N}/
   → Alternativa HTML parseada con BeautifulSoup.
3. Página principal con JSON embebido en <script> tag
   → Fallback más robusto.

Uso:
    from backend.scripts.scrapers.fifa_scraper import fetch_fifa_rankings
    rankings = fetch_fifa_rankings()
    # {'ARG': {'ranking': 1, 'points': 1843.71}, 'FRA': {...}, ...}
"""

import re
import json
import time
import logging
from typing import Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

FIFA_BASE = "https://www.fifa.com"
FIFA_RANKING_URL = f"{FIFA_BASE}/fifa-world-ranking/men"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/html, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.fifa.com/",
    "Origin": "https://www.fifa.com",
}

# Mapeo nombre FIFA → código ISO (FIFA usa nombres propios que difieren de ISO)
FIFA_NAME_TO_CODE = {
    "Argentina":            "ARG",
    "France":               "FRA",
    "England":              "ENG",
    "Belgium":              "BEL",
    "Brazil":               "BRA",
    "Portugal":             "POR",
    "Netherlands":          "NED",
    "Spain":                "ESP",
    "Croatia":              "CRO",
    "Italy":                "ITA",
    "Germany":              "GER",
    "Colombia":             "COL",
    "Uruguay":              "URU",
    "Morocco":              "MAR",
    "USA":                  "USA",
    "United States":        "USA",
    "Mexico":               "MEX",
    "Switzerland":          "SUI",
    "Senegal":              "SEN",
    "Denmark":              "DEN",
    "Japan":                "JPN",
    "Austria":              "AUT",
    "IR Iran":              "IRN",
    "Iran":                 "IRN",
    "Korea Republic":       "KOR",
    "Republic of Korea":    "KOR",
    "Ecuador":              "ECU",
    "Ukraine":              "UKR",
    "Australia":            "AUS",
    "Türkiye":              "TUR",
    "Turkey":               "TUR",
    "Hungary":              "HUN",
    "Slovakia":             "SVK",
    "Romania":              "ROU",
    "Wales":                "WAL",
    "Czechia":              "CZE",
    "Czech Republic":       "CZE",
    "Poland":               "POL",
    "Serbia":               "SRB",
    "Egypt":                "EGY",
    "Nigeria":              "NGA",
    "Algeria":              "ALG",
    "Chile":                "CHI",
    "Sweden":               "SWE",
    "Venezuela":            "VEN",
    "Côte d'Ivoire":        "CIV",
    "Ivory Coast":          "CIV",
    "Russia":               "RUS",
    "Peru":                 "PER",
    "Paraguay":             "PAR",
    "Greece":               "GRE",
    "Israel":               "ISR",
    "Bolivia":              "BOL",
    "Costa Rica":           "CRC",
    "Panama":               "PAN",
    "Ghana":                "GHA",
    "Saudi Arabia":         "KSA",
    "Qatar":                "QAT",
    "Canada":               "CAN",
}


def fetch_fifa_rankings(timeout: int = 20, retries: int = 3) -> dict:
    """
    Descarga el ranking FIFA actual y retorna dict por código ISO.

    Returns:
        {
          'ARG': {'ranking': 1, 'points': 1843.71, 'name': 'Argentina'},
          'FRA': {'ranking': 2, 'points': 1791.44, 'name': 'France'},
          ...
        }
    """
    for attempt in range(retries):
        try:
            logger.info(f"[FIFA] Intento {attempt + 1}/{retries}")

            # Paso 1: Obtener la página principal para extraer el dateId actual
            resp = requests.get(FIFA_RANKING_URL, headers=HEADERS, timeout=timeout)
            resp.raise_for_status()

            # Paso 2: Intentar extraer el JSON embebido en la página
            result = _extract_from_page_json(resp.text)
            if result:
                logger.info(f"[FIFA] ✅ {len(result)} equipos obtenidos via JSON embebido")
                return result

            # Paso 3: Intentar API JSON interna con dateId extraído del HTML
            date_id = _extract_date_id(resp.text)
            if date_id:
                api_result = _fetch_from_api(date_id, timeout)
                if api_result:
                    logger.info(f"[FIFA] ✅ {len(api_result)} equipos obtenidos via API interna")
                    return api_result

            # Paso 4: Parsear tabla HTML directamente
            html_result = _parse_html_table(resp.text)
            if html_result:
                logger.info(f"[FIFA] ✅ {len(html_result)} equipos obtenidos via HTML tabla")
                return html_result

        except requests.RequestException as e:
            logger.warning(f"[FIFA] Intento {attempt + 1} fallido: {e}")
            if attempt < retries - 1:
                time.sleep(3)

    logger.error("[FIFA] ❌ No se pudo obtener el ranking FIFA")
    return {}


def _extract_date_id(html: str) -> Optional[str]:
    """Extrae el dateId del JavaScript embebido en la página de FIFA."""
    patterns = [
        r'"dateId"\s*:\s*"?(id\d+)"?',
        r'dateId["\s:=]+["\']?(id\d+)["\']?',
        r'/ranking-table/men/rank/(id\d+)/',
        r'"rankingDate"\s*:\s*"([^"]+)"',
    ]
    for pattern in patterns:
        match = re.search(pattern, html)
        if match:
            return match.group(1)
    return None


def _fetch_from_api(date_id: str, timeout: int = 15) -> dict:
    """Llama a la API JSON interna de FIFA con el dateId obtenido."""
    api_urls = [
        f"{FIFA_BASE}/api/ranking-overview?locale=en&dateId={date_id}",
        f"{FIFA_BASE}/fifa-world-ranking/ranking-table/men/rank/{date_id}/?api=1",
        f"https://api.fifa.com/api/v3/rankings/FIFA?language=en&count=200",
    ]

    for url in api_urls:
        try:
            resp = requests.get(url, headers={**HEADERS, "Accept": "application/json"}, timeout=timeout)
            if resp.status_code == 200:
                data = resp.json()
                result = _parse_api_json(data)
                if result:
                    return result
        except Exception:
            continue

    return {}


def _parse_api_json(data: dict) -> dict:
    """Parsea la respuesta JSON de la API FIFA."""
    result = {}

    # Formato 1: {"rankings": [{"teamName": "Argentina", "totalPoints": 1843, "rank": 1}]}
    rankings = (
        data.get("rankings") or
        data.get("items") or
        data.get("data") or
        (data.get("Results") if isinstance(data, dict) else None) or
        []
    )

    if isinstance(rankings, list):
        for item in rankings:
            if not isinstance(item, dict):
                continue
            name = (
                item.get("teamName") or
                item.get("name") or
                item.get("team", {}).get("name", "") if isinstance(item.get("team"), dict) else ""
            )
            rank = item.get("rank") or item.get("rankingPosition") or 0
            points = item.get("totalPoints") or item.get("points") or 0

            if name:
                code = FIFA_NAME_TO_CODE.get(name)
                if code:
                    result[code] = {
                        "ranking": int(rank),
                        "points": float(points),
                        "name": name,
                    }

    return result


def _extract_from_page_json(html: str) -> dict:
    """Extrae datos de ranking del JSON embebido en los <script> tags de la página."""
    soup = BeautifulSoup(html, "html.parser")

    for script in soup.find_all("script"):
        text = script.string or ""

        # Buscar bloques JSON que contengan datos de ranking
        if "totalPoints" in text or "rankingPosition" in text or '"rank"' in text:
            # Intentar extraer el JSON completo
            json_matches = re.findall(r'\{[^{}]*"totalPoints"[^{}]*\}', text)
            if not json_matches:
                # Intentar con el bloque más grande que contenga rankings
                json_blocks = re.findall(r'\[(\{[^[\]]*"rank"[^[\]]*\}(?:,\{[^[\]]*\})*)\]', text)
                if json_blocks:
                    try:
                        items = json.loads(f"[{json_blocks[0]}]")
                        return _parse_api_json({"rankings": items})
                    except json.JSONDecodeError:
                        pass

            # También buscar __NEXT_DATA__ o similar (Next.js)
            next_data = re.search(r'__NEXT_DATA__\s*=\s*(\{.+?\})\s*;?\s*</script>', text, re.DOTALL)
            if next_data:
                try:
                    page_data = json.loads(next_data.group(1))
                    # Navegar la estructura de Next.js para encontrar rankings
                    rankings_data = _deep_find_rankings(page_data)
                    if rankings_data:
                        return _parse_api_json({"rankings": rankings_data})
                except json.JSONDecodeError:
                    pass

    return {}


def _deep_find_rankings(obj, depth: int = 0) -> Optional[list]:
    """Busca recursivamente una lista de rankings en un objeto JSON anidado."""
    if depth > 8:
        return None
    if isinstance(obj, list) and len(obj) > 5:
        if obj and isinstance(obj[0], dict):
            if any(k in obj[0] for k in ["rank", "totalPoints", "teamName", "rankingPosition"]):
                return obj
    if isinstance(obj, dict):
        for v in obj.values():
            result = _deep_find_rankings(v, depth + 1)
            if result:
                return result
    return None


def _parse_html_table(html: str) -> dict:
    """Fallback: parsear tabla HTML de rankings directamente."""
    soup = BeautifulSoup(html, "html.parser")
    result = {}

    # Buscar cualquier tabla que tenga filas con países y números
    tables = soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")[1:]  # Skip header
        if len(rows) < 10:
            continue
        for row in rows:
            cols = row.find_all(["td", "th"])
            if len(cols) >= 3:
                try:
                    rank_text = cols[0].get_text(strip=True)
                    name_text = cols[1].get_text(strip=True)
                    points_text = cols[2].get_text(strip=True).replace(",", "")

                    rank = int(rank_text)
                    points = float(points_text)
                    code = FIFA_NAME_TO_CODE.get(name_text)
                    if code:
                        result[code] = {
                            "ranking": rank,
                            "points": points,
                            "name": name_text,
                        }
                except (ValueError, IndexError):
                    continue
        if result:
            break

    return result


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Descargando Ranking FIFA...")
    rankings = fetch_fifa_rankings()
    if rankings:
        print(f"\n✅ {len(rankings)} equipos:")
        sorted_r = sorted(rankings.items(), key=lambda x: x[1].get("ranking", 999))
        for code, data in sorted_r[:15]:
            print(f"  #{data['ranking']:>3}  {code}  ({data['points']:.0f} pts)")
    else:
        print("❌ No se obtuvieron datos. Verifica conectividad.")
