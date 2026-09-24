@echo off
setlocal enabledelayedexpansion
title BhoomiSetu AI - Server Launcher
color 0A

echo =======================================================================
echo          BHOOMISETU AI - ADVANCED LAND ACQUISITION SYSTEM             
echo =======================================================================
echo.

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:: Detect Python
set "PYTHON_EXE=C:\Users\HP\python311\python.exe"
if not exist "!PYTHON_EXE!" (
    set "PYTHON_EXE=python"
)

:: Detect npm
set "NPM_CMD=npm.cmd"
where npm.cmd >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
    )
)

echo [1/3] Starting Backend API Server (FastAPI on port 8000)...
start "BhoomiSetu AI - Backend Server" /min cmd /c "cd /d ""%PROJECT_DIR%"" && ""!PYTHON_EXE!"" -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000"

echo [2/3] Starting Frontend Web Interface (Vite React on port 5173)...
start "BhoomiSetu AI - Frontend Server" /min cmd /c "cd /d ""%PROJECT_DIR%frontend"" && ""!NPM_CMD!"" run dev -- --host 0.0.0.0 --port 5173"

echo.
echo [3/3] Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo.
echo =======================================================================
echo   Services are running!
echo   * Backend API:  http://localhost:8000/api/health
echo   * Web Portal:   http://localhost:5173/
echo =======================================================================
echo.
echo Opening BhoomiSetu AI in your browser...
start http://localhost:5173/

echo.
echo =======================================================================
echo [INFO] BhoomiSetu AI is active!
echo Keep this window or the minimized server windows open while working.
echo To stop all services, run STOP_BHOOMISETU_AI.bat
echo =======================================================================
echo.
pause
