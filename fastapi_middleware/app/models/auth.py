from pydantic import BaseModel, Field
from typing import Optional

class Token(BaseModel):
    """Modelo para el token de acceso"""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str

class TokenData(BaseModel):
    """Modelo para los datos contenidos en el token"""
    username: Optional[str] = None
    user_id: Optional[int] = None

class User(BaseModel):
    """Modelo para representar un usuario"""
    id: int
    username: str
    name: str
    email: Optional[str] = None
    active: bool = True

class UserLogin(BaseModel):
    """Modelo para la autenticación de usuario"""
    username: str = Field(..., description="Nombre de usuario o correo electrónico")
    password: str = Field(..., description="Contraseña del usuario")
