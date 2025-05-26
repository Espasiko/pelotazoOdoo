from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from typing import Optional, List
from app.models.auth import User
from app.models.category import Category, CategoryCreate, CategoryUpdate, CategoryList
from app.services.auth import get_current_user
from app.services.category import get_categories, get_category, create_category, update_category, delete_category
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/categories", tags=["Categorías"])

@router.get("", response_model=CategoryList)
async def read_categories(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    parent_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener lista de categorías con paginación y filtros
    """
    try:
        return get_categories(
            limit=limit,
            offset=offset,
            search=search,
            parent_id=parent_id
        )
    except Exception as e:
        logger.error(f"Error al obtener categorías: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener categorías: {str(e)}"
        )

@router.get("/{category_id}", response_model=Category)
async def read_category(
    category_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener una categoría por su ID
    """
    try:
        category = get_category(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con ID {category_id} no encontrada"
            )
        return category
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener categoría {category_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener categoría: {str(e)}"
        )

@router.post("", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category_endpoint(
    category: CategoryCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Crear una nueva categoría
    """
    try:
        category_id = create_category(category)
        return get_category(category_id)
    except Exception as e:
        logger.error(f"Error al crear categoría: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear categoría: {str(e)}"
        )

@router.put("/{category_id}", response_model=Category)
async def update_category_endpoint(
    category_id: int = Path(..., ge=1),
    category: CategoryUpdate = None,
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar una categoría existente
    """
    try:
        # Verificar que la categoría existe
        existing_category = get_category(category_id)
        if not existing_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con ID {category_id} no encontrada"
            )
        
        # Actualizar categoría
        update_category(category_id, category)
        
        # Devolver categoría actualizada
        return get_category(category_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar categoría {category_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar categoría: {str(e)}"
        )

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category_endpoint(
    category_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar una categoría
    """
    try:
        # Verificar que la categoría existe
        existing_category = get_category(category_id)
        if not existing_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con ID {category_id} no encontrada"
            )
        
        # Verificar que no tenga productos asociados
        products_count = odoo_client.execute_kw(
            'product.template', 'search_count', [[('categ_id', '=', category_id)]]
        )
        if products_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede eliminar la categoría porque tiene {products_count} productos asociados"
            )
        
        # Eliminar categoría
        delete_category(category_id)
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar categoría {category_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar categoría: {str(e)}"
        )
