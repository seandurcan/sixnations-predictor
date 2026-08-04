@echo off
setlocal

echo.
echo =====================================
echo SIX NATIONS PROJECT ZIP CREATOR
echo =====================================
echo.

set ZIPFILE=sixnations-predictor-export.zip

echo Current folder:
echo %CD%
echo.

if exist "%ZIPFILE%" (
    echo Existing ZIP found.
    echo Deleting %ZIPFILE%
    del "%ZIPFILE%"
    echo.
)

echo Checking source items...
echo.

if exist src (
    echo [OK] src
) else (
    echo [MISSING] src
)

if exist prisma (
    echo [OK] prisma
) else (
    echo [MISSING] prisma
)

if exist package.json (
    echo [OK] package.json
) else (
    echo [MISSING] package.json
)

if exist package-lock.json (
    echo [OK] package-lock.json
) else (
    echo [MISSING] package-lock.json
)

if exist tsconfig.json (
    echo [OK] tsconfig.json
) else (
    echo [MISSING] tsconfig.json
)

if exist next.config.js (
    echo [OK] next.config.js
)

if exist next.config.ts (
    echo [OK] next.config.ts
)

if exist next.config.mjs (
    echo [OK] next.config.mjs
)

echo.
echo Creating ZIP...
echo.

powershell -NoProfile -ExecutionPolicy Bypass ^
"try {
    Compress-Archive -Path @(
        'src',
        'prisma',
        'package.json',
        'package-lock.json',
        'tsconfig.json'
    ) -DestinationPath '%ZIPFILE%' -Force;
    Write-Host 'ZIP creation completed.';
}
catch {
    Write-Host 'ERROR:';
    Write-Host $_;
    exit 1;
}"

echo.
echo =====================================
echo RESULTS
echo =====================================

if exist "%ZIPFILE%" (
    echo SUCCESS
    echo.
    echo ZIP CREATED:
    echo %CD%\%ZIPFILE%
) else (
    echo FAILED
    echo ZIP file was not created.
)

echo.
pause