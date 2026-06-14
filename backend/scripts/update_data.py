"""
update_data.py — Orquestador de actualización automática de datos

Ejecuta todos los scrapers en orden, fusiona los resultados y actualiza
teams.csv con los valores más recientes disponibles.

Uso:
    # Desde la carpeta /backend:
    python scripts/update_data.py

    # Con opciones:
    python scripts/update_data.py --only elo          # Solo Elo
    python scripts/update_data.py --only fifa         # Solo FIFA ranking
    python scripts/update_data.py --only transfermarkt # Solo squad values
    python scripts/update_data.py --dry-run           # Ver cambios sin aplicar
    python scripts/update_data.py --teams ARG FRA BRA # Solo estos equipos

Qué actualiza:
    ✅ elo_points         ← eloratings.net (scraping simple)
    ✅ fifa_ranking       ← fifa.com (JSON interno)
    ⚠️  squad_strength_index ← transfermarkt.com (cloudscraper, puede fallar)

Qué NO actualiza (debe editarse manualmente):
    ❌ gdp_per_capita       ← Banco Mundial (anual, cambio lento)
    ❌ population_millions  ← ONU (anual, cambio muy lento)
    ❌ avg_temp_celsius     ← Casi nunca cambia
    ❌ football_culture_index ← Juicio editorial, manual
"""

import sys
import logging
import argparse
from pathlib import Path
from datetime import datetime

import pandas as pd

# Añadir backend al path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

DATA_DIR = BACKEND_DIR.parent / "data"
TEAMS_CSV = DATA_DIR / "teams.csv"
BACKUP_DIR = DATA_DIR / "backups"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


def load_teams_df() -> pd.DataFrame:
    """Carga el teams.csv ignorando comentarios."""
    df = pd.read_csv(TEAMS_CSV, comment="#")
    df.columns = df.columns.str.strip()
    return df


def backup_teams_csv():
    """Crea un backup del teams.csv antes de modificarlo."""
    BACKUP_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"teams_{timestamp}.csv"
    import shutil
    shutil.copy(TEAMS_CSV, backup_path)
    logger.info(f"📦 Backup guardado en: {backup_path}")
    return backup_path


def save_teams_df(df: pd.DataFrame):
    """Guarda el DataFrame de vuelta al CSV, preservando los comentarios de cabecera."""
    header_comments = [
        "# teams.csv — Datos estructurales de selecciones nacionales",
        "# Fuentes: FIFA Rankings, Banco Mundial GDP per cápita 2023, UN Population 2024",
        "# Transfermarkt (valor de mercado estimado), estimaciones del autor para índices culturales",
        f"# Última actualización automática: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "#",
    ]
    with open(TEAMS_CSV, "w", encoding="utf-8") as f:
        f.write("\n".join(header_comments) + "\n")
        df.to_csv(f, index=False)


def run_elo_update(df: pd.DataFrame, team_codes: list = None) -> tuple[pd.DataFrame, int]:
    """
    Actualiza elo_points desde eloratings.net.

    Returns:
        (DataFrame actualizado, número de equipos actualizados)
    """
    logger.info("=" * 50)
    logger.info("🌐 [1/3] Actualizando Elo ratings (eloratings.net)")
    logger.info("=" * 50)

    try:
        from scripts.scrapers.elo_scraper import fetch_elo_ratings
        ratings = fetch_elo_ratings()
    except ImportError:
        logger.error("❌ No se pudo importar elo_scraper. Verifica dependencias.")
        return df, 0

    if not ratings:
        logger.warning("⚠️  No se obtuvieron datos de Elo. Columna elo_points sin cambios.")
        return df, 0

    updated = 0
    for idx, row in df.iterrows():
        code = row["code"]
        if team_codes and code not in team_codes:
            continue
        if code in ratings:
            old = row["elo_points"]
            new = ratings[code]
            df.at[idx, "elo_points"] = new
            if old != new:
                logger.info(f"  {code}: {old} → {new} ({'+' if new > old else ''}{new - old})")
                updated += 1

    logger.info(f"✅ Elo: {updated} equipos actualizados")
    return df, updated


def run_fifa_update(df: pd.DataFrame, team_codes: list = None) -> tuple[pd.DataFrame, int]:
    """
    Actualiza fifa_ranking desde fifa.com.

    Returns:
        (DataFrame actualizado, número de equipos actualizados)
    """
    logger.info("=" * 50)
    logger.info("🌐 [2/3] Actualizando Ranking FIFA (fifa.com)")
    logger.info("=" * 50)

    try:
        from scripts.scrapers.fifa_scraper import fetch_fifa_rankings
        rankings = fetch_fifa_rankings()
    except ImportError:
        logger.error("❌ No se pudo importar fifa_scraper. Verifica dependencias.")
        return df, 0

    if not rankings:
        logger.warning("⚠️  No se obtuvieron datos de FIFA. Columna fifa_ranking sin cambios.")
        return df, 0

    updated = 0
    for idx, row in df.iterrows():
        code = row["code"]
        if team_codes and code not in team_codes:
            continue
        if code in rankings:
            old_rank = row["fifa_ranking"]
            new_rank = rankings[code]["ranking"]
            df.at[idx, "fifa_ranking"] = new_rank
            if old_rank != new_rank:
                move = old_rank - new_rank  # Positivo = subió
                arrow = "↑" if move > 0 else "↓" if move < 0 else "="
                logger.info(f"  {code}: #{old_rank} → #{new_rank} {arrow}{abs(move)}")
                updated += 1

    logger.info(f"✅ FIFA: {updated} equipos actualizados")
    return df, updated


def run_transfermarkt_update(df: pd.DataFrame, team_codes: list = None) -> tuple[pd.DataFrame, int]:
    """
    Actualiza squad_strength_index desde Transfermarkt (puede fallar por anti-bot).

    Returns:
        (DataFrame actualizado, número de equipos actualizados)
    """
    logger.info("=" * 50)
    logger.info("🌐 [3/3] Actualizando Squad Strength (transfermarkt.com)")
    logger.info("=" * 50)
    logger.info("⚠️  Nota: Transfermarkt usa Cloudflare. Si falla, actualiza manualmente.")
    logger.info("    Referencia: https://www.transfermarkt.com/statistik/nationalmannschaft")

    # Verificar que cloudscraper esté instalado
    try:
        import cloudscraper  # noqa
    except ImportError:
        logger.error("❌ cloudscraper no instalado.")
        logger.error("   Instala con: pip install cloudscraper")
        logger.info(_transfermarkt_manual_guide())
        return df, 0

    try:
        from scripts.scrapers.transfermarkt_scraper import fetch_squad_values
    except ImportError:
        logger.error("❌ No se pudo importar transfermarkt_scraper.")
        return df, 0

    # Filtrar equipos a actualizar
    codes_to_update = team_codes or list(df["code"].values)

    logger.info(f"Actualizando {len(codes_to_update)} equipos (con delay de 2.5s entre requests)...")
    values = fetch_squad_values(codes_to_update, delay_between_requests=2.5)

    if not values:
        logger.warning("⚠️  Transfermarkt no retornó datos.")
        logger.info(_transfermarkt_manual_guide())
        return df, 0

    updated = 0
    for idx, row in df.iterrows():
        code = row["code"]
        if code in values:
            old = row["squad_strength_index"]
            new = values[code]
            df.at[idx, "squad_strength_index"] = new
            if abs(old - new) > 0.5:
                logger.info(f"  {code}: {old} → {new}")
                updated += 1

    logger.info(f"✅ Transfermarkt: {updated} equipos actualizados")
    return df, updated


def _transfermarkt_manual_guide() -> str:
    return """
    📋 GUÍA MANUAL para squad_strength_index:
    1. Ve a https://www.transfermarkt.com/statistik/nationalmannschaft
    2. Ordena por "Market value" (mayor a menor)
    3. El valor máximo (tipicamente Francia ~1,800M€) = índice 100
    4. Calcula: índice = (valor_equipo / 1900) * 100
    5. Edita teams.csv con los nuevos valores
    Ejemplo: Argentina 1,100M€ → índice = (1100/1900)*100 ≈ 57.9
    """


def print_summary(changes: dict):
    """Imprime resumen de todos los cambios realizados."""
    total = sum(changes.values())
    logger.info("")
    logger.info("=" * 50)
    logger.info("📊 RESUMEN DE ACTUALIZACIÓN")
    logger.info("=" * 50)
    for source, count in changes.items():
        status = "✅" if count > 0 else "⚠️ "
        logger.info(f"  {status} {source:20s}: {count} equipos actualizados")
    logger.info(f"  {'TOTAL':22s}: {total} cambios")
    logger.info("=" * 50)


def main():
    parser = argparse.ArgumentParser(
        description="Actualiza datos de selecciones desde fuentes externas"
    )
    parser.add_argument(
        "--only",
        choices=["elo", "fifa", "transfermarkt", "all"],
        default="all",
        help="Qué fuente actualizar (default: all)"
    )
    parser.add_argument(
        "--teams",
        nargs="+",
        metavar="CODE",
        help="Códigos ISO de equipos a actualizar (ej: ARG FRA BRA). Default: todos"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mostrar cambios sin aplicarlos al CSV"
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="No crear backup antes de modificar teams.csv"
    )
    args = parser.parse_args()

    logger.info("")
    logger.info("⚽ Football Predictor — Actualización de Datos")
    logger.info(f"   Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if args.teams:
        logger.info(f"   Equipos: {', '.join(args.teams)}")
    if args.dry_run:
        logger.info("   Modo: DRY RUN (no se modificará teams.csv)")
    logger.info("")

    # Cargar datos actuales
    df = load_teams_df()
    logger.info(f"📂 teams.csv cargado: {len(df)} equipos")

    # Backup
    if not args.dry_run and not args.no_backup:
        backup_teams_csv()

    changes = {}
    team_codes = args.teams or None

    # Ejecutar scrapers según --only
    if args.only in ("elo", "all"):
        df, n = run_elo_update(df, team_codes)
        changes["Elo (eloratings.net)"] = n

    if args.only in ("fifa", "all"):
        df, n = run_fifa_update(df, team_codes)
        changes["FIFA Rankings"] = n

    if args.only in ("transfermarkt", "all"):
        df, n = run_transfermarkt_update(df, team_codes)
        changes["Transfermarkt"] = n

    # Guardar
    print_summary(changes)

    total_changes = sum(changes.values())
    if total_changes > 0:
        if args.dry_run:
            logger.info("🔍 DRY RUN: teams.csv NO fue modificado")
            logger.info("   Ejecuta sin --dry-run para aplicar los cambios")
        else:
            save_teams_df(df)
            logger.info(f"💾 teams.csv actualizado con {total_changes} cambios")
    else:
        logger.info("ℹ️  No hubo cambios. teams.csv sin modificar.")

    logger.info("")
    logger.info("✅ Actualización completada.")


if __name__ == "__main__":
    main()
