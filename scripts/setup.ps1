# ==============================================================================
# BhoomiSetu AI — Automated Local Setup & Demonstration Launcher (Windows)
# ==============================================================================

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  BhoomiSetu AI — Predictive Land Acquisition Analytics System        " -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan

$PythonExe = "C:\Users\HP\python311\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

# 1. Initialize & Seed Database
Write-Host "`n[1/4] Initializing and Seeding Database..." -ForegroundColor Green
& $PythonExe scripts/seed_demo_data.py

# 2. Train and verify ML Models
Write-Host "`n[2/4] Verifying Machine Learning Subsystem..." -ForegroundColor Green
& $PythonExe machine-learning/src/evaluate.py

# 3. Validate GIS GeoJSON layers
Write-Host "`n[3/4] Validating GIS GeoJSON Layers..." -ForegroundColor Green
& $PythonExe gis/scripts/validate_geojson.py

# 4. Multi-tier Project Verification
Write-Host "`n[4/4] Running Multi-Tier System Verification..." -ForegroundColor Green
& $PythonExe scripts/verify_project.py

Write-Host "`n=======================================================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE! TO RUN THE APPLICATION:                              " -ForegroundColor Yellow
Write-Host "  Backend:  & '$PythonExe' -m uvicorn app.main:app --app-dir backend --reload --port 8000" -ForegroundColor White
Write-Host "  Frontend: npm.cmd run dev (in frontend/ directory)" -ForegroundColor White
Write-Host "=======================================================================" -ForegroundColor Cyan
