Echo Use .\export-project-for-ai.ps1 to run the powershell script in AI and from folder "C:\Projects\sixnations-predictor"


Pause

@echo off
setlocal

set OUTPUT=project-export.txt

echo =====================================
echo STARTING EXPORT
echo =====================================
echo.

echo Current folder:
echo %CD%
echo.

if exist "%OUTPUT%" (
    echo Deleting old export...
    del "%OUTPUT%"
)

echo Creating new export file...
echo Export created on %DATE% %TIME%>"%OUTPUT%"

echo.
echo Processing SRC files...
echo.

for /r src %%f in (*.ts *.tsx *.js *.jsx *.json) do (
    echo Adding: %%f
    echo.>>"%OUTPUT%"
    echo ============================================================>>"%OUTPUT%"
    echo FILE: %%f>>"%OUTPUT%"
    echo ============================================================>>"%OUTPUT%"
    type "%%f">>"%OUTPUT%"
)

echo.
echo Processing PRISMA files...
echo.

for /r prisma %%f in (*) do (
    echo Adding: %%f
    echo.>>"%OUTPUT%"
    echo ============================================================>>"%OUTPUT%"
    echo FILE: %%f>>"%OUTPUT%"
    echo ============================================================>>"%OUTPUT%"
    type "%%f">>"%OUTPUT%" 2>nul
)

echo.
echo Processing root files...
echo.

for %%f in (
    package.json
    package-lock.json
    tsconfig.json
    prisma.config.ts
) do (
    if exist "%%f" (
        echo Adding: %%f
        echo.>>"%OUTPUT%"
        echo ============================================================>>"%OUTPUT%"
        echo FILE: %%f>>"%OUTPUT%"
        echo ============================================================>>"%OUTPUT%"
        type "%%f">>"%OUTPUT%"
    ) else (
        echo Missing: %%f
    )
)

echo.
echo =====================================
echo FINISHED
echo =====================================
echo.

dir "%OUTPUT%"

echo.
pause