@echo off
setlocal

set "ZIP_NAME=sixnations-snapshot.zip"

echo Creating snapshot of essential project files...

:: Delete existing zip if it exists
if exist "%ZIP_NAME%" del "%ZIP_NAME%"

powershell -Command ^
    $exclude = @('node_modules', '.next', '.git', 'dist', 'build', '%ZIP_NAME%'); ^
    $files = Get-ChildItem -Path '.' -Exclude $exclude; ^
    Compress-Archive -Path $files.FullName -DestinationPath '%ZIP_NAME%' -CompressionLevel Optimal

echo.
if exist "%ZIP_NAME%" (
    echo Success! Created %ZIP_NAME% successfully.
    for %%A in ("%ZIP_NAME%") do echo File size: %%~zA bytes
) else (
    echo Failed to create zip file.
)

pause