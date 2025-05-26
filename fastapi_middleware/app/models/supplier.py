from pydantic import BaseModel, Field
from typing import Optional, List

class SupplierBase(BaseModel):
    """Modelo base para proveedores"""
    name: str = Field(..., description="Nombre del proveedor")
    vat: Optional[str] = Field(None, description="NIF/CIF del proveedor")
    email: Optional[str] = Field(None, description="Email del proveedor")
    phone: Optional[str] = Field(None, description="Teléfono del proveedor")
    mobile: Optional[str] = Field(None, description="Móvil del proveedor")
    street: Optional[str] = Field(None, description="Dirección del proveedor")
    city: Optional[str] = Field(None, description="Ciudad del proveedor")
    zip: Optional[str] = Field(None, description="Código postal del proveedor")
    country_id: Optional[int] = Field(None, description="ID del país del proveedor")
    supplier_rank: int = Field(1, description="Rango de proveedor (1 o mayor para proveedores)")
    active: bool = Field(True, description="Proveedor activo")

class SupplierCreate(SupplierBase):
    """Modelo para crear proveedores"""
    pass

class SupplierUpdate(BaseModel):
    """Modelo para actualizar proveedores"""
    name: Optional[str] = None
    vat: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    zip: Optional[str] = None
    country_id: Optional[int] = None
    supplier_rank: Optional[int] = None
    active: Optional[bool] = None

class Supplier(SupplierBase):
    """Modelo completo para proveedores"""
    id: int
    country_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class SupplierList(BaseModel):
    """Modelo para listar proveedores con paginación"""
    data: List[Supplier]
    total: int
    page: int
    page_size: int
    pages: int
