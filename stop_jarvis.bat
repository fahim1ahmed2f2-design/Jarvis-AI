@echo off
title Stop JARVIS System
echo Stopping JARVIS backend and freeing Port 8000...
powershell -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul
echo [OK] JARVIS stopped and Port 8000 freed successfully.
pause
