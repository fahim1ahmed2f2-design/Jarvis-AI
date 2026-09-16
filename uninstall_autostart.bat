@echo off
title Uninstall JARVIS 24x7 Autostart
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
if exist "%STARTUP_FOLDER%\JARVIS_24x7.lnk" (
    del "%STARTUP_FOLDER%\JARVIS_24x7.lnk"
    echo Removed JARVIS from Windows Startup.
) else (
    echo JARVIS startup shortcut was not found.
)
pause
