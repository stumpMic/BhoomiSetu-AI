# BhoomiSetu AI — Backend Engine

FastAPI-powered REST API backend for land acquisition delay analytics, document OCR verification, departmental workflow orchestration, and ML risk inferencing.

## Installation & Setup

```bash
# 1. Create and activate a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Initialize database and seed demo data
python ../scripts/seed_demo_data.py

# 4. Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

## Interactive API Docs
Once running, browse interactive OpenAPI documentation:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
