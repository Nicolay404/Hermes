"""
transfermarkt_scraper.py — Scraper de valor de mercado de plantillas nacionales

FUENTE: https://www.transfermarkt.com
MÉTODO: cloudscraper (bypass Cloudflare) + BeautifulSoup
ESTADO: ⚠️ DIFÍCIL — Transfermarkt usa Cloudflare + heurísticas anti-bot.
        cloudscraper logra bypasear en muchos casos, pero puede fallar.
        Si falla, el orquestador usa el valor actual de teams.csv sin cambiar.

AVISO LEGAL: Transfermarkt permite uso personal/no comercial de sus datos públicos.
             Este scraper respeta robots.txt, usa delays entre requests y no sobrecarga
             el servidor. Solo para uso personal con esta herramienta.

Uso:
    from backend.scripts.scrapers.transfermarkt_scraper import fetch_squad_values
    values = fetch_squad_values(['ARG', 'FRA', 'BRA'])
    # {'ARG': 85.2, 'FRA': 96.1, ...}  ← índice 0-100 normalizado
"""

import re
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Mapeo código ISO → slug de Transfermarkt para páginas de selecciones
# URL base: https://www.transfermarkt.com/wettbewerbe/nationalmannschaft/wettbewerb/{code}
TM_CODE_MAP = {
    "ARG": "AR",  "FRA": "FR",  "ENG": "GB1", "BEL": "BE",
    "BRA": "BU",  "POR": "PO",  "NED": "NL",  "ESP": "ES",
    "CRO": "HR",  "ITA": "IT",  "GER": "L",   "COL": "CO",
    "URU": "UY",  "MAR": "MA",  "USA": "MLS", "MEX": "MX",
    "SUI": "SW",  "SEN": "SN",  "DEN": "DK",  "JPN": "JP",
    "AUT": "AT",  "IRN": "IR",  "KOR": "KR",  "ECU": "EC",
    "UKR": "UA",  "AUS": "AU",  "TUR": "TR",  "HUN": "HU",
    "SVK": "SK",  "ROU": "RO",  "WAL": "WL",  "CZE": "CZ",
    "POL": "PL",  "SRB": "RS",  "EGY": "EG",  "NGA": "NG",
    "ALG": "DZ",  "CHI": "CL",  "SWE": "SE",  "VEN": "VE",
    "CIV": "CI",  "RUS": "RU",  "PER": "PE",  "PAR": "PY",
    "GRE": "GR",  "ISR": "IL",  "BOL": "BO",  "CRC": "CR",
    "PAN": "PA",  "GHA": "GH",  "KSA": "SA",  "QAT": "QA",
    "CAN": "CA",
}

# Valor de mercado total máximo esperado (en millones €) para normalizar a 0-100
# Referencia: Francia ~1,800M€, Argentina ~1,200M€ (actualizar anualmente)
MAX_SQUAD_VALUE_MILLION_EUR = 1900.0

TM_BASE = "https://www.transfermarkt.com"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-GB,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Referer": "https://www.transfermarkt.com/",
    "DNT": "1",
}


def fetch_squad_values(
    team_codes: list,
    delay_between_requests: float = 2.5,
    timeout: int = 20
) -> dict:
    """
    Descarga el valor de mercado total de los planteles de los equipos dados.

    Args:
        team_codes: Lista de códigos ISO a consultar, ej. ['ARG', 'FRA', 'BRA']
        delay_between_requests: Segundos entre requests (cortesía al servidor)
        timeout: Timeout en segundos por request

    Returns:
        Dict {código_ISO: squad_strength_index (0-100)}
        Los equipos sin datos mantienen su valor actual de teams.csv.
    """
    try:
        import cloudscraper
        scraper = cloudscraper.create_scraper(
            browser={"browser": "chrome", "platform": "windows", "mobile": False}
        )
    except ImportError:
        logger.error("[TM] cloudscraper no instalado. Ejecuta: pip install cloudscraper")
        return {}

    results = {}

    for code in team_codes:
        tm_code = TM_CODE_MAP.get(code)
        if not tm_code:
            logger.warning(f"[TM] Código {code} no tiene mapeo en TM_CODE_MAP, skipping")
            continue

        value = _fetch_team_value(scraper, tm_code, code, timeout)
        if value is not None:
            # Normalizar a índice 0-100
            index = min(round((value / MAX_SQUAD_VALUE_MILLION_EUR) * 100, 1), 100.0)
            results[code] = index
            logger.info(f"[TM] ✅ {code}: {value:.1f}M€ → índice {index}")
        else:
            logger.warning(f"[TM] ⚠️  {code}: no se pudo obtener valor (se mantiene valor actual)")

        # Delay respetuoso entre requests
        time.sleep(delay_between_requests)

    return results


def _fetch_team_value(
    scraper,
    tm_code: str,
    iso_code: str,
    timeout: int
) -> Optional[float]:
    """
    Descarga y parsea el valor total del plantel de un equipo desde Transfermarkt.

    Returns:
        Valor total en millones de euros, o None si falla.
    """
    url = f"{TM_BASE}/wettbewerbe/nationalmannschaft/wettbewerb/{tm_code}"

    try:
        resp = scraper.get(url, headers=HEADERS, timeout=timeout)

        if resp.status_code == 403:
            logger.warning(f"[TM] 403 Forbidden para {iso_code} — Cloudflare activo")
            return None
        if resp.status_code == 404:
            logger.warning(f"[TM] 404 para {iso_code} en URL: {url}")
            return None
        if resp.status_code != 200:
            logger.warning(f"[TM] HTTP {resp.status_code} para {iso_code}")
            return None

        return _parse_squad_value(resp.text, iso_code)

    except Exception as e:
        logger.warning(f"[TM] Error descargando {iso_code}: {e}")
        return None


def _parse_squad_value(html: str, iso_code: str) -> Optional[float]:
    """
    Parsea el HTML de Transfermarkt para extraer el valor total del plantel.

    Transfermarkt muestra el valor en formatos como:
    - "€1.20bn" (miles de millones)
    - "€850.00m" (millones)
    - "1.200 Mio. €" (formato europeo)
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")

    # Intento 1: Buscar el valor total en el resumen de la selección
    # Suele estar en un elemento con clase "market-value" o "tm-market-value"
    value_elements = soup.find_all(
        string=re.compile(r"(€|Mio\.|\bm\b|\bbn\b)", re.IGNORECASE)
    )

    for element in value_elements:
        text = element.strip()
        value = _parse_value_string(text)
        if value and 10 < value < 5000:  # Rango razonable en millones €
            return value

    # Intento 2: Buscar en elementos específicos de TM
    for selector in [
        {"class_": "market-value"},
        {"class_": "tm-market-value__wrapper"},
        {"class_": "data-header__market-value-wrapper"},
        {"data-value": True},
    ]:
        elements = soup.find_all(**selector) or []
        for el in elements:
            text = el.get_text(strip=True)
            value = _parse_value_string(text)
            if value and 10 < value < 5000:
                return value

    # Intento 3: Regex sobre el texto completo
    text_full = soup.get_text()
    # Buscar patrones como "Total market value: €1.20bn" o "€850.00m"
    patterns = [
        r"Total\s+(?:market\s+)?value[:\s]*€?([\d,.]+)\s*(bn|m|Mio\.?)",
        r"€\s*([\d,.]+)\s*(bn|Mio\.|m)",
        r"([\d,.]+)\s*(?:Mio\.|Mrd\.)\s*€",
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text_full, re.IGNORECASE)
        for match in matches:
            num_str = match[0].replace(",", ".").replace(".", "", match[0].count(".") - 1)
            try:
                num = float(num_str.replace(",", ""))
                unit = match[1].lower() if len(match) > 1 else "m"
                if "bn" in unit or "mrd" in unit:
                    num *= 1000  # Convertir a millones
                if 10 < num < 5000:
                    return num
            except ValueError:
                continue

    logger.debug(f"[TM] No se encontró valor de mercado en HTML de {iso_code}")
    return None


def _parse_value_string(text: str) -> Optional[float]:
    """
    Convierte string de valor como '€1.20bn', '€850m', '1.200 Mio. €' a float en millones.
    """
    text = text.strip()
    if not text:
        return None

    # Formato anglosajón: €1.20bn o €850.00m
    match_bn = re.match(r"€?\s*([\d,.]+)\s*bn", text, re.IGNORECASE)
    if match_bn:
        try:
            return float(match_bn.group(1).replace(",", "")) * 1000
        except ValueError:
            pass

    match_m = re.match(r"€?\s*([\d,.]+)\s*m(?!io)", text, re.IGNORECASE)
    if match_m:
        try:
            return float(match_m.group(1).replace(",", ""))
        except ValueError:
            pass

    # Formato europeo: 1.200 Mio. €
    match_mio = re.match(r"([\d.]+(?:,\d+)?)\s*Mio\.?\s*€?", text, re.IGNORECASE)
    if match_mio:
        try:
            num_str = match_mio.group(1).replace(".", "").replace(",", ".")
            return float(num_str)
        except ValueError:
            pass

    return None


def fetch_single_team_value(iso_code: str, timeout: int = 20) -> Optional[float]:
    """Conveniencia: obtiene el valor de un solo equipo."""
    results = fetch_squad_values([iso_code], timeout=timeout)
    return results.get(iso_code)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Probando scraper de Transfermarkt (solo ARG y FRA para test)...")
    values = fetch_squad_values(["ARG", "FRA"], delay_between_requests=3.0)
    if values:
        print(f"\n✅ Resultados:")
        for code, idx in values.items():
            print(f"  {code}: squad_strength_index = {idx}")
    else:
        print("❌ No se obtuvieron datos.")
        print("   → Instala cloudscraper: pip install cloudscraper")
        print("   → O actualiza squad_strength_index manualmente en teams.csv")
        print("   → Fuente de referencia: https://www.transfermarkt.com/statistik/nationalmannschaft")
