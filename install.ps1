# Parrot Desktop - Windows Auto-Installer Script
# Usage: iwr -useb https://raw.githubusercontent.com/goyalaakarsh/parrot/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  [+] Parrot Desktop Auto-Installer" -ForegroundColor Green
Write-Host "  ==================================" -ForegroundColor DarkGray
Write-Host ""

$repo = "goyalaakarsh/parrot"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"

Write-Host "[*] Checking latest release from GitHub..." -ForegroundColor Cyan

try {
    $headers = @{ "User-Agent" = "Parrot-Installer" }
    $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers
    $latestVersion = $release.tag_name
    Write-Host "[+] Latest version found: $latestVersion" -ForegroundColor Yellow
}
catch {
    Write-Host "[-] Failed to fetch release details from GitHub." -ForegroundColor Red
    exit 1
}

$msiAsset = $release.assets | Where-Object { $_.name -like "*.msi" } | Select-Object -First 1

if ($msiAsset) {
    $downloadUrl = $msiAsset.browser_download_url
    $tempInstaller = Join-Path $env:TEMP $msiAsset.name
    
    Write-Host "[*] Downloading installer: $($msiAsset.name)..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempInstaller -UseBasicParsing

    Write-Host "[*] Installing Parrot quietly..." -ForegroundColor Cyan
    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $tempInstaller, "/qn", "/norestart" -Wait -PassThru

    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "[+] Parrot $latestVersion installed successfully!" -ForegroundColor Green
        Write-Host "[+] Launch 'Parrot' from your Start Menu or press Ctrl+Shift+Space!" -ForegroundColor Yellow
        Write-Host ""
    }

    Remove-Item $tempInstaller -ErrorAction SilentlyContinue
}

if (-not $msiAsset) {
    Write-Host ""
    Write-Host "[+] Latest Release Tag: $latestVersion" -ForegroundColor Green
    Write-Host "[*] View release page: https://github.com/$repo/releases/tag/$latestVersion" -ForegroundColor Yellow
    Write-Host ""
}
