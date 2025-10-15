# install-ckeditor-custom.ps1
# Usage: run from repository root or from the frontend folder.
# It will pack frontend/ckeditor-custom and install the resulting tgz into the frontend project.

param(
  [string]$FrontendDir = "${PWD}\frontend"
)

Set-StrictMode -Version Latest

try {
  # Ensure frontend/ckeditor-custom/build exists
  $pkgDir = Join-Path $FrontendDir 'ckeditor-custom'
  if (-not (Test-Path $pkgDir)) {
    Write-Error "Package folder not found: $pkgDir"
    exit 1
  }
  if (-not (Test-Path (Join-Path $pkgDir 'build\ckeditor.js'))) {
    Write-Host "Warning: build/ckeditor.js not found in $pkgDir. Place the online-builder output into the build/ folder before running this script." -ForegroundColor Yellow
  }

  Push-Location $pkgDir
  Write-Host "Packing $pkgDir..."
  $out = npm pack 2>&1
  # npm pack prints the created filename; find the .tgz line
  $tgz = ($out | Where-Object { $_ -match '\.tgz$' } | Select-Object -Last 1).ToString().Trim()
  if (-not $tgz) {
    Write-Error "npm pack did not produce a .tgz file. Output:\n$out"
    Pop-Location
    exit 1
  }
  $tgzPath = Join-Path (Get-Location) $tgz
  Pop-Location

  Write-Host "Installing $tgzPath into frontend..."
  Push-Location $FrontendDir
  npm install --no-save $tgzPath
  $rc = $LASTEXITCODE
  Pop-Location

  if ($rc -ne 0) {
    Write-Error "npm install failed with exit code $rc"
    exit $rc
  }

  Write-Host "Installed $tgzPath successfully. Restart your dev server to use the custom build." -ForegroundColor Green
  exit 0
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
