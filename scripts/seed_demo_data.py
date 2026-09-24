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
            print(f"[!] Note: {e}")

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    # Drop any existing tables to guarantee clean re-seed even if file lock prevented os.remove
    cursor.execute("PRAGMA foreign_keys = OFF;")
    existing_tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").fetchall()
    for (t_name,) in existing_tables:
        cursor.execute(f'DROP TABLE IF EXISTS "{t_name}";')
    conn.commit()
    cursor.execute("PRAGMA foreign_keys = ON;")

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
        "grievances.sql"
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
        "grievances"
    ]
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            cnt = cursor.fetchone()[0]
            print(f"  [OK] {table:<22} : {cnt} records")
        except Exception as e:
            print(f"  [ERR] {table:<22} : Error ({e})")

    conn.close()
    print("\n[SUCCESS] Database initialization and seeding completed successfully!")

if __name__ == "__main__":
    init_and_seed_db()
