@echo off
title AI Identity & Document Screening System
echo ===============================================================================
echo     AI-BASED FAKE IDENTITY & DOCUMENT SCREENING SYSTEM
echo     Automated QR Verification, Document Forensics & Database Cross-Match
echo ===============================================================================
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "Identity Screening Backend" cmd /k "cd backend && python run.py"

echo [2/2] Starting React + Vite Frontend on http://localhost:5173 ...
start "Identity Screening Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===============================================================================
echo  Application is launching!
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API Docs:   http://localhost:8000/docs
echo ===============================================================================
echo.
pause
