@echo off
title JARVIS AI 24x7 Autonomous Supervisor
cd /d "%~dp0"

echo ====================================================================
echo                   JARVIS AI 24x7 SUPERVISOR
echo                (ChatGPT-5 Level Intelligence Engine)
echo ====================================================================
echo.

if exist .venv\Scripts\python.exe (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

echo [INFO] Starting Watchdog Supervisor...
start http://localhost:8000
"%PYTHON_EXE%" backend\watchdog.py
pause
