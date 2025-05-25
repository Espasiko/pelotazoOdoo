from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env si existe
load_dotenv()

class Settings(BaseSettings):
    # Configuración general
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "El Pelotazo API"
    
    # Configuración de seguridad
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pelotazo_secret_key_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas
    
    # Configuración de CORS
    CORS_ORIGINS: List[str] = ["*"]  # Permitir cualquier origen durante el desarrollo
    
    # Configuración de Odoo
    ODOO_URL: str = os.getenv("ODOO_URL", "http://localhost:8069")
    ODOO_DB: str = os.getenv("ODOO_DB", "odoo_pelotazo")
    ODOO_USERNAME: str = os.getenv("ODOO_USERNAME", "admin")
    ODOO_PASSWORD: str = os.getenv("ODOO_PASSWORD", "admin")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
