"""
BhoomiSetu AI - Launcher Generator Utility
Generates clean native Windows launchers (batch and VBS) without triggering SmartScreen/Defender.
"""
import os
from pathlib import Path

def generate_launchers():
    root = Path(__file__).resolve().parent.parent
    
    stop_bat = """@echo off
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
"""
    with open(root / "STOP_BHOOMISETU_AI.bat", "w", encoding="utf-8") as f:
        f.write(stop_bat)

    vbs_launcher = '''Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Start Backend API Server
WshShell.Run "cmd.exe /c cd /d """ & strPath & """ && C:\\Users\\HP\\python311\\python.exe -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000", 0, False

' 2. Start Frontend Web Interface
WshShell.Run "cmd.exe /c cd /d """ & strPath & "\\frontend"" && npm.cmd run dev -- --host 0.0.0.0 --port 5173", 0, False

' 3. Wait 3 seconds
WScript.Sleep 3000

' 4. Open Default Web Browser
WshShell.Run "http://localhost:5173"
'''
    with open(root / "START_BHOOMISETU_SILENT.vbs", "w", encoding="utf-8") as f:
        f.write(vbs_launcher)

    print("[SUCCESS] STOP_BHOOMISETU_AI.bat and START_BHOOMISETU_SILENT.vbs generated successfully.")
    
    # Create Desktop Shortcut
    try:
        desktop_dir = Path(os.environ.get("USERPROFILE", "C:\\Users\\HP")) / "Desktop"
        if desktop_dir.exists():
            shortcut_script = f'''Set WshShell = CreateObject("WScript.Shell")
Set shortcut = WshShell.CreateShortcut("{desktop_dir}\\Launch BhoomiSetu AI.lnk")
shortcut.TargetPath = "{root}\\START_BHOOMISETU_AI.bat"
shortcut.WorkingDirectory = "{root}"
shortcut.WindowStyle = 1
shortcut.Description = "Launch BhoomiSetu AI Web Application"
shortcut.IconLocation = "shell32.dll,220"
shortcut.Save

Set silentShortcut = WshShell.CreateShortcut("{desktop_dir}\\Launch BhoomiSetu AI (Silent).lnk")
silentShortcut.TargetPath = "{root}\\START_BHOOMISETU_SILENT.vbs"
silentShortcut.WorkingDirectory = "{root}"
silentShortcut.WindowStyle = 1
silentShortcut.Description = "Launch BhoomiSetu AI Web Application Silently"
silentShortcut.IconLocation = "shell32.dll,14"
silentShortcut.Save
'''
            temp_vbs = root / "scripts" / "_temp_shortcut.vbs"
            with open(temp_vbs, "w", encoding="utf-8") as f:
                f.write(shortcut_script)
            os.system(f'cscript //nologo "{temp_vbs}"')
            if temp_vbs.exists():
                temp_vbs.unlink()
            print("[SUCCESS] Desktop shortcuts created successfully on Windows Desktop!")
    except Exception as e:
        print(f"[NOTE] Could not create desktop shortcut automatically: {e}")

if __name__ == "__main__":
    generate_launchers()

