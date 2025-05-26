from pydantic import BaseModel, Field
from typing import Optional, List, Union, Dict, Any
from decimal import Decimal

class ProductBase(BaseModel):
    """Modelo base para productos"""
    name: str = Field(..., description="Nombre del producto")
    description: Optional[str] = Field(None, description="Descripción del producto")
    list_price: Decimal = Field(..., description="Precio de venta")
    standard_price: Optional[Decimal] = Field(None, description="Precio de coste")
    default_code: Optional[str] = Field(None, description="Referencia interna")
    barcode: Optional[str] = Field(None, description="Código de barras")
    active: bool = Field(True, description="Producto activo")
    sale_ok: bool = Field(True, description="Puede ser vendido")
    purchase_ok: bool = Field(True, description="Puede ser comprado")
    categ_id: int = Field(..., description="ID de la categoría")
    
    # Campos personalizados
    x_nombre_proveedor: Optional[str] = Field(None, description="Nombre del proveedor")
    x_marca: Optional[str] = Field(None, description="Marca del producto")
    x_pvp_web: Optional[Decimal] = Field(None, description="Precio de venta web")
    x_precio_venta_web: Optional[Decimal] = Field(None, description="Precio de venta web")
    x_dto: Optional[Decimal] = Field(None, description="Descuento")
    x_precio_margen: Optional[Decimal] = Field(None, description="Precio con margen")
    x_beneficio: Optional[Decimal] = Field(None, description="Beneficio (%)")
    x_beneficio_unitario: Optional[Decimal] = Field(None, description="Beneficio unitario")
    x_beneficio_total: Optional[Decimal] = Field(None, description="Beneficio total")
    x_vendidas: Optional[int] = Field(None, description="Unidades vendidas")

class ProductCreate(ProductBase):
    """Modelo para crear productos"""
    pass

class ProductUpdate(BaseModel):
    """Modelo para actualizar productos"""
    name: Optional[str] = None
    description: Optional[str] = None
    list_price: Optional[Decimal] = None
    standard_price: Optional[Decimal] = None
    default_code: Optional[str] = None
    barcode: Optional[str] = None
    active: Optional[bool] = None
    sale_ok: Optional[bool] = None
    purchase_ok: Optional[bool] = None
    categ_id: Optional[int] = None
    
    # Campos personalizados
    x_nombre_proveedor: Optional[str] = None
    x_marca: Optional[str] = None
    x_pvp_web: Optional[Decimal] = None
    x_precio_venta_web: Optional[Decimal] = None
    x_dto: Optional[Decimal] = None
    x_precio_margen: Optional[Decimal] = None
    x_beneficio: Optional[Decimal] = None
    x_beneficio_unitario: Optional[Decimal] = None
    x_beneficio_total: Optional[Decimal] = None
    x_vendidas: Optional[int] = None

class Product(ProductBase):
    """Modelo completo para productos"""
    id: int
    categ_name: Optional[str] = None
    image_url: Optional[str] = None
    
    # Alias para compatibilidad con el frontend
    supplier: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[Decimal] = None
    
    class Config:
        from_attributes = True

class ProductList(BaseModel):
    """Modelo para listar productos con paginación"""
    data: List[Product]
    total: int
    page: int
    page_size: int
    pages: int
