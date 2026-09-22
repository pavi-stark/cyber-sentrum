@echo off
echo =====================================================================
echo  CYBER SENTRY - AI FAKE IDENTITY ^& DOCUMENT SCREENING SYSTEM
echo  Smart India Hackathon 2026 - Problem Statement ID 26188
echo =====================================================================
echo.
echo [1/2] Starting FastAPI Backend Server on http://localhost:8000 ...
start "CyberSentry Backend API" cmd /k "cd /d %~dp0backend && python run.py"

echo [2/2] Starting Vite Frontend Server on http://localhost:5173 ...
start "CyberSentry Frontend UI" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 0.0.0.0"

timeout /t 3 >nul
echo.
echo Launching Cyber Sentry in default browser...
start http://localhost:5173/

echo.
echo =====================================================================
echo  Both Servers are LIVE and Active!
echo  - Frontend Web App: http://localhost:5173/
echo  - Backend API Docs: http://localhost:8000/docs
echo =====================================================================
