from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from typing import Optional, List
from app.models.auth import User
from app.models.supplier import Supplier, SupplierCreate, SupplierUpdate, SupplierList
from app.services.auth import get_current_user
from app.services.supplier import (
    get_suppliers, get_supplier, create_supplier, update_supplier, delete_supplier,
    ensure_required_suppliers_exist, REQUIRED_SUPPLIERS
)
from app.core.odoo_client import odoo_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/suppliers", tags=["Proveedores"])

@router.get("", response_model=SupplierList)
async def read_suppliers(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener lista de proveedores con paginación y filtros
    """
    try:
        return get_suppliers(
            limit=limit,
            offset=offset,
            search=search
        )
    except Exception as e:
        logger.error(f"Error al obtener proveedores: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener proveedores: {str(e)}"
        )

@router.get("/required", response_model=List[str])
async def read_required_suppliers(
    current_user: User = Depends(get_current_user)
):
    """
    Obtener lista de proveedores requeridos por el sistema
    """
    return REQUIRED_SUPPLIERS

@router.post("/ensure-required", status_code=status.HTTP_200_OK)
async def ensure_required_suppliers(
    current_user: User = Depends(get_current_user)
):
    """
    Asegurar que los proveedores requeridos existan en el sistema
    """
    try:
        ensure_required_suppliers_exist()
        return {"message": "Proveedores requeridos creados correctamente"}
    except Exception as e:
        logger.error(f"Error al asegurar proveedores requeridos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al asegurar proveedores requeridos: {str(e)}"
        )

@router.get("/{supplier_id}", response_model=Supplier)
async def read_supplier(
    supplier_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener un proveedor por su ID
    """
    try:
        supplier = get_supplier(supplier_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Proveedor con ID {supplier_id} no encontrado"
            )
        return supplier
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener proveedor {supplier_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener proveedor: {str(e)}"
        )

@router.post("", response_model=Supplier, status_code=status.HTTP_201_CREATED)
async def create_supplier_endpoint(
    supplier: SupplierCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Crear un nuevo proveedor
    """
    try:
        supplier_id = create_supplier(supplier)
        return get_supplier(supplier_id)
    except Exception as e:
        logger.error(f"Error al crear proveedor: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear proveedor: {str(e)}"
        )

@router.put("/{supplier_id}", response_model=Supplier)
async def update_supplier_endpoint(
    supplier_id: int = Path(..., ge=1),
    supplier: SupplierUpdate = None,
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar un proveedor existente
    """
    try:
        # Verificar que el proveedor existe
        existing_supplier = get_supplier(supplier_id)
        if not existing_supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Proveedor con ID {supplier_id} no encontrado"
            )
        
        # Actualizar proveedor
        update_supplier(supplier_id, supplier)
        
        # Devolver proveedor actualizado
        return get_supplier(supplier_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar proveedor {supplier_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar proveedor: {str(e)}"
        )

@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier_endpoint(
    supplier_id: int = Path(..., ge=1),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar un proveedor
    """
    try:
        # Verificar que el proveedor existe
        existing_supplier = get_supplier(supplier_id)
        if not existing_supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Proveedor con ID {supplier_id} no encontrado"
            )
        
        # Verificar que no tenga productos asociados
        products_count = odoo_client.execute_kw(
            'product.template', 'search_count', [[('x_nombre_proveedor', '=', existing_supplier.name)]]
        )
        if products_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede eliminar el proveedor porque tiene {products_count} productos asociados"
            )
        
        # Verificar que no sea un proveedor requerido
        if existing_supplier.name in REQUIRED_SUPPLIERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede eliminar el proveedor '{existing_supplier.name}' porque es un proveedor requerido por el sistema"
            )
        
        # Eliminar proveedor
        delete_supplier(supplier_id)
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar proveedor {supplier_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar proveedor: {str(e)}"
        )
