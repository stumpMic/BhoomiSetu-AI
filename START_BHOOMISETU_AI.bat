@echo off
cd /d "%~dp0"
title BhoomiSetu AI

echo Starting BhoomiSetu AI...

:: Start Backend API Server in background
start "BhoomiSetu-Backend" /min cmd /c "C:\Users\HP\python311\python.exe -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000"

:: Start Frontend Web Server in background
start "BhoomiSetu-Frontend" /min cmd /c "cd /d "%~dp0frontend" && npm.cmd run dev -- --host 0.0.0.0 --port 5173"

:: Wait 2 seconds for services to initialize
timeout /t 2 /nobreak >nul

:: Direct open website in default browser
start http://localhost:5173/

exit
