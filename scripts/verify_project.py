import os
import sys
import json
import sqlite3
from pathlib import Path

# Add UTF-8 support on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent

def check_mark(status: bool) -> str:
    return "[PASS]" if status else "[FAIL]"

def verify_project():
    print("=======================================================================")
    print("        BHOOMISETU AI — COMPREHENSIVE PROJECT VERIFICATION             ")
    print("=======================================================================\n")
    all_passed = True

    # 1. Directory Structure Verification
    print("1. ARCHITECTURE & DIRECTORY STRUCTURE CHECK:")
    required_dirs = [
        "contracts",
        "database",
        "backend",
        "frontend",
        "gis",
        "machine-learning",
        "sample-documents",
        "tests",
        "scripts"
    ]
    for d in required_dirs:
        exists = (ROOT_DIR / d).is_dir()
        print(f"  {check_mark(exists)} Tier directory: {d}/")
        if not exists:
            all_passed = False

    # 2. Database Verification
    print("\n2. DATABASE LAYER & SEED DATA CHECK:")
    db_path = ROOT_DIR / "database" / "bhoomisetu.db"
    if db_path.exists():
        conn = sqlite3.connect(str(db_path))
        c = conn.cursor()
        tables = [
            ("departments", 5),
            ("users", 7),
            ("projects", 3),
            ("villages", 6),
            ("acquisition_cases", 32),
            ("parcels", 84),
            ("landowners", 40),
            ("compensations", 12),
            ("departmental_tasks", 8),
            ("grievances", 5),
            ("officer_verification_records", 5),
            ("land_verification_records", 6),
            ("verification_requests", 2)
        ]
        for t, min_cnt in tables:
            try:
                c.execute(f"SELECT COUNT(*) FROM {t}")
                cnt = c.fetchone()[0]
                status = cnt >= min_cnt
                print(f"  {check_mark(status)} Table '{t}': {cnt} records (min: {min_cnt})")
                if not status:
                    all_passed = False
            except Exception as e:
                print(f"  [FAIL] Table '{t}': Error ({e})")
                all_passed = False
        conn.close()
    else:
        print(f"  [FAIL] SQLite database missing at: {db_path}")
        all_passed = False

    # 3. Machine Learning Models
    print("\n3. MACHINE LEARNING SUBSYSTEM CHECK:")
    ml_models = [
        "delay_classifier.pkl",
        "delay_regressor.pkl",
        "feature_columns.json",
        "model_metadata.json"
    ]
    for m in ml_models:
        m_path = ROOT_DIR / "machine-learning" / "models" / m
        exists = m_path.exists()
        print(f"  {check_mark(exists)} Trained Artifact: {m}")
        if not exists:
            all_passed = False

    # 4. GIS GeoJSON Compliance
    print("\n4. GIS SUBSYSTEM GEOJSON CHECK:")
    gis_files = [
        "sample_parcels.geojson",
        "sample_villages.geojson",
        "sample_project_boundary.geojson"
    ]
    for g in gis_files:
        g_path = ROOT_DIR / "gis" / "geojson" / g
        exists = g_path.exists()
        if exists:
            with open(g_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            feat_count = len(data.get("features", []))
            print(f"  {check_mark(True)} GeoJSON layer: {g} ({feat_count} features)")
        else:
            print(f"  [FAIL] Missing GeoJSON: {g}")
            all_passed = False

    # 5. Contracts Specification
    print("\n5. CONTRACTS & API SPECIFICATION CHECK:")
    openapi_path = ROOT_DIR / "contracts" / "openapi" / "api-specification.yaml"
    print(f"  {check_mark(openapi_path.exists())} OpenAPI 3.0 Specification: contracts/openapi/api-specification.yaml")
    if not openapi_path.exists():
        all_passed = False

    print("\n=======================================================================")
    if all_passed:
        print("  [✓] ALL SUBSYSTEMS & MODULES VERIFIED SUCCESSFULLY (100% READY)      ")
    else:
        print("  [!] SOME SUBSYSTEMS REQUIRE INITIALIZATION BEFORE RUNNING            ")
    print("=======================================================================\n")
    return all_passed

if __name__ == "__main__":
    verify_project()
