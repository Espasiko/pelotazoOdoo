# FastAPI Middleware para El Pelotazo

Este proyecto implementa una capa de middleware utilizando FastAPI para mejorar la comunicación entre el frontend Next.js y el backend Odoo de la tienda de electrodomésticos El Pelotazo.

## Características

- **API RESTful completa**: Endpoints para productos, categorías, proveedores y autenticación
- **Autenticación JWT**: Gestión segura de sesiones de usuario
- **Integración con Odoo**: Comunicación transparente con el backend de Odoo
- **Documentación automática**: Interfaz Swagger UI accesible en `/docs`
- **Validación de datos**: Modelos Pydantic para garantizar la integridad de los datos
- **Gestión de proveedores**: Soporte para los proveedores específicos requeridos

## Estructura del proyecto

```
fastapi_middleware/
├── app/
│   ├── core/
│   │   ├── config.py         # Configuración de la aplicación
│   │   ├── odoo_client.py    # Cliente para comunicación con Odoo
│   │   └── security.py       # Funciones de seguridad y JWT
│   ├── models/
│   │   ├── auth.py           # Modelos para autenticación
│   │   ├── category.py       # Modelos para categorías
│   │   ├── product.py        # Modelos para productos
│   │   └── supplier.py       # Modelos para proveedores
│   ├── routes/
│   │   ├── auth.py           # Endpoints de autenticación
│   │   ├── categories.py     # Endpoints de categorías
│   │   ├── products.py       # Endpoints de productos
│   │   └── suppliers.py      # Endpoints de proveedores
│   └── services/
│       ├── auth.py           # Servicios de autenticación
│       ├── category.py       # Servicios de categorías
│       ├── product.py        # Servicios de productos
│       └── supplier.py       # Servicios de proveedores
├── main.py                   # Punto de entrada de la aplicación
├── requirements.txt          # Dependencias del proyecto
└── start_server.sh           # Script para iniciar el servidor
```

## Requisitos

- Python 3.8+
- Odoo 18.0 en ejecución
- Módulo `odoo_api_rest` instalado en Odoo
- Módulo `pelotazo` instalado en Odoo

## Instalación

1. Clonar el repositorio
2. Crear un entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

## Configuración

Editar el archivo `.env` o configurar las variables de entorno:

```
ODOO_URL=http://localhost:8069
ODOO_DB=odoo_pelotazo
ODOO_USERNAME=admin
ODOO_PASSWORD=admin
SECRET_KEY=pelotazo_secret_key_change_in_production
```

## Ejecución

```bash
./start_server.sh
```

O manualmente:

```bash
python main.py
```

El servidor estará disponible en http://localhost:8000

## Documentación de la API

La documentación interactiva de la API está disponible en:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Proveedores

El sistema asegura la disponibilidad de los siguientes proveedores:

- Abrila
- Aguaconfort
- Becken
- Tegaluxe
- EAS-Johnson
- Ufesa
- Vitrokitchen
- Nevir
- Mielectro
- Electrodirecto

## Integración con el frontend

El frontend Next.js debe configurarse para comunicarse con esta API en lugar de directamente con Odoo. Actualizar la URL base en la configuración del frontend:

```typescript
// En el archivo de configuración del frontend
const API_URL = 'http://localhost:8000/api/v1';
```
