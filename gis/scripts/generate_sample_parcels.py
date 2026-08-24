import json
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
GEOJSON_DIR = ROOT_DIR / "geojson"

def generate_sample_parcels_geojson():
    print("[*] Generating GeoJSON files for parcels, villages, and project alignment...")
    GEOJSON_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Villages GeoJSON
    villages_fc = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": 1,
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [85.8200, 20.1150],
                        [85.8500, 20.1150],
                        [85.8500, 20.1400],
                        [85.8200, 20.1400],
                        [85.8200, 20.1150]
                    ]]
                },
                "properties": {
                    "village_id": 1,
                    "name": "Pipili",
                    "tahsil": "Pipili",
                    "district": "Khurda",
                    "total_parcels": 24,
                    "high_risk_parcels": 4
                }
            },
            {
                "type": "Feature",
                "id": 2,
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [85.9300, 20.1700],
                        [85.9700, 20.1700],
                        [85.9700, 20.2000],
                        [85.9300, 20.2000],
                        [85.9300, 20.1700]
                    ]]
                },
                "properties": {
                    "village_id": 2,
                    "name": "Balipatna",
                    "tahsil": "Balipatna",
                    "district": "Khurda",
                    "total_parcels": 16,
                    "high_risk_parcels": 2
                }
            }
        ]
    }

    with open(GEOJSON_DIR / "sample_villages.geojson", "w", encoding="utf-8") as f:
        json.dump(villages_fc, f, indent=2)

    # 2. Project Alignment Corridor GeoJSON
    project_fc = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": 1,
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [85.8150, 20.1100],
                        [85.8350, 20.1250],
                        [85.8550, 20.1450],
                        [85.8900, 20.1750],
                        [85.9500, 20.2000]
                    ]
                },
                "properties": {
                    "project_id": 1,
                    "project_name": "Bhubaneswar-Puri Expressway Corridor",
                    "total_length_km": 64.5,
                    "status": "Under Acquisition"
                }
            }
        ]
    }

    with open(GEOJSON_DIR / "sample_project_boundary.geojson", "w", encoding="utf-8") as f:
        json.dump(project_fc, f, indent=2)

    # 3. Parcels GeoJSON (84 parcels)
    base_lat = 20.1228
    base_lng = 85.8335
    parcels_features = []

    for i in range(1, 85):
        row = (i - 1) // 8
        col = (i - 1) % 8
        d_lat = row * 0.0032
        d_lng = col * 0.0035

        # Demo special handling for Case 4 (Plot 142/A, 142/B, 140, 141)
        if i in [10, 11, 12, 13]:
            risk = "High"
            color = "#EF4444"
            delay_prob = 0.84
        elif i in [6, 7, 9, 14, 21, 22, 28, 34, 39, 44, 45, 50, 52, 55, 58, 61, 64, 65, 66, 67, 68, 69]:
            risk = "Medium"
            color = "#F59E0B"
            delay_prob = 0.52
        elif i in [17, 25, 37, 47, 73, 74, 79, 83]:
            risk = "Completed"
            color = "#3B82F6"
            delay_prob = 0.08
        elif i == 84:
            risk = "Insufficient"
            color = "#9CA3AF"
            delay_prob = 0.40
        else:
            risk = "Low"
            color = "#10B981"
            delay_prob = 0.22

        plot_no = f"142/A" if i == 12 else (f"142/B" if i == 13 else f"{100 + i}")
        khata_no = f"312" if i in [12, 13] else f"{200 + (i % 30)}"

        coords = [
            [
                [round(base_lng + d_lng, 6), round(base_lat + d_lat, 6)],
                [round(base_lng + d_lng + 0.0030, 6), round(base_lat + d_lat, 6)],
                [round(base_lng + d_lng + 0.0028, 6), round(base_lat + d_lat + 0.0028, 6)],
                [round(base_lng + d_lng, 6), round(base_lat + d_lat + 0.0028, 6)],
                [round(base_lng + d_lng, 6), round(base_lat + d_lat, 6)]
            ]
        ]

        feature = {
            "type": "Feature",
            "id": i,
            "geometry": {
                "type": "Polygon",
                "coordinates": coords
            },
            "properties": {
                "id": i,
                "plot_number": plot_no,
                "khata_number": khata_no,
                "village_name": "Pipili",
                "district": "Khurda",
                "area_acres": round(1.5 + (i % 5) * 0.8, 2),
                "land_type": "Homestead" if i % 4 == 0 else "Agricultural",
                "risk_level": risk,
                "risk_color": color,
                "delay_probability": delay_prob,
                "case_id": 4 if i in [10, 11, 12, 13, 14, 15, 84] else ((i % 30) + 1),
                "case_number": "CASE-OD-2026-004" if i in [10, 11, 12, 13, 14, 15, 84] else f"CASE-OD-2026-{(i % 30) + 1:03d}",
                "project_name": "Bhubaneswar-Puri Expressway Corridor",
                "compensation_stage": "Approval pending" if i in [12, 13] else ("Payment completed" if risk == "Completed" else "Valuation completed"),
                "compensation_amount": 7000000.0 if i in [12, 13] else 4500000.0,
                "owners_count": 2 if i == 12 else 1
            }
        }
        parcels_features.append(feature)

    parcels_fc = {
        "type": "FeatureCollection",
        "features": parcels_features
    }

    with open(GEOJSON_DIR / "sample_parcels.geojson", "w", encoding="utf-8") as f:
        json.dump(parcels_fc, f, indent=2)

    print(f"[SUCCESS] Saved 84 parcel geometries to: {GEOJSON_DIR / 'sample_parcels.geojson'}")

if __name__ == "__main__":
    generate_sample_parcels_geojson()
