from pydantic import Field, PostgresDsn, validator
from pydantic_settings import BaseSettings
from typing import List, Optional, Dict, Any, Union
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
    
    # Configuración de la base de datos
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "pelotazo")
    DATABASE_URI: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
