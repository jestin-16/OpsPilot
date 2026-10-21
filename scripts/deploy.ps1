# OpsPilot Production Host Deployment Script
# Run from PowerShell as Administrator in project root (c:\Users\jesvi\OpsPilot or d:\OpsPilot)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  OpsPilot Production Continuous Deploy  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Ensure working directory is repository root
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
Write-Host "[1/6] Working in: $repoRoot" -ForegroundColor Yellow

# 2. Verify .env file exists
if (-not (Test-Path "$repoRoot\.env")) {
    if (Test-Path "$repoRoot\.env.example") {
        Write-Warning ".env file not found! Copying from .env.example..."
        Copy-Item "$repoRoot\.env.example" "$repoRoot\.env"
    } else {
        Write-Error ".env file is missing and no .env.example was found!"
        exit 1
    }
}
Write-Host "[2/6] Environment file (.env) confirmed." -ForegroundColor Green

# 3. Pull latest changes from Git main branch (if in a Git working tree)
try {
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "[3/6] Syncing with Git remote on branch '$currentBranch'..." -ForegroundColor Yellow
    git fetch origin main
    git pull origin main
    Write-Host "      Successfully updated to commit: $(git rev-parse --short HEAD)" -ForegroundColor Green
} catch {
    Write-Warning "      Git pull skipped or failed ($($_.Exception.Message)). Continuing with local files."
}

# 4. Rebuild & start Docker Compose stack
Write-Host "[4/6] Building and starting all Docker Compose containers..." -ForegroundColor Yellow
docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker Compose build/startup failed!"
    exit 1
}

# 5. Verify Cloudflare Tunnel Service
Write-Host "[5/6] Checking Cloudflare Tunnel (Cloudflared) service..." -ForegroundColor Yellow
try {
    $cfService = Get-Service -Name "Cloudflared" -ErrorAction SilentlyContinue
    if ($cfService) {
        if ($cfService.Status -ne "Running") {
            Write-Host "      Starting Cloudflared service..." -ForegroundColor Yellow
            Start-Service -Name "Cloudflared"
        }
        Write-Host "      Cloudflared tunnel service is RUNNING." -ForegroundColor Green
    } else {
        Write-Host "      Cloudflared Windows service not registered. Ensure cloudflared is running in background." -ForegroundColor Yellow
    }
} catch {
    Write-Warning "      Could not inspect Cloudflared service ($($_.Exception.Message))"
}

# 6. Verify Health Status
Write-Host "[6/6] Verifying system readiness..." -ForegroundColor Yellow
$maxAttempts = 15
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    Start-Sleep -Seconds 4
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:80" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        Write-Host "      [$attempt/$maxAttempts] Waiting for OpsPilot Frontend & Gateway..." -ForegroundColor DarkGray
    }
}

if ($healthy) {
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host " Deployment SUCCESSFUL!" -ForegroundColor Green
    Write-Host " OpsPilot is live at: https://opspilot.jestin16.dev" -ForegroundColor Green
    Write-Host " Local Gateway:       http://localhost:8080" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Warning "Deployment finished, but frontend did not respond within timeout. Check 'docker compose logs -f' for details."
}

# Prune old dangling images to preserve disk space
Write-Host "Cleaning up dangling images..." -ForegroundColor DarkGray
docker image prune -f | Out-Null
