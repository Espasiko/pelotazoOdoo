from pydantic import BaseModel, Field
from typing import Optional, List

class CategoryBase(BaseModel):
    """Modelo base para categorías"""
    name: str = Field(..., description="Nombre de la categoría")
    parent_id: Optional[int] = Field(None, description="ID de la categoría padre")
    complete_name: Optional[str] = Field(None, description="Nombre completo de la categoría")

class CategoryCreate(CategoryBase):
    """Modelo para crear categorías"""
    pass

class CategoryUpdate(BaseModel):
    """Modelo para actualizar categorías"""
    name: Optional[str] = None
    parent_id: Optional[int] = None

class Category(CategoryBase):
    """Modelo completo para categorías"""
    id: int
    child_ids: Optional[List[int]] = None
    
    class Config:
        from_attributes = True

class CategoryList(BaseModel):
    """Modelo para listar categorías con paginación"""
    data: List[Category]
    total: int
    page: int
    page_size: int
    pages: int
