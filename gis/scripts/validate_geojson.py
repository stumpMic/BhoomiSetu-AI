import json
import sys
from pathlib import Path

# Set UTF-8 encoding for standard output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent
GEOJSON_DIR = ROOT_DIR / "geojson"

def validate_geojson_files():
    print("[*] Validating GIS GeoJSON layers compliance...")
    files = ["sample_parcels.geojson", "sample_villages.geojson", "sample_project_boundary.geojson"]
    all_valid = True

    for filename in files:
        file_path = GEOJSON_DIR / filename
        if not file_path.exists():
            print(f"  [MISSING] {filename}")
            all_valid = False
            continue

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if data.get("type") != "FeatureCollection":
                print(f"  [FAIL] {filename}: Root is not FeatureCollection")
                all_valid = False
                continue

            features = data.get("features", [])
            print(f"  [OK] {filename:<32}: Valid FeatureCollection ({len(features)} features)")
        except Exception as e:
            print(f"  [ERR] {filename}: Invalid JSON ({e})")
            all_valid = False

    if all_valid:
        print("[SUCCESS] All GIS GeoJSON layers validated successfully!")
    return all_valid

if __name__ == "__main__":
    validate_geojson_files()
