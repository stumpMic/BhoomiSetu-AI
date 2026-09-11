Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Start Backend API Server
WshShell.Run "cmd.exe /c cd /d """ & strPath & """ && C:\Users\HP\python311\python.exe -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000", 0, False

' 2. Start Frontend Web Interface
WshShell.Run "cmd.exe /c cd /d """ & strPath & "\frontend"" && npm.cmd run dev -- --host 0.0.0.0 --port 5173", 0, False

' 3. Wait 3 seconds
WScript.Sleep 3000

' 4. Open Default Web Browser
WshShell.Run "http://localhost:5173"
