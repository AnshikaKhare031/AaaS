import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AaaS Handmade Crochet API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Razorpay Configuration
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "rzp_test_secret_placeholder")

    # Security
    ADMIN_SECRET_KEY: str = os.getenv("ADMIN_SECRET_KEY", "aaas_crochet_admin_secret_2026")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        case_sensitive = True

settings = Settings()
