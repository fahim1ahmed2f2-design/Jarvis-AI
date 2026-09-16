@echo off
title JARVIS AI System Launcher
cd /d "%~dp0"

echo ====================================================================
echo                   JARVIS AI AUTONOMOUS SYSTEM
echo                (ChatGPT-5 Level Intelligence Engine)
echo ====================================================================
echo.

:: 1. Locate Python in .venv or system
if exist .venv\Scripts\python.exe (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
    echo [INFO] Using Virtual Environment Python: %PYTHON_EXE%
) else (
    set "PYTHON_EXE=python"
    echo [INFO] Using System Python
)

:: 2. Auto-kill any old process holding port 8000
echo.
echo [1/3] Checking Port 8000 availability...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
echo [OK] Port 8000 is ready.

:: 3. Launch browser
echo.
echo [2/3] Opening JARVIS 3D HUD Interface in browser...
start http://localhost:8000

:: 4. Start Server
echo.
echo [3/3] Starting JARVIS AI Server on http://127.0.0.1:8000 ...
echo --------------------------------------------------------------------
echo Press Ctrl+C in this window anytime to stop JARVIS.
echo --------------------------------------------------------------------
echo.

"%PYTHON_EXE%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server exited with code %errorlevel%.
    pause
)
