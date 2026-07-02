@echo off
REM Double-clickable installer for Windows — runs install.ps1 with an execution-policy bypass.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
echo.
pause
