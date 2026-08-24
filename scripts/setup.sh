#!/usr/bin/env bash
# ==============================================================================
# BhoomiSetu AI — Automated Setup & Verification Script (Linux/macOS)
# ==============================================================================

set -e

echo "======================================================================="
echo "  BhoomiSetu AI — Predictive Land Acquisition Analytics System        "
echo "======================================================================="

# 1. Initialize & Seed Database
echo -e "\n[1/4] Initializing and Seeding Database..."
python3 scripts/seed_demo_data.py

# 2. Train and verify ML Models
echo -e "\n[2/4] Verifying Machine Learning Subsystem..."
python3 machine-learning/src/evaluate.py

# 3. Validate GIS GeoJSON layers
echo -e "\n[3/4] Validating GIS GeoJSON Layers..."
python3 gis/scripts/validate_geojson.py

# 4. Multi-tier Project Verification
echo -e "\n[4/4] Running Multi-Tier System Verification..."
python3 scripts/verify_project.py

echo -e "\n======================================================================="
echo "  SETUP COMPLETE! TO RUN THE APPLICATION:                              "
echo "  Backend:  python3 -m uvicorn app.main:app --app-dir backend --reload --port 8000"
echo "  Frontend: cd frontend && npm run dev"
echo "======================================================================="
