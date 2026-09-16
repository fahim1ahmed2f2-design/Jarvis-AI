@echo off
title Install JARVIS 24x7 Autostart
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_SCRIPT=%TEMP%\CreateShortcut.vbs

echo Creating Startup Shortcut for JARVIS 24x7...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SHORTCUT_SCRIPT%"
echo sLinkFile = "%STARTUP_FOLDER%\JARVIS_24x7.lnk" >> "%SHORTCUT_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SHORTCUT_SCRIPT%"
echo oLink.TargetPath = "%~dp0start_jarvis_silent.vbs" >> "%SHORTCUT_SCRIPT%"
echo oLink.WorkingDirectory = "%~dp0" >> "%SHORTCUT_SCRIPT%"
echo oLink.Description = "JARVIS AI 24x7 Background Assistant" >> "%SHORTCUT_SCRIPT%"
echo oLink.Save >> "%SHORTCUT_SCRIPT%"

cscript //nologo "%SHORTCUT_SCRIPT%"
del "%SHORTCUT_SCRIPT%"

echo JARVIS Autostart installed successfully!
pause
