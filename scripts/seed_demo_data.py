import sqlite3
import os
import sys
from pathlib import Path

# Set UTF-8 encoding for standard output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = ROOT_DIR / "database" / "bhoomisetu.db"
SCHEMA_DIR = ROOT_DIR / "database" / "schema"
SEEDS_DIR = ROOT_DIR / "database" / "seeds"

def init_and_seed_db():
    print(f"[*] Initializing SQLite database at: {DB_PATH}")
    os.makedirs(DB_PATH.parent, exist_ok=True)
    
    # Remove existing db if resetting
    if DB_PATH.exists():
        try:
            os.remove(DB_PATH)
            print("[+] Removed old database file.")
        except Exception as e:
            pass

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    # Drop existing tables if file was locked and couldn't be deleted
    cursor.execute("PRAGMA foreign_keys = OFF;")
    all_tables = [
        "survey_predictive_metrics", "survey_status_history", "survey_reports",
        "survey_resurvey_requests", "survey_discrepancies", "survey_evidence",
        "survey_field_observations", "survey_gps_verifications", "survey_schedules",
        "survey_document_verifications", "survey_requests",
        "verification_requests", "land_verification_records", "officer_verification_records",
        "officers", "activity_logs", "grievance_updates", "grievances", "alerts",
        "prediction_factors", "risk_predictions", "departmental_tasks",
        "compensation_stages_log", "compensations", "ocr_results", "documents",
        "parcel_ownerships", "landowners", "parcels", "acquisition_cases",
        "villages", "projects", "users", "departments"
    ]
    for tbl in all_tables:
        cursor.execute(f"DROP TABLE IF EXISTS {tbl};")
    conn.commit()

    # 1. Execute Schema
    schema_files = ["tables.sql", "indexes.sql"]
    for sf in schema_files:
        file_path = SCHEMA_DIR / sf
        if file_path.exists():
            print(f"[+] Applying schema: {sf}")
            with open(file_path, "r", encoding="utf-8") as f:
                cursor.executescript(f.read())

    # 2. Execute Seeds in order
    seed_files = [
        "users.sql",
        "projects.sql",
        "cases.sql",
        "parcels.sql",
        "compensations.sql",
        "tasks.sql",
        "grievances.sql",
        "verification_records.sql",
        "surveys.sql"
    ]

    for seed in seed_files:
        file_path = SEEDS_DIR / seed
        if file_path.exists():
            print(f"[+] Seeding data from: {seed}")
            with open(file_path, "r", encoding="utf-8") as f:
                cursor.executescript(f.read())

    conn.commit()

    # Verification queries
    print("\n--- DATABASE VERIFICATION SUMMARY ---")
    tables = [
        "departments", "users", "projects", "villages",
        "acquisition_cases", "parcels", "landowners",
        "parcel_ownerships", "compensations", "departmental_tasks",
        "grievances", "officers", "officer_verification_records",
        "land_verification_records", "verification_requests",
        "survey_requests", "survey_schedules", "survey_document_verifications",
        "survey_gps_verifications", "survey_field_observations",
        "survey_evidence", "survey_discrepancies", "survey_resurvey_requests",
        "survey_reports", "survey_status_history", "survey_predictive_metrics"
    ]
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            cnt = cursor.fetchone()[0]
            print(f"  [OK] {table:<32} : {cnt} records")
        except Exception as e:
            print(f"  [ERR] {table:<32} : Error ({e})")

    conn.close()
    print("\n[SUCCESS] Database initialization and seeding completed successfully!")

if __name__ == "__main__":
    init_and_seed_db()
