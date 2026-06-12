@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "FRONTEND_ROOT=%%~fI"
for %%I in ("%FRONTEND_ROOT%\..\backend") do set "BACKEND_ROOT=%%~fI"

start "WEST backend" cmd /k "cd /d ""%BACKEND_ROOT%"" && node scripts/start.mjs"
start "WEST frontend" cmd /k "cd /d ""%FRONTEND_ROOT%"" && node dist\index.js"

echo WEST stack launched.
echo Backend: http://localhost:8787/api/health
echo Frontend: http://localhost:3000 or next free port
