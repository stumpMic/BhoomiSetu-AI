# 🛠️ BhoomiSetu AI — Local Server Setup & Installation Guide

> **BhoomiSetu AI (भूमिसेतु / ଭୂମିସେତୁ)**: Predictive Analytics and Management System for Early Detection of Land Acquisition Delays.

This comprehensive guide walks you through setting up, configuring, seeding, and running the complete **BhoomiSetu AI** web application and backend servers on a local machine or server.

---

## 📋 Table of Contents

1. [Prerequisites & System Software Requirements](#1-prerequisites--system-software-requirements)
2. [Tech Stack Overview](#2-tech-stack-overview)
3. [Environment Setup & Configuration (`.env`)](#3-environment-setup--configuration-env)
4. [Option A: Automated 1-Click Local Setup (Recommended)](#4-option-a-automated-1-click-local-setup-recommended)
5. [Option B: Manual Step-by-Step Local Setup](#5-option-b-manual-step-by-step-local-setup)
   - [Step 1: Clone Repository & Prepare Directory](#step-1-clone-repository--prepare-directory)
   - [Step 2: Database Initialization & Seeding](#step-2-database-initialization--seeding)
   - [Step 3: Machine Learning Model Verification](#step-3-machine-learning-model-verification)
   - [Step 4: Backend FastAPI Server Setup](#step-4-backend-fastapi-server-setup)
   - [Step 5: Frontend React Web App Setup](#step-5-frontend-react-web-app-setup)
6. [Option C: Containerized Setup (Docker & Docker Compose)](#6-option-c-containerized-setup-docker--docker-compose)
7. [🔑 Demo Login Credentials](#7--demo-login-credentials)
8. [🧪 System Verification & Health Diagnostics](#8--system-verification--health-diagnostics)
9. [❓ Troubleshooting & FAQ](#9--troubleshooting--faq)

---

## 1. Prerequisites & System Software Requirements

Before setting up BhoomiSetu AI, ensure the following core software packages are installed on your local system:

### Core Requirements

| Software Tool | Version Required | Download Link / Notes |
| :--- | :--- | :--- |
| **Python** | `3.10` or `3.11+` | [python.org/downloads](https://www.python.org/downloads/) — Make sure to tick *"Add Python to PATH"* during installation. |
| **Node.js** | `v18.0.0` or higher (tested on v20/v22) | [nodejs.org](https://nodejs.org/) — Includes `npm` package manager. |
| **Git** | `2.x+` | [git-scm.com](https://git-scm.com/) — Source control management. |

### Optional / Advanced Components

| Software Tool | Purpose | Download Link / Notes |
| :--- | :--- | :--- |
| **Docker Desktop** | Containerized execution of PostGIS + FastAPI + React frontend | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **PostgreSQL & PostGIS** | Enterprise relational + spatial database (SQLite is default zero-config fallback) | [postgresql.org](https://www.postgresql.org/download/) / PostGIS extension |
| **Tesseract OCR** | Local optical character recognition engine for scanned Record of Rights (RoR) PDFs/images | [tesseract-ocr.github.io](https://tesseract-ocr.github.io/tessdoc/Installation.html) (If absent, system automatically uses intelligent mock fallback) |
| **.NET SDK / C# Compiler** | Compiling the Windows `START_BHOOMISETU_AI.exe` GUI desktop launcher | Built-in via `.NET Framework` / `csc.exe` on Windows |

---

## 2. Tech Stack Overview

### System Architecture & Services Map

```
BhoomiSetu AI Local Ecosystem
│
├── Frontend Server      : Node.js / Vite / React 18 ──► http://localhost:5173
├── Backend REST API     : Python 3.11 / FastAPI     ──► http://localhost:8000
├── Interactive API Docs : Swagger UI / ReDoc        ──► http://localhost:8000/docs
├── Database Engine      : SQLite (Instant Zero-Config) or PostgreSQL + PostGIS (Docker)
├── Machine Learning     : Scikit-learn / Random Forest / SHAP Explainability Engine
└── GIS Data Subsystem   : Leaflet / GeoJSON Odisha Cadastral Parcels & Risk Palette
```

### Dependencies Summary

- **Backend (`backend/requirements.txt`)**: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `python-jose`, `passlib[bcrypt]`, `rapidfuzz`, `scikit-learn`, `joblib`, `numpy`, `pandas`, `shap`, `httpx`, `pytest`.
- **Frontend (`frontend/package.json`)**: `react 18`, `vite`, `tailwindcss`, `leaflet`, `react-leaflet`, `recharts`, `lucide-react`, `axios`, `i18next`, `react-i18next`.

---

## 3. Environment Setup & Configuration (`.env`)

BhoomiSetu AI includes template configuration files.

1. Create a root `.env` file from `.env.example`:
   ```bash
   # On Windows PowerShell
   Copy-Item .env.example .env

   # On Linux / macOS
   cp .env.example .env
   ```

2. Key Configuration Variables:
   ```env
   # Core Application Settings
   APP_NAME="BhoomiSetu AI"
   APP_ENV=development
   SECRET_KEY=bhoomisetu-ai-super-secret-key-change-in-production-2026
   DEBUG=true

   # Backend Host & Port
   BACKEND_HOST=0.0.0.0
   BACKEND_PORT=8000
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

   # Database Connection (SQLite default for instant local launch)
   DATABASE_URL=sqlite:///./database/bhoomisetu.db
   # For PostgreSQL: DATABASE_URL=postgresql://bhoomisetu_user:bhoomisetu_pass@localhost:5432/bhoomisetu_db

   # Frontend API Base URL
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_USE_MOCK_API=false

   # Machine Learning Model Path
   ML_MODEL_PATH=./machine-learning/models
   ML_CONFIDENCE_THRESHOLD=0.70

   # OCR Engine
   TESSERACT_CMD=tesseract
   UPLOAD_DIR=./backend/uploads
   ```

---

## 4. Option A: Automated 1-Click Local Setup (Recommended)

BhoomiSetu AI includes automated scripts that seed the database, verify ML models, check GIS layers, and validate overall system integrity.

### For Windows Users (PowerShell):
```powershell
# Run all-in-one setup & verification script
.\scripts\setup.ps1
```

### For Windows GUI Launcher:
Double-click `START_BHOOMISETU_AI.bat` or `START_BHOOMISETU_AI.exe` in the root folder. It automatically:
1. Starts the backend FastAPI server on port `8000`.
2. Starts the frontend Vite dev server on port `5173`.
3. Opens your web browser automatically to `http://localhost:5173`.

### For Linux / macOS Users:
```bash
chmod +x scripts/*.sh
./scripts/setup.sh
```

---

## 5. Option B: Manual Step-by-Step Local Setup

If you prefer to set up each component manually, follow these instructions:

### Step 1: Clone Repository & Prepare Directory
```bash
git clone https://github.com/your-org/BhoomiSetu-AI.git
cd BhoomiSetu-AI
```

### Step 2: Database Initialization & Seeding
BhoomiSetu AI relies on a SQLite relational database pre-populated with realistic demonstration projects, villages, cases, parcels, and users.

```bash
# Execute python database seed script
python scripts/seed_demo_data.py
```
*Expected Output:*
```
[*] Initializing SQLite database at: .../database/bhoomisetu.db
[+] Applying schema: tables.sql
[+] Applying schema: indexes.sql
[+] Seeding data from: users.sql, projects.sql, cases.sql, parcels.sql, compensations.sql, tasks.sql, grievances.sql
[SUCCESS] Database initialization and seeding completed successfully!
```

### Step 3: Machine Learning Model Verification
Ensure ML Random Forest classifier/regressor models and SHAP explainability pipelines are ready:

```bash
python machine-learning/src/evaluate.py
```

If you ever need to re-train the models from scratch:
```bash
python machine-learning/src/generate_data.py
python machine-learning/src/train_classifier.py
python machine-learning/src/train_regressor.py
```

### Step 4: Backend FastAPI Server Setup

1. Open a terminal and navigate to the project directory:
   ```bash
   # Create a virtual environment (Optional but Recommended)
   python -m venv venv

   # Activate virtual environment
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate

   # Install required packages
   pip install -r backend/requirements.txt
   ```

2. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
   ```

3. Verify backend server:
   - Base API Health Check: `http://localhost:8000/api/health`
   - Interactive Swagger API Documentation: `http://localhost:8000/docs`
   - ReDoc API Documentation: `http://localhost:8000/redoc`

### Step 5: Frontend React Web App Setup

1. Open a **new terminal window** and navigate to the `frontend/` directory:
   ```bash
   cd frontend

   # Install npm packages
   npm install
   ```

2. Launch the Vite local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   `http://localhost:5173`

---

## 6. Option C: Containerized Setup (Docker & Docker Compose)

BhoomiSetu AI provides a multi-container Docker deployment featuring **PostgreSQL + PostGIS**, **FastAPI Backend**, and **Nginx-served Frontend**.

### Prerequisites
- Install **Docker Desktop** and verify `docker compose` is available.

### Launching with Docker Compose
```bash
# Build and launch all containers in detached mode
docker-compose up --build -d
```

### Container Port Mapping
- **Frontend App**: `http://localhost:5173`
- **FastAPI Backend**: `http://localhost:8000`
- **PostGIS Database**: `localhost:5432` (`bhoomisetu_user` / `bhoomisetu_pass`)

### Stop Services
```bash
docker-compose down
```

---

## 7. 🔑 Demo Login Credentials

The local database comes pre-loaded with role-based demonstration accounts for evaluation:

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@bhoomisetu.gov.in` | `DemoPass123!` | System settings, user role allocation, administrative logs |
| **Land Acquisition Officer** | `officer.patra@bhoomisetu.gov.in` | `DemoPass123!` | Executive dashboard, project/case risk management, ML delay predictions & SHAP explainability |
| **Survey Officer** | `surveyor.mishra@bhoomisetu.gov.in` | `DemoPass123!` | Cadastral survey reviews, boundary plot verification, GIS map interaction |
| **Compensation Officer** | `comp.jena@bhoomisetu.gov.in` | `DemoPass123!` | 9-Stage compensation pipeline, bank verification, award sanctioning |
| **Landowner (Farmer)** | `landowner.das@gmail.com` | `DemoPass123!` | Multilingual citizen portal (EN/HI/OR), parcel tracking, document uploads, grievances |

*(Tip: The login UI features one-click quick login buttons to switch seamlessly between roles.)*

---

## 8. 🧪 System Verification & Health Diagnostics

To verify that all subsystems are connected and operating cleanly, run the comprehensive project diagnostic tool:

```bash
python scripts/verify_project.py
```

### Diagnostic Checklist Covered:
- [x] **Architecture & Directory Structure**: Checks existence of all 9 modular folders (`backend`, `frontend`, `database`, `machine-learning`, `gis`, `contracts`, `sample-documents`, `tests`, `scripts`).
- [x] **Database Tables & Seed Data**: Verifies 10 core SQL tables and record counts.
- [x] **Machine Learning Artifacts**: Confirms existence of classifier, regressor, and SHAP metadata.
- [x] **GIS GeoJSON Compliance**: Validates topological boundaries for Odisha demonstration parcels.
- [x] **OpenAPI Contracts**: Checks validity of `api-specification.yaml`.

---

## 9. ❓ Troubleshooting & FAQ

### Issue 1: Port `8000` or `5173` is already in use
- **Solution**: Kill the existing process using the port, or change the port in `.env` and `frontend/vite.config.js`.
  ```powershell
  # On Windows PowerShell to check process on port 8000:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess
  ```

### Issue 2: Frontend shows API network error or blank data
- **Solution**: Ensure backend is running at `http://localhost:8000`. You can also enable mock mode in `frontend/.env`:
  ```env
  VITE_USE_MOCK_API=true
  ```

### Issue 3: Missing `tesseract` command warning during OCR processing
- **Solution**: BhoomiSetu AI features a built-in mock fallback engine. If Tesseract binary is omitted, document scanning still performs string extraction and fuzzy matching automatically without failing.

---

*Developing for Smart India Hackathon (SIH 2026). Open source under the MIT License.*
