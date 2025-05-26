from datetime import datetime, timedelta
from typing import Any, Optional, Union, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.schemas.user import UserInDB, TokenData

# Configuración para OAuth2 con contraseña (bearer token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any], user_id: int, name: str, expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crear un token JWT de acceso
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {
        "exp": expire, 
        "sub": str(subject), 
        "user_id": user_id,
        "name": name
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verificar si una contraseña coincide con su hash
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Obtener el hash de una contraseña
    """
    return pwd_context.hash(password)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    """
    Obtener el usuario actual a partir del token JWT
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    # Aquí deberías obtener el usuario de tu base de datos
    # Por ahora, devolvemos un usuario de ejemplo
    user = UserInDB(
        id=1,
        username=token_data.username,
        email="admin@example.com",
        full_name="Administrador",
        is_active=True,
        is_superuser=True,
        hashed_password="hashed_password_placeholder",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    """
    Obtener el usuario actual activo
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user

async def verify_token(token: str) -> bool:
    """
    Verificar si un token JWT es válido
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return True
    except JWTError:
        return False
