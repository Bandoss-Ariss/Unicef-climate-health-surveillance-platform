# ============================================================
#  UNICEF Burkina Faso — Plateforme Climat-Santé
#  Lancement complet de la démonstration (backend + frontend)
#  Usage : npm run demo   (ou clic droit > Exécuter avec PowerShell)
# ============================================================
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host ""
Write-Host "  UNICEF Climat-Sante — demarrage de la demonstration" -ForegroundColor Cyan
Write-Host "  ---------------------------------------------------" -ForegroundColor Cyan

if (-not (Test-Path "$root\node_modules")) {
  Write-Host "  Installation des dependances npm..." -ForegroundColor Yellow
  npm install
}

# Backend FastAPI (optionnel : l'interface fonctionne aussi sans)
Write-Host "  [1/2] Backend FastAPI  -> http://localhost:8000/docs" -ForegroundColor Green
Start-Process -FilePath "python" -ArgumentList "-m","uvicorn","main:app","--port","8000" -WorkingDirectory "$root\server" -WindowStyle Minimized

Start-Sleep -Seconds 2

# Frontend Vite
Write-Host "  [2/2] Frontend React   -> http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  Le navigateur va s'ouvrir automatiquement. Ctrl+C pour arreter." -ForegroundColor Gray
Write-Host ""
npx vite --port 3000 --open
