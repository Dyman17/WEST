@echo off
setlocal

set "ROOT_DIR=%~dp0.."
for %%I in ("%ROOT_DIR%") do set "ROOT_DIR=%%~fI"

start "WEST backend" cmd /k "cd /d ""%ROOT_DIR%"" && npm --prefix backend start"
start "WEST frontend" cmd /k "cd /d ""%ROOT_DIR%"" && npm --prefix frontend start"

echo WEST stack launched.
echo Backend: http://localhost:8787/api/health
echo Frontend: http://localhost:3000 or next free port
