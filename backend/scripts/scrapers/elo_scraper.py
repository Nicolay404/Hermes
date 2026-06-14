"""
elo_scraper.py — Scraper de Elo ratings nacionales desde eloratings.net

FUENTE: https://www.eloratings.net/
MÉTODO: requests + BeautifulSoup (HTML estático, sin JavaScript)
ESTADO: ✅ FACTIBLE — página HTML simple, sin anti-bot agresivo

Mapea los nombres de eloratings.net a los códigos ISO del teams.csv
y retorna un dict {code: elo_points}.

Uso:
    from backend.scripts.scrapers.elo_scraper import fetch_elo_ratings
    ratings = fetch_elo_ratings()
    # {'ARG': 2143, 'FRA': 2085, ...}
"""

import time
import logging
from typing import Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# URL principal de eloratings.net
ELO_URL = "https://www.eloratings.net/"

# Headers que simulan un navegador real
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# Mapeo nombre eloratings.net → código ISO 3166 alpha-3
# Necesario porque los nombres en eloratings difieren de los de FIFA
ELO_NAME_TO_CODE = {
    "Argentina":        "ARG",
    "France":           "FRA",
    "England":          "ENG",
    "Belgium":          "BEL",
    "Brazil":           "BRA",
    "Portugal":         "POR",
    "Netherlands":      "NED",
    "Spain":            "ESP",
    "Croatia":          "CRO",
    "Italy":            "ITA",
    "Germany":          "GER",
    "Colombia":         "COL",
    "Uruguay":          "URU",
    "Morocco":          "MAR",
    "United States":    "USA",
    "Mexico":           "MEX",
    "Switzerland":      "SUI",
    "Senegal":          "SEN",
    "Denmark":          "DEN",
    "Japan":            "JPN",
    "Austria":          "AUT",
    "Iran":             "IRN",
    "Korea Republic":   "KOR",
    "Ecuador":          "ECU",
    "Ukraine":          "UKR",
    "Australia":        "AUS",
    "Turkey":           "TUR",
    "Hungary":          "HUN",
    "Slovakia":         "SVK",
    "Romania":          "ROU",
    "Wales":            "WAL",
    "Czech Republic":   "CZE",
    "Poland":           "POL",
    "Serbia":           "SRB",
    "Egypt":            "EGY",
    "Nigeria":          "NGA",
    "Algeria":          "ALG",
    "Chile":            "CHI",
    "Sweden":           "SWE",
    "Venezuela":        "VEN",
    "Ivory Coast":      "CIV",
    "Côte d'Ivoire":    "CIV",
    "Russia":           "RUS",
    "Peru":             "PER",
    "Paraguay":         "PAR",
    "Greece":           "GRE",
    "Israel":           "ISR",
    "Bolivia":          "BOL",
    "Costa Rica":       "CRC",
    "Panama":           "PAN",
    "Ghana":            "GHA",
    "Saudi Arabia":     "KSA",
    "Qatar":            "QAT",
    "Canada":           "CAN",
    "South Korea":      "KOR",
    "Cote d'Ivoire":    "CIV",
}


def fetch_elo_ratings(
    timeout: int = 15,
    retries: int = 3,
    delay_between_retries: float = 2.0
) -> dict:
    """
    Descarga y parsea los Elo ratings actuales de eloratings.net.

    Returns:
        Dict {código_ISO: elo_points} con los ratings actuales.
        Retorna dict vacío si falla tras todos los reintentos.
    """
    for attempt in range(retries):
        try:
            logger.info(f"[ELO] Descargando desde {ELO_URL} (intento {attempt + 1}/{retries})")
            resp = requests.get(ELO_URL, headers=HEADERS, timeout=timeout)
            resp.raise_for_status()

            ratings = _parse_elo_page(resp.text)
            logger.info(f"[ELO] ✅ {len(ratings)} equipos parseados desde eloratings.net")
            return ratings

        except requests.RequestException as e:
            logger.warning(f"[ELO] Intento {attempt + 1} fallido: {e}")
            if attempt < retries - 1:
                time.sleep(delay_between_retries)

    logger.error("[ELO] ❌ No se pudo descargar eloratings.net tras todos los reintentos")
    return {}


def _parse_elo_page(html: str) -> dict:
    """
    Parsea el HTML de eloratings.net y extrae {nombre: elo}.
    La página tiene una tabla con columnas: Rank, Name, Elo, ...

    Maneja dos posibles estructuras de la página:
    1. Tabla HTML <table> directa
    2. Datos en JavaScript (JSON embebido)
    """
    soup = BeautifulSoup(html, "html.parser")
    ratings = {}

    # Intento 1: Buscar tabla HTML directa
    table = soup.find("table", {"id": "elo-table"}) or soup.find("table")
    if table:
        rows = table.find_all("tr")[1:]  # Skip header
        for row in rows:
            cols = row.find_all(["td", "th"])
            if len(cols) >= 3:
                try:
                    # Columna típica: Rank | Country | Elo | ...
                    name_cell = cols[1].get_text(strip=True)
                    elo_cell = cols[2].get_text(strip=True).replace(",", "")
                    elo_val = int(float(elo_cell))
                    code = ELO_NAME_TO_CODE.get(name_cell)
                    if code:
                        ratings[code] = elo_val
                except (ValueError, IndexError):
                    continue

    # Intento 2: JSON embebido en script (algunos sitios modernos usan esto)
    if not ratings:
        import re, json
        scripts = soup.find_all("script")
        for script in scripts:
            text = script.string or ""
            # Buscar patrones como: {"name":"Argentina","elo":2143}
            matches = re.findall(
                r'\{"[^}]*"name"\s*:\s*"([^"]+)"[^}]*"elo"\s*:\s*(\d+)[^}]*\}',
                text
            )
            for name, elo in matches:
                code = ELO_NAME_TO_CODE.get(name)
                if code:
                    ratings[code] = int(elo)

    # Intento 3: Parsear cualquier fila con texto que parezca país + número
    if not ratings:
        import re
        all_rows = soup.find_all("tr")
        for row in all_rows:
            cells = row.find_all("td")
            if len(cells) >= 3:
                try:
                    name = cells[1].get_text(strip=True)
                    elo_text = cells[2].get_text(strip=True).replace(",", "")
                    if re.match(r"^\d{3,4}$", elo_text):
                        code = ELO_NAME_TO_CODE.get(name)
                        if code:
                            ratings[code] = int(elo_text)
                except (ValueError, IndexError):
                    continue

    return ratings


def fetch_elo_for_team(team_name: str, timeout: int = 10) -> Optional[int]:
    """
    Descarga el Elo de un equipo específico desde su página individual.
    URL: https://www.eloratings.net/{nombre-del-pais}
    Ej:  https://www.eloratings.net/Argentina

    Más confiable para un solo equipo que parsear la tabla general.
    """
    url = f"https://www.eloratings.net/{team_name.replace(' ', '_')}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Buscar el Elo actual en elementos destacados
        import re
        # El rating actual suele estar en un elemento con clase específica
        # o como el primer número grande en la página
        text = soup.get_text()
        matches = re.findall(r"Current\s+Elo[:\s]+(\d{3,4})", text, re.IGNORECASE)
        if matches:
            return int(matches[0])

        # Fallback: buscar el número más prominente en rango Elo (1600-2300)
        numbers = re.findall(r"\b(1[6-9]\d{2}|2[0-2]\d{2})\b", text)
        if numbers:
            return int(numbers[0])

    except Exception as e:
        logger.warning(f"[ELO] No se pudo obtener Elo individual para {team_name}: {e}")

    return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Descargando Elo ratings desde eloratings.net...")
    ratings = fetch_elo_ratings()
    if ratings:
        print(f"\n✅ {len(ratings)} equipos:")
        for code, elo in sorted(ratings.items(), key=lambda x: -x[1])[:15]:
            print(f"  {code}: {elo}")
    else:
        print("❌ No se obtuvieron datos. Verifica conectividad.")
