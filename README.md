# BhoomiSetu AI (भूमिसेतु / ଭୂମିସେତୁ)

**Predictive Analytics and Management System for Early Detection of Land Acquisition Delays**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-teal.svg)
![GIS](https://img.shields.io/badge/GIS-React--Leaflet-success.svg)

> **Important Hackathon Note**: This application is a decision-support prototype built with fictional synthetic data and demonstration workflows. It does not store real Aadhaar numbers, confidential land records, or perform actual bank transfers.

---

## 📌 Executive Summary

Major infrastructure corridors—highways, railway expansions, dam basins, and industrial hubs—frequently stall due to unanticipated bottlenecks during land acquisition: contested title deeds, pending joint cadastral surveys, missing documents, delayed environmental clearances, and stuck compensation approvals.

**BhoomiSetu AI** provides early warning intelligence by analyzing multi-dimensional risk factors across projects, villages, cases, and parcels. Leveraging Random Forest Machine Learning with SHAP explainability, interactive GIS mapping, OCR document discrepancy detection, and dynamic risk recalculation loops, BhoomiSetu AI shifts public governance from **reactive firefighting** to **proactive risk mitigation**.

---

## 🏛️ System Architecture

```
BhoomiSetu AI Full-Stack Platform
│
├── frontend/             [React 18 + Vite + Tailwind + Leaflet + Recharts + i18n]
├── backend/              [FastAPI + SQLAlchemy + Pydantic + JWT + SQLite/Postgres]
├── database/             [Relational Schema + PostGIS Geometries + 80+ Seed Parcels]
├── machine-learning/     [2,000+ Synthetic Dataset + RF Classifier + RF Regressor + SHAP]
├── gis/                  [GeoJSON Parcel Boundaries (Odisha) + Risk Palette Styles]
├── contracts/            [OpenAPI 3.0 Specs + JSON Schemas + Response Mocks]
├── sample-documents/     [Valid, Mismatched & Unreadable RoR Deeds for OCR Testing]
├── docs/                 [Architecture, ML Logic, OCR Rules, Demo Guide, User Roles]
├── tests/                [Integration & End-to-End Test Suites]
└── scripts/              [Setup, Demo Seeding, Health Checks & Startup Helpers]
```

---

## 🚀 Quick Start (Local Run in 3 Minutes)

### Prerequisites
- **Node.js**: v18+ (tested on v20/v22)
- **Python**: 3.10+ (tested on Python 3.11)
- **Git**

### Automated Setup (Windows PowerShell)
```powershell
# Run the all-in-one setup and startup script
.\scripts\setup.ps1
```

### Automated Setup (Linux / macOS)
```bash
chmod +x scripts/*.sh
./scripts/setup.sh
```

---

## 🔑 Demo Login Credentials

The database is pre-seeded with role-based demo accounts:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@bhoomisetu.gov.in` | `DemoPass123!` | System settings, user role management, system audit logs |
| **Land Acquisition Officer** | `officer.patra@bhoomisetu.gov.in` | `DemoPass123!` | Executive dashboard, project/case management, AI prediction & recommendations |
| **Survey Officer** | `surveyor.mishra@bhoomisetu.gov.in` | `DemoPass123!` | Cadastral surveys, plot boundary reviews, GIS verification |
| **Compensation Officer** | `comp.jena@bhoomisetu.gov.in` | `DemoPass123!` | 9-Stage compensation pipeline, bank verification, award sanctions |
| **Landowner (Farmer)** | `landowner.das@gmail.com` | `DemoPass123!` | Multilingual portal (EN/HI/OR), parcel status, document upload, grievances |

*(Tip: The Login page includes quick one-click demo login buttons for each role.)*

---

## 🗺️ Interactive Demo Scenario

1. **Log in as Land Acquisition Officer** (`officer.patra@bhoomisetu.gov.in`).
2. **Dashboard Overview**: View high-risk alerts and open **Case #CASE-OD-2026-004** (*Bhubaneswar-Puri Expressway Corridor*).
3. **Inspect GIS Parcel Map**: Click on the red high-risk parcel (**Plot #142/A, Pipili Village**).
4. **Review AI Delay Prediction**: Observe the **84% delay probability** and **+145 estimated delay days**.
5. **Inspect Explainability Breakdown**: Factors identified: *Document Mismatch*, *Pending Cadastral Survey*, *Unapproved Compensation*.
6. **Simulate Landowner Action**: Switch to Landowner view (`landowner.das@gmail.com`) and upload a record of rights deed.
7. **OCR Discrepancy Engine**: System scans document, flags a plot number typo via RapidFuzz fuzzy matching, and creates an officer review task.
8. **Resolve & Recalculate**: Officer verifies document and marks survey completed.
9. **Dynamic Risk Reduction**: The dynamic risk recalculation engine automatically updates, dropping risk from **84% (High - Red)** down to **45% (Medium - Yellow)** with an automated audit log and SMS alert.

---

## 📂 Team Folder Responsibilities

| Directory | Team Responsibility | Primary Tech Stack |
| :--- | :--- | :--- |
| `frontend/` | UI/UX, Dashboards, Multilingual Pages, GIS Maps | React 18, Vite, Tailwind CSS, Leaflet, Recharts, i18next |
| `backend/` | REST APIs, Business Logic, Recalculation Engine, OCR Engine | Python, FastAPI, SQLAlchemy, Pydantic, RapidFuzz |
| `database/` | Database Schemas, Migrations, Seed Scripts, ERD | SQLite (instant zero-config) / PostgreSQL + PostGIS |
| `machine-learning/` | Dataset Synthesis, Model Training, Feature Engineering, SHAP | Pandas, NumPy, Scikit-learn (RandomForest), Joblib |
| `gis/` | Cadastral GeoJSON Layers, Risk Styles, Polygon Handlers | GeoJSON, Leaflet, Turf.js |
| `contracts/` | Shared OpenAPI 3.0 specs, JSON Schemas, Response Mocks | YAML, JSON Schema |
| `sample-documents/` | Test Deeds, Mismatched RoRs, Scanned PDFs for OCR | PDF, PNG, JPG |
| `docs/` | Comprehensive technical, architectural, and user guides | Markdown |

---

## 🔒 Security & Ethics
- All passwords hashed via bcrypt.
- Stateless JWT authentication with role-based claim authorization.
- AI predictions clearly labeled as **Decision-Support Information**; all formal actions require authorized human officer verification.
- Mock external services (SMS, Bank Sanctions) for 100% safe, offline-capable hackathon demonstration.

---

## 📜 License
Developed for Smart India Hackathon (SIH 2026). Open source under the MIT License.
