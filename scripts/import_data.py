"""
Bharat Geo API — Census 2011 Village Directory Import Script

Reads all XLS/ODS files from /dataset and imports the full
State → District → SubDistrict → Village hierarchy into PostgreSQL.

Usage:
    python scripts/import_data.py

Requirements (install via venv):
    pip install pandas xlrd openpyxl odfpy psycopg2-binary python-dotenv
"""

import os
import re
import sys
import time
import logging
from pathlib import Path
from datetime import datetime

import pandas as pd
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# ── Config ─────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
BATCH_SIZE = 5000

load_dotenv(BASE_DIR / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")

# ── Logging ─────────────────────────────────────────────────────────────────

log_path = BASE_DIR / "scripts" / f"import_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_path),
    ],
)
log = logging.getLogger(__name__)

# ── Column names ─────────────────────────────────────────────────────────────

REQUIRED_COLS = {
    "MDDS STC",
    "STATE NAME",
    "MDDS DTC",
    "DISTRICT NAME",
    "MDDS Sub_DT",
    "SUB-DISTRICT NAME",
    "MDDS PLCN",
    "Area Name",
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def clean_name(value) -> str | None:
    if pd.isna(value) or str(value).strip() == "":
        return None
    return str(value).strip()


def to_code(value, width: int) -> str:
    """Normalise a census code to a zero-padded string."""
    try:
        n = int(float(value))
        return str(n).zfill(width)
    except (ValueError, TypeError):
        return str(value).strip().zfill(width)


def read_file(filepath: Path) -> pd.DataFrame | None:
    """
    Read XLS/XLSX/ODS.  Prefers a sheet named 'Village Directory';
    falls back to the first sheet that contains all required columns.
    Returns DataFrame or None on error.
    """
    suffix = filepath.suffix.lower()
    engine_map = {".xls": "xlrd", ".xlsx": "openpyxl", ".xlsm": "openpyxl", ".ods": "odf"}
    engine = engine_map.get(suffix)
    if engine is None:
        log.warning("Unsupported format: %s — skipping", filepath.name)
        return None

    try:
        # Read all sheets so we can pick the right one
        all_sheets: dict[str, pd.DataFrame] = pd.read_excel(
            filepath, engine=engine, sheet_name=None, dtype=str
        )

        # 1. Prefer the canonical sheet name
        for candidate in ("Village Directory", "village directory", "VILLAGE DIRECTORY"):
            if candidate in all_sheets:
                return all_sheets[candidate]

        # 2. Fall back to first sheet whose columns match
        for sheet_name, df in all_sheets.items():
            if REQUIRED_COLS.issubset(set(df.columns)):
                log.debug("Using sheet '%s' in %s", sheet_name, filepath.name)
                return df

        log.error("No usable sheet found in %s", filepath.name)
        return None
    except Exception as exc:
        log.error("Failed to read %s: %s", filepath.name, exc)
        return None


def validate_columns(df: pd.DataFrame, filepath: Path) -> bool:
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        log.error("Missing columns in %s: %s", filepath.name, missing)
        return False
    return True


# ── DB helpers ────────────────────────────────────────────────────────────────

def get_or_create_country(cur, name: str, iso_code: str) -> int:
    cur.execute(
        "SELECT id FROM countries WHERE \"isoCode\" = %s",
        (iso_code,),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO countries (name, \"isoCode\", \"createdAt\") VALUES (%s, %s, NOW()) RETURNING id",
        (name, iso_code),
    )
    return cur.fetchone()[0]


def upsert_state(cur, name: str, census_code: str, country_id: int) -> int:
    cur.execute(
        """
        INSERT INTO states (name, "censusCode", "countryId")
        VALUES (%s, %s, %s)
        ON CONFLICT ("censusCode", "countryId") DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        """,
        (name, census_code, country_id),
    )
    return cur.fetchone()[0]


def upsert_district(cur, name: str, census_code: str, state_id: int) -> int:
    cur.execute(
        """
        INSERT INTO districts (name, "censusCode", "stateId")
        VALUES (%s, %s, %s)
        ON CONFLICT ("censusCode", "stateId") DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        """,
        (name, census_code, state_id),
    )
    return cur.fetchone()[0]


def upsert_subdistrict(cur, name: str, census_code: str, district_id: int) -> int:
    cur.execute(
        """
        INSERT INTO sub_districts (name, "censusCode", "districtId")
        VALUES (%s, %s, %s)
        ON CONFLICT ("censusCode", "districtId") DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        """,
        (name, census_code, district_id),
    )
    return cur.fetchone()[0]


def batch_insert_villages(cur, rows: list[tuple]) -> int:
    """
    rows: list of (name, census_code, sub_district_id)
    Returns number of rows actually inserted (skips conflicts).
    """
    if not rows:
        return 0
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO villages (name, "censusCode", "subDistrictId")
        VALUES %s
        ON CONFLICT ("censusCode", "subDistrictId") DO NOTHING
        """,
        rows,
        page_size=BATCH_SIZE,
    )
    return cur.rowcount  # may be -1 for ON CONFLICT DO NOTHING in older psycopg2


# ── Per-file processing ───────────────────────────────────────────────────────

def process_file(cur, filepath: Path, country_id: int) -> dict:
    stats = {"rows_read": 0, "villages_queued": 0, "errors": 0}

    df = read_file(filepath)
    if df is None:
        stats["errors"] += 1
        return stats

    if not validate_columns(df, filepath):
        stats["errors"] += 1
        return stats

    # Drop rows where all key columns are NaN
    df = df.dropna(how="all")
    df = df.drop_duplicates()
    stats["rows_read"] = len(df)

    # Local caches to avoid redundant DB round-trips within this file
    state_cache: dict[str, int] = {}
    district_cache: dict[tuple, int] = {}
    subdistrict_cache: dict[tuple, int] = {}

    village_batch: list[tuple] = []
    villages_inserted = 0

    def flush_villages():
        nonlocal villages_inserted
        batch_insert_villages(cur, village_batch)
        villages_inserted += len(village_batch)
        village_batch.clear()

    for _, row in df.iterrows():
        try:
            state_code = to_code(row["MDDS STC"], 2)
            state_name = clean_name(row["STATE NAME"])
            district_code = to_code(row["MDDS DTC"], 3)
            district_name = clean_name(row["DISTRICT NAME"])
            subdistrict_code = to_code(row["MDDS Sub_DT"], 5)
            subdistrict_name = clean_name(row["SUB-DISTRICT NAME"])
            village_code = to_code(row["MDDS PLCN"], 6)
            area_name = clean_name(row["Area Name"])

            # Skip rows with missing critical names
            if not state_name or not district_name or not subdistrict_name:
                continue

            # ── State ──────────────────────────────────────────────────
            if state_code not in state_cache:
                state_id = upsert_state(cur, state_name, state_code, country_id)
                state_cache[state_code] = state_id
            state_id = state_cache[state_code]

            # ── District (skip summary rows where district_code is all-zeros) ──
            if int(district_code) == 0:
                continue
            d_key = (district_code, state_id)
            if d_key not in district_cache:
                district_id = upsert_district(cur, district_name, district_code, state_id)
                district_cache[d_key] = district_id
            district_id = district_cache[d_key]

            # ── SubDistrict (skip summary rows) ──────────────────────────
            if int(subdistrict_code) == 0:
                continue
            sd_key = (subdistrict_code, district_id)
            if sd_key not in subdistrict_cache:
                subdistrict_id = upsert_subdistrict(
                    cur, subdistrict_name, subdistrict_code, district_id
                )
                subdistrict_cache[sd_key] = subdistrict_id
            subdistrict_id = subdistrict_cache[sd_key]

            # ── Village (only rows with a non-zero place code) ────────────
            if int(village_code) == 0:
                continue
            if not area_name:
                stats["errors"] += 1
                continue

            village_batch.append((area_name, village_code, subdistrict_id))
            stats["villages_queued"] += 1

            if len(village_batch) >= BATCH_SIZE:
                flush_villages()

        except Exception as exc:
            log.warning("Row error in %s: %s | row=%s", filepath.name, exc, dict(row))
            stats["errors"] += 1

    flush_villages()
    stats["villages_inserted"] = villages_inserted
    return stats


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if not DATABASE_URL:
        log.error("DATABASE_URL not set in .env — aborting.")
        sys.exit(1)

    files = sorted(
        [
            f
            for f in DATASET_DIR.iterdir()
            if f.suffix.lower() in (".xls", ".xlsx", ".xlsm", ".ods")
        ]
    )

    if not files:
        log.error("No dataset files found in %s", DATASET_DIR)
        sys.exit(1)

    log.info("Found %d dataset file(s) in %s", len(files), DATASET_DIR)

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        country_id = get_or_create_country(cur, "India", "IND")
        conn.commit()
        log.info("Country India id=%d", country_id)

        total_villages = 0
        total_errors = 0
        t_start = time.perf_counter()

        for i, filepath in enumerate(files, 1):
            log.info("[%d/%d] Processing %s …", i, len(files), filepath.name)
            t_file = time.perf_counter()

            try:
                stats = process_file(cur, filepath, country_id)
                conn.commit()
                elapsed = time.perf_counter() - t_file
                log.info(
                    "  → rows_read=%-6d  villages=%-6d  errors=%-4d  (%.1fs)",
                    stats["rows_read"],
                    stats.get("villages_queued", 0),
                    stats["errors"],
                    elapsed,
                )
                total_villages += stats.get("villages_queued", 0)
                total_errors += stats["errors"]
            except Exception as exc:
                conn.rollback()
                log.error("  FAILED — rolling back: %s", exc)
                total_errors += 1

        total_elapsed = time.perf_counter() - t_start
        log.info("=" * 60)
        log.info(
            "Import complete: %d villages queued, %d errors, %.1fs total",
            total_villages,
            total_errors,
            total_elapsed,
        )
        log.info("Log saved to: %s", log_path)

    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
