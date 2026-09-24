# CYBER SENTRY: AI-Based Fake Identity & Document Screening System

**Smart India Hackathon 2026 | Problem Statement ID: 26188 | Team: Cyber Sentry**  
*College: Adhiparasakthi Engineering College*

---

## 📌 Project Overview
**Cyber Sentry** is an automated multi-modal identity and document verification system engineered for border checkpoints, airport kiosks, immigration counters, and government identity issuance. It serves as an intelligent, high-speed first-level screening terminal that combines:
1. **ICAO Doc 9303 OCR & Algorithmic MRZ Engine**: Recalculates 7-3-1 weight check digits (Doc Num, DOB, Expiry, Composite Checksum) to catch forged text or altered demographic fields mathematically.
2. **Computer Vision & Error Level Analysis (ELA) Forensics**: Inspects compression error variance and noise anomalies across the document to detect digitally spliced text, swapped photos, and forged visa stamps.
3. **Biometric Face Verification & Passive Anti-Spoofing**: Extracts facial texture and spatial representations, comparing the document portrait against a live camera selfie, while assessing 2D-FFT Moiré frequencies to detect screen/photo spoofs.
4. **Instant Security Watchlist & Interpol Red Notice Lookup**: Automatically queries national and international databases for revoked stolen passports and wanted persons.
5. **Explainable AI (XAI) Risk Engine**: Synthesizes all multi-modal signals into a transparent 0–100 composite risk score with **`LOW`**, **`REVIEW`**, or **`HIGH`** disposition and officer review workflows.

---

## ⚡ 1-Click Launch (Whenever you are ready!)

Simply double-click **`start.bat`** (or run `.\start.ps1` in PowerShell) in the root directory:
```powershell
.\start.bat
```
This starts both the **FastAPI AI Backend** (`http://localhost:8000`) and the **React Border Control Terminal** (`http://localhost:5173`) in separate windows automatically!

---

## 🚀 Manual Launch Commands

### 1. Backend Setup (`FastAPI` + `Python`)
```bash
cd backend
python run.py
```
* Backend URL: `http://localhost:8000`
* Interactive API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup (`React` + `Vite` + `Tailwind CSS`)
```bash
cd frontend
npm run dev
```
* Frontend Terminal: `http://localhost:5173`

---

## 🧪 10 Pre-loaded Multi-Document Test Scenarios for Evaluators
1. **Passports**:
   - `Case 1`: Genuine Passport (`LOW RISK` - ICAO Checksums Verified + 97% Face Match)
   - `Case 2`: Forged Passport DOB (`HIGH RISK` - Checksum Mismatch + ELA Anomaly)
   - `Case 3`: Photo Swapped Impersonator (`HIGH RISK` - Biometric Mismatch < 35%)
   - `Case 9`: Interpol Red Notice (`HIGH RISK` - Security Watchlist Hit)
   - `Case 10`: Expired Travel Document (`REVIEW REQUIRED` - Validity Exception)
2. **Indian National IDs (Aadhaar & PAN)**:
   - `Case 4`: Genuine Aadhaar Card (`LOW RISK` - 12-digit UIDAI Verhoeff Checksum Verified)
   - `Case 5`: Forged Aadhaar Card (`HIGH RISK` - Invalid Check Digit / Verhoeff Failed + Photo Splicing)
   - `Case 6`: Genuine PAN Card (`LOW RISK` - Individual 'P' Entity Status + Surname Initial Match)
   - `Case 7`: Forged PAN Card (`HIGH RISK` - Invalid Entity Code & Surname Mismatch)
3. **Visas & Consular Documents**:
   - `Case 8`: Valid Multiple-Entry Visa (`LOW RISK` - Consular Stamp + TD2 MRZ Verified)

---

## 🏗️ Architecture & Modules
```
sih project 26188/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── screening.py       # Main multi-modal screening endpoint
│   │   │   ├── blacklist.py       # Watchlist & Interpol database CRUD
│   │   │   ├── audit.py           # Historical audit log querying & telemetry
│   │   │   └── demo_samples.py    # 1-click test scenarios generator
│   │   ├── core/
│   │   │   ├── config.py          # CORS & environment paths
│   │   │   └── database.py        # SQLAlchemy & SQLite database setup
│   │   ├── models/
│   │   │   ├── screening_log.py   # Immutable screening audit schema
│   │   │   └── blacklist_item.py  # Security watchlist schema
│   │   ├── services/
│   │   │   ├── ocr_mrz_service.py # ICAO 9303 MRZ parsing & check digit math
│   │   │   ├── forensics_service.py # ELA compression discrepancy & heatmaps
│   │   │   ├── face_service.py    # Biometric facial matching & anti-spoofing
│   │   │   ├── risk_service.py    # Multi-signal Explainable Risk Engine
│   │   │   └── sample_factory.py  # Realistic test document generator
│   │   └── main.py                # FastAPI app entry point
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── DemoCaseBar.jsx
│   │   │   ├── DocumentUploader.jsx
│   │   │   ├── CameraCaptureModal.jsx
│   │   │   ├── ForensicHeatmapViewer.jsx
│   │   │   ├── RiskScoreCard.jsx
│   │   │   ├── ExplainableRiskCard.jsx
│   │   │   ├── ExtractedFieldsTable.jsx
│   │   │   └── OfficerActionPanel.jsx
│   │   ├── pages/
│   │   │   ├── ScreeningTerminal.jsx
│   │   │   ├── AuditLogsView.jsx
│   │   │   ├── WatchlistManager.jsx
│   │   │   └── AnalyticsDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## 🔒 Security & Privacy
* **Explainable AI (XAI)**: Generates human-understandable justification points for each flag.
* **Tamper-Evident Audit Logging**: Every inspection, risk breakdown, and officer disposition is persistently logged to the database for post-incident forensic audits.
* **Human-in-the-Loop**: Border officers have final decision authority (`APPROVE`, `REJECT`, `ESCALATE`) on all flagged documents.
* DEMO LINK : https://cyber-sentrum.onrender.com/
  
