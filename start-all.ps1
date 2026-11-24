# CODE RED - SUSTAINIQ Application Launcher
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Launching CODE RED - SUSTAINIQ Full-Stack Platform" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; & '.\.venv\Scripts\Activate.ps1'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "Backend API:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API Docs:     http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Frontend App: http://localhost:3000" -ForegroundColor Green
Write-Host ""
