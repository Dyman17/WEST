@echo off
setlocal

set "ROOT_DIR=%~dp0"
for %%I in ("%ROOT_DIR%") do set "ROOT_DIR=%%~fI"

cd /d "%ROOT_DIR%"

echo Building WEST...
call npm.cmd run build
if errorlevel 1 exit /b %errorlevel%

echo Starting WEST...
call node server.js
