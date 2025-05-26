# Importar routers
from . import auth, products, suppliers, categories, sync

# Hacer los routers disponibles para su importación
__all__ = ['auth', 'products', 'suppliers', 'categories', 'sync']
