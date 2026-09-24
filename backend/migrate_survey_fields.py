import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "database" / "bhoomisetu.db"

def migrate():
    print(f"Connecting to database at {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(survey_field_observations)")
    existing_cols = {row[1] for row in cursor.fetchall()}
    print(f"Existing columns in survey_field_observations: {len(existing_cols)}")

    new_columns = [
        # Ownership Dispute
        ("has_ownership_dispute", "BOOLEAN DEFAULT 0"),
        ("dispute_nature", "VARCHAR(100)"),
        ("dispute_parties", "TEXT"),
        ("dispute_details", "TEXT"),
        ("dispute_remarks", "TEXT"),
        # Court Case / Legal Dispute
        ("has_court_case", "BOOLEAN DEFAULT 0"),
        ("court_case_number", "VARCHAR(100)"),
        ("court_name", "VARCHAR(150)"),
        ("court_parties", "TEXT"),
        ("court_case_description", "TEXT"),
        ("court_case_status", "VARCHAR(50)"),
        ("court_case_remarks", "TEXT"),
        # Structure / Project on Land
        ("has_structure_or_project", "BOOLEAN DEFAULT 0"),
        ("structure_type", "VARCHAR(100)"),
        ("structure_description", "TEXT"),
        ("structure_location", "TEXT"),
        ("structure_remarks", "TEXT")
    ]

    added = 0
    for col_name, col_type in new_columns:
        if col_name not in existing_cols:
            query = f"ALTER TABLE survey_field_observations ADD COLUMN {col_name} {col_type}"
            cursor.execute(query)
            print(f"  Added column: {col_name} ({col_type})")
            added += 1
        else:
            print(f"  Column already exists: {col_name}")

    conn.commit()
    conn.close()
    print(f"Migration completed successfully. Added {added} columns.")

if __name__ == "__main__":
    migrate()
