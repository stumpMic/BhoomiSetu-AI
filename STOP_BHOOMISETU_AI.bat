@echo off
title BhoomiSetu AI - Stop Services
color 0C

echo =======================================================================
echo               BHOOMISETU AI - STOPPING ALL SERVICES                   
echo =======================================================================
echo.

echo Stopping BhoomiSetu AI backend and frontend processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>nul
)

echo [OK] All BhoomiSetu AI services have been stopped.
echo.
pause
