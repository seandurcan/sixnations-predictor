# ==========================================
# export-project-for-ai.ps1
# ==========================================

Set-Location "C:\Projects\sixnations-predictor"

$ExportFolder = "ai-export"

Write-Host ""
Write-Host "=========================================="
Write-Host " SIX NATIONS AI EXPORT"
Write-Host "=========================================="
Write-Host ""

Write-Host "Working Folder:"
Write-Host (Get-Location).Path
Write-Host ""

# ==========================================
# RECREATE EXPORT FOLDER
# ==========================================

if (Test-Path $ExportFolder) {
    Write-Host "Deleting existing ai-export..."
    Remove-Item $ExportFolder `
        -Recurse `
        -Force
}

Write-Host "Creating ai-export..."
New-Item `
    -Path $ExportFolder `
    -ItemType Directory `
    -Force | Out-Null

if (-not (Test-Path $ExportFolder)) {
    Write-Host "ERROR: Unable to create ai-export."
    exit
}

# ==========================================
# HELPER
# ==========================================

function Add-FileToExport {
    param (
        [string]$OutputFile,
        [string]$FilePath
    )

    if (-not (Test-Path $FilePath)) {
        return
    }

    Write-Host "Adding: $FilePath"

    Add-Content $OutputFile ""
    Add-Content $OutputFile ("=" * 100)
    Add-Content $OutputFile "FILE: $FilePath"
    Add-Content $OutputFile ("=" * 100)
    Add-Content $OutputFile ""

    Get-Content $FilePath |
        Add-Content $OutputFile

    Add-Content $OutputFile ""
}

# ==========================================
# OUTPUT FILES
# ==========================================

$SchemaFile      = Join-Path $ExportFolder "01-schema-and-config.txt"
$AuthFile        = Join-Path $ExportFolder "02-auth.txt"
$PaymentsFile    = Join-Path $ExportFolder "03-payments.txt"
$PredictionsFile = Join-Path $ExportFolder "04-predictions.txt"
$AdminFile       = Join-Path $ExportFolder "05-admin.txt"
$ComponentsFile  = Join-Path $ExportFolder "06-components.txt"

# ==========================================
# 01 SCHEMA + CONFIG
# ==========================================

Write-Host ""
Write-Host "Exporting Schema and Config..."
Write-Host ""

Add-FileToExport $SchemaFile "prisma\schema.prisma"
Add-FileToExport $SchemaFile "package.json"
Add-FileToExport $SchemaFile "tsconfig.json"
Add-FileToExport $SchemaFile "prisma.config.ts"
Add-FileToExport $SchemaFile "next.config.ts"
Add-FileToExport $SchemaFile "next.config.js"
Add-FileToExport $SchemaFile "next.config.mjs"

# ==========================================
# 02 AUTH
# ==========================================

Write-Host ""
Write-Host "Exporting Auth..."
Write-Host ""

Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
Where-Object {
    $_.FullName -match 'login|register|auth|verify-email|forgot-password|reset-password'
} |
ForEach-Object {
    Add-FileToExport $AuthFile $_.FullName
}

Add-FileToExport $AuthFile "src\lib\auth.ts"

# ==========================================
# 03 PAYMENTS
# ==========================================

Write-Host ""
Write-Host "Exporting Payments..."
Write-Host ""

Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
Where-Object {
    $_.FullName -match 'payment|stripe|checkout'
} |
ForEach-Object {
    Add-FileToExport $PaymentsFile $_.FullName
}

Add-FileToExport $PaymentsFile "src\lib\stripe.ts"

# ==========================================
# 04 PREDICTIONS
# ==========================================

Write-Host ""
Write-Host "Exporting Predictions..."
Write-Host ""

Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
Where-Object {
    $_.FullName -match 'prediction|predictions|match|leaderboard'
} |
ForEach-Object {
    Add-FileToExport $PredictionsFile $_.FullName
}

# ==========================================
# 05 ADMIN
# ==========================================

Write-Host ""
Write-Host "Exporting Admin..."
Write-Host ""

Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
Where-Object {
    $_.FullName -match 'admin|audit|dashboard'
} |
ForEach-Object {
    Add-FileToExport $AdminFile $_.FullName
}

# ==========================================
# 06 COMPONENTS
# ==========================================

Write-Host ""
Write-Host "Exporting Components..."
Write-Host ""

Get-ChildItem "src\components" `
    -Recurse `
    -File `
    -Include *.ts,*.tsx |
ForEach-Object {
    Add-FileToExport $ComponentsFile $_.FullName
}

# ==========================================
# SUMMARY
# ==========================================

Write-Host ""
Write-Host "=========================================="
Write-Host " EXPORT COMPLETE"
Write-Host "=========================================="
Write-Host ""

Get-ChildItem $ExportFolder |
Format-Table Name, Length

Write-Host ""
Write-Host "Export Folder:"
Write-Host (Resolve-Path $ExportFolder)
Write-Host ""

# ==========================================
# 07 CORE AUTH
# ==========================================

$CoreAuthFile = Join-Path $ExportFolder "07-core-auth.txt"

Write-Host ""
Write-Host "Exporting Core Auth..."
Write-Host ""

Add-FileToExport `
    $CoreAuthFile `
    "src\app\api\auth\me\route.ts"

Add-FileToExport `
    $CoreAuthFile `
    "src\lib\auth.ts"


# ==========================================
# 08 PREDICTIONS ACCESS
# ==========================================

$PredictionsAccessFile = Join-Path $ExportFolder "08-predictions-access.txt"

Write-Host ""
Write-Host "Exporting Predictions Access..."
Write-Host ""

Add-FileToExport `
    $PredictionsAccessFile `
    "src\app\predictions\page.tsx"

Add-FileToExport `
    $PredictionsAccessFile `
    "src\app\payment-required\page.tsx"

Add-FileToExport `
    $PredictionsAccessFile `
    "src\middleware.ts"