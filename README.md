# El Pelotazo - Sistema de Tienda Online y Gestión

Este proyecto implementa una solución completa para la tienda "El Pelotazo", incluyendo una tienda online y un panel de administración (CRM/ERP).

## Características

### Tienda Online
- Catálogo de productos con filtros por marca, precio y categoría
- Sistema de reserva con pago del 30% inicial
- Cálculo automático de costes de envío (gratis hasta 15km de Roquetas de Mar)
- Integración con financiación Santander y Pepper

### Panel de Administración
- Gestión completa de productos, categorías y marcas
- Optimización SEO de productos
- Gestión de pedidos y reservas
- Facturación manual y electrónica
- Integración con lectores de códigos de barras
- Sistema de backup automático diario
- Herramienta de migración desde Excel

## Estructura del Proyecto

```
/
│── frontend/           # Aplicación React con Refine
│   │── admin/          # Panel de administración
│   └── tienda/         # Tienda online
│── backend/            # Backend con PocketBase
│   │── pb_data/        # Datos de PocketBase
│   │── pb_migrations/  # Migraciones de PocketBase
│   └── importacion/    # Sistema de importación de datos
│       │── core/        # Lógica principal de importación
│       │── db/          # Interacción con PocketBase
│       │── parsers/     # Parsers para diferentes proveedores
│       └── scripts/     # Scripts de actualización
└── docs/              # Documentación
```

## Tecnologías

- **Frontend**: React, Vite, Refine, Material-UI
- **Backend**: PocketBase (Go)
- **Base de datos**: SQLite (integrada en PocketBase)

## Instalación y Configuración

1. Clonar el repositorio
2. Instalar dependencias del frontend: `cd frontend && npm install`
3. Iniciar el servidor de desarrollo: `npm run dev`
4. Iniciar PocketBase: `cd backend && ./pocketbase serve`

## Migración e Importación de Datos

El sistema incluye una herramienta de migración para importar datos desde los archivos Excel existentes. Acceda a esta funcionalidad desde el panel de administración en la sección "Migración".

### Sistema de Importación

El sistema de importación ha sido refactorizado con una arquitectura modular para mejorar su mantenibilidad:

- **Core**: Contiene la lógica principal de importación, procesamiento de archivos e importación a la base de datos.
- **DB**: Módulos para interactuar con PocketBase, gestionando proveedores, productos, categorías e importaciones.
- **Parsers**: Parsers específicos para diferentes proveedores, con un parser genérico universal para formatos no estandarizados.
- **Scripts**: Scripts de actualización y mantenimiento del sistema.

Para importar datos, puede usar el servidor de importación que se ejecuta en el puerto 3100 o utilizar directamente las funciones del módulo `core`.

## Backup Automático

El sistema realiza backups automáticos diarios a las 21:00h. Los backups se almacenan en la carpeta `/backend/backups/`.

## Licencia

Propiedad de El Pelotazo. Todos los derechos reservados.