#!/usr/bin/env python3
"""
update_wc2026_results.py
========================
Consulta la ESPN API y actualiza automaticamente los resultados de partidos
completados en frontend/src/data/wc2026.js.

Uso:
  python scripts/update_wc2026_results.py

Sin dependencias externas adicionales (usa urllib de la stdlib si requests
no esta disponible, pero instala requests si puede).
"""

import re
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta

try:
    import requests as _req
    def http_get(url):
        r = _req.get(url, timeout=10)
        r.raise_for_status()
        return r.json()
except ImportError:
    from urllib.request import urlopen
    from urllib.error import URLError
    def http_get(url):
        with urlopen(url, timeout=10) as r:
            return json.loads(r.read().decode())

# ── Rutas ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
WC2026_PATH = SCRIPT_DIR.parent / 'frontend' / 'src' / 'data' / 'wc2026.js'

# ── Mapa de nombres ESPN → nombres en wc2026.js ───────────────────────────────
ESPN_MAP = {
    'Mexico':                        'Mexico',
    'South Africa':                  'South Africa',
    'South Korea':                   'South Korea',
    'Republic of Korea':             'South Korea',
    'Czech Republic':                'Czech Republic',
    'Czechia':                       'Czech Republic',
    'Canada':                        'Canada',
    'Bosnia and Herzegovina':        'Bosnia & Herzegovina',
    'Bosnia & Herzegovina':          'Bosnia & Herzegovina',
    'Qatar':                         'Qatar',
    'Switzerland':                   'Switzerland',
    'Brazil':                        'Brazil',
    'Brasil':                        'Brazil',
    'Morocco':                       'Morocco',
    'Haiti':                         'Haiti',
    'Scotland':                      'Scotland',
    'United States':                 'United States',
    'USA':                           'United States',
    'US':                            'United States',
    'Paraguay':                      'Paraguay',
    'Australia':                     'Australia',
    'Turkey':                        'Turkey',
    'Turkiye':                       'Turkey',
    'Germany':                       'Germany',
    'Curacao':                       'Curacão',
    'Curaçao':                  'Curacão',
    "Cote D'Ivoire":                 'Ivory Coast',
    'Ivory Coast':                   'Ivory Coast',
    'Ecuador':                       'Ecuador',
    'Netherlands':                   'Netherlands',
    'Holland':                       'Netherlands',
    'Japan':                         'Japan',
    'Sweden':                        'Sweden',
    'Tunisia':                       'Tunisia',
    'Belgium':                       'Belgium',
    'Egypt':                         'Egypt',
    'Iran':                          'Iran',
    'New Zealand':                   'New Zealand',
    'Spain':                         'Spain',
    'Cape Verde':                    'Cape Verde',
    'Saudi Arabia':                  'Saudi Arabia',
    'Uruguay':                       'Uruguay',
    'France':                        'France',
    'Senegal':                       'Senegal',
    'Iraq':                          'Iraq',
    'Norway':                        'Norway',
    'Argentina':                     'Argentina',
    'Algeria':                       'Algeria',
    'Austria':                       'Austria',
    'Jordan':                        'Jordan',
    'Portugal':                      'Portugal',
    'DR Congo':                      'DR Congo',
    'Congo DR':                      'DR Congo',
    'Democratic Republic of Congo':  'DR Congo',
    'Democratic Republic of the Congo': 'DR Congo',
    'Uzbekistan':                    'Uzbekistan',
    'Colombia':                      'Colombia',
    'England':                       'England',
    'Croatia':                       'Croatia',
    'Ghana':                         'Ghana',
    'Panama':                        'Panama',
}

def normalize(name: str) -> str:
    return ESPN_MAP.get(name, name)

# ── Parseo de wc2026.js ───────────────────────────────────────────────────────
FIXTURE_RE = re.compile(
    r"\{ id: '(?P<id>[^']+)'[^}]*?team_a: '(?P<a>[^']+)'[^}]*?team_b: '(?P<b>[^']+)'[^}]*?result: (?P<res>null|\{[^}]+\})",
    re.DOTALL,
)

def parse_pending(content: str) -> dict:
    """Devuelve {(team_a, team_b): fixture_id} para partidos sin resultado."""
    idx = {}
    for m in FIXTURE_RE.finditer(content):
        if m.group('res') == 'null':
            idx[(m.group('a'), m.group('b'))] = m.group('id')
    return idx

def patch_result(content: str, fid: str, a: int, b: int) -> tuple[str, int]:
    """Reemplaza result: null por result: { a: X, b: Y } para un fixture dado."""
    pat = r"(id: '" + re.escape(fid) + r"'.*?result: )null"
    repl = r'\g<1>{ a: ' + str(a) + r', b: ' + str(b) + r' }'
    return re.subn(pat, repl, content, flags=re.DOTALL)

# ── ESPN API ──────────────────────────────────────────────────────────────────
ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates={}'

def fetch_completed(date_str: str) -> list[dict]:
    """
    Devuelve lista de partidos completados para una fecha (formato YYYYMMDD).
    Cada elemento: { home: str, away: str, score_home: int, score_away: int }
    """
    try:
        data = http_get(ESPN_URL.format(date_str))
    except Exception as e:
        print(f'  [warn] ESPN error {date_str}: {e}')
        return []

    results = []
    for event in data.get('events', []):
        status = event.get('status', {}).get('type', {})
        if not status.get('completed'):
            continue
        comps = event.get('competitions', [{}])
        if not comps:
            continue
        competitors = comps[0].get('competitors', [])
        if len(competitors) < 2:
            continue

        home = next((c for c in competitors if c.get('homeAway') == 'home'), competitors[0])
        away = next((c for c in competitors if c.get('homeAway') == 'away'), competitors[1])

        results.append({
            'home':       home.get('team', {}).get('displayName', ''),
            'away':       away.get('team', {}).get('displayName', ''),
            'score_home': int(home.get('score') or 0),
            'score_away': int(away.get('score') or 0),
        })
    return results

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print('=== update_wc2026_results.py ===')

    if not WC2026_PATH.exists():
        print(f'ERROR: archivo no encontrado: {WC2026_PATH}')
        sys.exit(1)

    content = WC2026_PATH.read_text(encoding='utf-8')
    pending = parse_pending(content)

    if not pending:
        print('Todo al dia: no hay partidos pendientes de resultado.')
        return

    print(f'Partidos sin resultado: {len(pending)}')

    # Consultar los ultimos 8 dias (cubre desfases de zona horaria y actualizaciones tardias)
    today = datetime.utcnow()
    dates = [(today - timedelta(days=i)).strftime('%Y%m%d') for i in range(7, -1, -1)]

    updated = 0
    for date_str in dates:
        for match in fetch_completed(date_str):
            h = normalize(match['home'])
            a = normalize(match['away'])

            # Buscar en ambas direcciones (ESPN puede invertir local/visitante)
            if (h, a) in pending:
                fid = pending.pop((h, a))
                score_a, score_b = match['score_home'], match['score_away']
            elif (a, h) in pending:
                fid = pending.pop((a, h))
                score_a, score_b = match['score_away'], match['score_home']
            else:
                continue

            content, count = patch_result(content, fid, score_a, score_b)
            if count:
                print(f'  [{fid}] {h} {score_a}-{score_b} {a}')
                updated += 1

    if updated:
        # Actualizar el comentario de fecha en el encabezado
        hoy = datetime.utcnow().strftime('%d %b %Y').lower()
        content = re.sub(
            r'(Resultados: actualizados al )[\w\s]+',
            r'\g<1>' + hoy,
            content,
        )
        WC2026_PATH.write_text(content, encoding='utf-8')
        print(f'\nListo: {updated} resultado(s) actualizado(s) en wc2026.js')
    else:
        print('Sin cambios: no se encontraron nuevos resultados en ESPN.')

if __name__ == '__main__':
    main()
