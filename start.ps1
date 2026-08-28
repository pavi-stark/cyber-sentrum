Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "    CYBER SENTRY: AI FAKE IDENTITY & DOCUMENT SCREENING SYSTEM" -ForegroundColor Green
Write-Host "    Smart India Hackathon 2026 - Problem Statement #26188" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Launching Backend (FastAPI) on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python run.py"

Write-Host "[2/2] Launching Frontend (React + Vite) on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "All systems launching!" -ForegroundColor Green
Write-Host "Frontend UI: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://localhost:8000/docs" -ForegroundColor White
