from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.core.odoo_client import odoo_client
from app.models.auth import TokenData, User
import logging

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
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
        user_id: int = payload.get("user_id")
        name: str = payload.get("name")
        
        if username is None or user_id is None:
            raise credentials_exception
            
        token_data = TokenData(username=username, user_id=user_id)
    except JWTError:
        raise credentials_exception
        
    # Verificar que el usuario existe en Odoo
    try:
        user_data = odoo_client.read('res.users', [token_data.user_id], ['name', 'login', 'email', 'active'])
        if not user_data or not user_data[0]['active']:
            raise credentials_exception
            
        user = User(
            id=user_data[0]['id'],
            username=user_data[0]['login'],
            name=user_data[0]['name'],
            email=user_data[0].get('email'),
            active=user_data[0]['active']
        )
        return user
    except Exception as e:
        logger.error(f"Error al obtener usuario de Odoo: {str(e)}")
        raise credentials_exception

def authenticate_user(username: str, password: str) -> Optional[dict]:
    """
    Autenticar un usuario con Odoo
    """
    try:
        uid = odoo_client.authenticate(username, password)
        if not uid:
            return None
            
        # Obtener información del usuario
        user_data = odoo_client.read('res.users', [uid], ['name', 'login', 'email'])
        if not user_data:
            return None
            
        return {
            'id': uid,
            'name': user_data[0]['name'],
            'username': user_data[0]['login'],
            'email': user_data[0].get('email')
        }
    except Exception as e:
        logger.error(f"Error al autenticar usuario en Odoo: {str(e)}")
        return None
