@echo off
cd /d "%~dp0"
echo [%date% %time%] Checking dashboard startup... >> autostart.log

netstat -ano | findstr ":3000" | findstr "LISTENING" > nul
if %errorlevel%==0 (
  echo [%date% %time%] Port 3000 is already running. >> autostart.log
  exit /b 0
)

echo [%date% %time%] Starting dashboard on port 3000... >> autostart.log

if exist "C:\Program Files\nodejs\npm.cmd" (
  "C:\Program Files\nodejs\npm.cmd" run dev >> dev-server.out.log 2>> dev-server.err.log
) else (
  npm.cmd run dev >> dev-server.out.log 2>> dev-server.err.log
)
