@echo off
setlocal EnableExtensions

title Perfect XV Layout Updater

echo ============================================================
echo PERFECT XV - PREDICTIONS REFERENCE LAYOUT
echo ============================================================
echo.
echo This will update only:
echo   src\app\dashboard\page.tsx
echo   src\app\admin\dashboard\page.tsx
echo   src\app\admin\page.tsx
echo   src\app\admin\audit\page.tsx
echo.
echo PageContainer, Predictions and Leaderboard will not change.
echo.

set "SCRIPT=%~dp0apply_predictions_reference_layout.py"
set "PROJECT=C:\Projects\sixnations-predictor"

if not exist "%SCRIPT%" (
    echo ERROR: Python script not found:
    echo %SCRIPT%
    echo.
    pause
    exit /b 1
)

if not exist "%PROJECT%" (
    echo ERROR: Project folder not found:
    echo %PROJECT%
    echo.
    pause
    exit /b 1
)

set "PYTHON_CMD="

where py.exe >nul 2>&1
if not errorlevel 1 set "PYTHON_CMD=py.exe -3"

if not defined PYTHON_CMD (
    where python.exe >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=python.exe"
)

if not defined PYTHON_CMD (
    for %%P in (
        "%LocalAppData%\Programs\Python\Python313\python.exe"
        "%LocalAppData%\Programs\Python\Python312\python.exe"
        "%LocalAppData%\Programs\Python\Python311\python.exe"
        "%ProgramFiles%\Python313\python.exe"
        "%ProgramFiles%\Python312\python.exe"
        "%ProgramFiles%\Python311\python.exe"
    ) do (
        if exist "%%~P" (
            set "PYTHON_CMD=%%~P"
            goto :python_found
        )
    )
)

:python_found
if not defined PYTHON_CMD (
    echo ERROR: A working Python installation could not be found.
    echo.
    echo Try this command in Command Prompt:
    echo   py --version
    echo.
    pause
    exit /b 1
)

echo Using:
echo   %PYTHON_CMD%
echo.
%PYTHON_CMD% "%SCRIPT%" "%PROJECT%"

if errorlevel 1 (
    echo.
    echo The update did not complete.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo UPDATE COMPLETE
echo ============================================================
echo.
echo Backups use the extension:
echo   .predictions-reference.bak
echo.
pause
exit /b 0
