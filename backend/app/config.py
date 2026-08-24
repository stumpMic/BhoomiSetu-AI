import os
from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

class Settings(BaseSettings):
    APP_NAME: str = "BhoomiSetu AI"
    APP_ENV: str = "development"
    SECRET_KEY: str = "bhoomisetu-ai-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DEBUG: bool = True
    
    # Database path pointing to root database/bhoomisetu.db
    DATABASE_URL: str = f"sqlite:///{PROJECT_ROOT}/database/bhoomisetu.db"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    
    # Machine Learning Models Directory
    ML_MODEL_PATH: str = str(PROJECT_ROOT / "machine-learning" / "models")
    
    # Uploads & OCR
    UPLOAD_DIR: str = str(BACKEND_DIR / "uploads")
    MAX_UPLOAD_SIZE_MB: int = 15
    ENABLE_MOCK_SMS: bool = True

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure uploads and database directory exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(PROJECT_ROOT / "database", exist_ok=True)
