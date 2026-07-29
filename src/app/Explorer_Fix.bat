@echo off
echo Stopping Explorer...
taskkill /f /im explorer.exe

echo Clearing icon and thumbnail cache...
del /a /q "%localappdata%\IconCache.db" 2>nul
del /a /f /q "%localappdata%\Microsoft\Windows\Explorer\iconcache*" 2>nul
del /a /f /q "%localappdata%\Microsoft\Windows\Explorer\thumbcache*" 2>nul

timeout /t 2 /nobreak >nul

echo Restarting Explorer...
start explorer.exe

echo Refresh completed.
pause