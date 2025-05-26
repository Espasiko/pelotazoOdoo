from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from typing import Optional, List
from app.models.auth import User
from app.models.product import Product, ProductCreate, ProductUpdate, ProductList
from app.services.auth import get_current_user
from app.services.product import get_products, get_product, create_product, update_product, delete_product
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["Productos"])

@router.get("", response_model=ProductList)
async def read_products(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    order: Optional[str] = None,
    supplier: Optional[str] = None,
    category_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener lista de productos con paginación y filtros
    """
    try:
        return get_products(
            limit=limit,
            offset=offset,
            search=search,
            order=order,
            supplier=supplier,
            category_id=category_id
        )
    except Exception as e:
        logger.error(f"Error al obtener productos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener productos: {str(e)}"
        )

@router.get("/{product_id}", response_model=Product)
async def read_product(
    product_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener un producto por su ID
    """
    try:
        product = get_product(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {product_id} no encontrado"
            )
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener producto {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener producto: {str(e)}"
        )

@router.post("", response_model=Product, status_code=status.HTTP_201_CREATED)
async def create_product_endpoint(
    product: ProductCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Crear un nuevo producto
    """
    try:
        product_id = create_product(product)
        return get_product(product_id)
    except Exception as e:
        logger.error(f"Error al crear producto: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear producto: {str(e)}"
        )

@router.put("/{product_id}", response_model=Product)
async def update_product_endpoint(
    product_id: int = Path(..., ge=1),
    product: ProductUpdate = None,
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar un producto existente
    """
    try:
        # Verificar que el producto existe
        existing_product = get_product(product_id)
        if not existing_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {product_id} no encontrado"
            )
        
        # Actualizar producto
        update_product(product_id, product)
        
        # Devolver producto actualizado
        return get_product(product_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar producto {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar producto: {str(e)}"
        )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_endpoint(
    product_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar un producto
    """
    try:
        # Verificar que el producto existe
        existing_product = get_product(product_id)
        if not existing_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {product_id} no encontrado"
            )
        
        # Eliminar producto
        delete_product(product_id)
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar producto {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar producto: {str(e)}"
        )
