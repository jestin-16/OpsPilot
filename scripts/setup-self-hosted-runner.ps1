<#
.SYNOPSIS
    Installs and registers a GitHub Actions Self-Hosted Runner on Windows for OpsPilot.
.DESCRIPTION
    Run this script on your host laptop (the one hosting OpsPilot and Cloudflare Tunnel).
    It downloads the runner binaries, prompts for your GitHub registration token,
    configures the runner, and installs it as a persistent Windows Service.
.EXAMPLE
    .\scripts\setup-self-hosted-runner.ps1
#>

param(
    [string]$RepoUrl = "https://github.com/jestin-16/OpsPilot",
    [string]$RunnerToken = ""
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  OpsPilot GitHub Actions Self-Hosted Runner Setup (Win)  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$runnerDir = "C:\actions-runner"
if (-not (Test-Path $runnerDir)) {
    New-Item -ItemType Directory -Path $runnerDir -Force | Out-Null
}
Set-Location $runnerDir

if (-not $RunnerToken) {
    Write-Host "`nTo register this machine as a runner, obtain a token from GitHub:" -ForegroundColor Yellow
    Write-Host "1. Open https://github.com/jestin-16/OpsPilot/settings/actions/runners/new?arch=x64&os=win" -ForegroundColor White
    Write-Host "2. Copy the token generated under 'Configure'`n" -ForegroundColor White
    $RunnerToken = Read-Host "Paste your GitHub Actions Runner Token here"
}

if (-not $RunnerToken) {
    Write-Error "Runner Token cannot be empty!"
    exit 1
}

# Download latest Windows runner package if not already downloaded
$runnerPkg = "$runnerDir\actions-runner-win-x64.zip"
$runnerVersion = "2.338.0"
Write-Host "Downloading GitHub Actions Runner v$runnerVersion..." -ForegroundColor Yellow
$downloadUrl = "https://github.com/actions/runner/releases/download/v$runnerVersion/actions-runner-win-x64-$runnerVersion.zip"
curl.exe -L -o $runnerPkg $downloadUrl
Write-Host "Extracting runner files..." -ForegroundColor Yellow
Expand-Archive -Path $runnerPkg -DestinationPath $runnerDir -Force
Remove-Item $runnerPkg -Force

# If an existing runner config exists, remove it first
if (Test-Path "$runnerDir\.runner") {
    Write-Host "Existing runner configuration detected. Removing it first..." -ForegroundColor Yellow
    & .\config.cmd remove --token $RunnerToken
}

# Configure runner with Windows service
Write-Host "Configuring runner against $RepoUrl with Windows Service..." -ForegroundColor Yellow
& .\config.cmd --url $RepoUrl --token $RunnerToken --name "opspilot-host-laptop" --work "_work" --labels "self-hosted,windows,x64,opspilot-prod" --unattended --replace --runasservice


Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Runner successfully installed and running as a service!  " -ForegroundColor Green
Write-Host " OpsPilot CI/CD will now auto-deploy on every push to main!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
