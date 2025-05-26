# Documentación Completa del Proyecto El Pelotazo

## 1. Descripción General del Proyecto

El Pelotazo es un proyecto de comercio electrónico para una tienda de electrodomésticos que integra Odoo como backend con Next.js como frontend. El sistema está diseñado para proporcionar tanto una tienda online como un panel de administración personalizado (CRM/ERP) que facilite la gestión del negocio.

## 2. Objetivos del Proyecto

1. Desarrollar un panel de administración personalizado y fácil de usar para la dueña del negocio
2. Implementar un sistema OCR para procesamiento de facturas y albaranes
3. Integrar con sistemas de TPV y lectores de códigos de barras
4. Importar datos de proveedores y productos desde archivos existentes
5. Mantener Odoo como backend robusto mientras se ofrece una experiencia de usuario moderna

## 3. Stack Tecnológico

### 3.1 Backend (Odoo)
- **Odoo**: Versión 18.0 Community Edition
- **Python**: Versión 3.10+
- **PostgreSQL**: Versión 14+
- **Módulo personalizado**: `pelotazo` (ubicado en `/home/espasiko/odoo/custom_addons/pelotazo`)

### 3.2 Frontend (Next.js)
- **Next.js**: Versión 14.0.4
- **React**: Versión 18.2+
- **TypeScript**: Versión 5.1+
- **Refine**: Versión 4.0+ (para el panel de administración)
- **NextUI**: Versión 2.0+ (para componentes de UI)

### 3.3 Herramientas de Integración
- **Axios**: Para llamadas HTTP
- **React Query**: Para gestión de estado y caché
- **JWT**: Para autenticación segura

### 3.4 Herramientas OCR y Procesamiento de Imágenes (Planificadas)
- **Tesseract OCR**: Para reconocimiento de texto en imágenes
- **OpenCV**: Para procesamiento de imágenes
- **Hugging Face Transformers**: Para modelos OCR avanzados

## 4. Estructura del Proyecto

### 4.1 Estructura de Directorios

```
/home/espasiko/odoo/
│── odoo/                           # Repositorio oficial de Odoo 18.0
│── odoo-venv/                      # Entorno virtual de Python para Odoo
│── custom_addons/                  # Módulos personalizados de Odoo
│   └── pelotazo/                   # Módulo principal del proyecto
│       ├── __init__.py             # Inicializador del módulo
│       ├── __manifest__.py         # Manifiesto del módulo
│       ├── controllers/            # Controladores para API REST
│       │   ├── __init__.py
│       │   └── main.py             # Controlador principal con endpoints API
│       ├── models/                 # Modelos de datos
│       │   ├── __init__.py
│       │   └── product.py          # Extensión del modelo de productos
│       ├── static/                 # Archivos estáticos
│       └── views/                  # Vistas XML
│── odoo-nextjs-frontend-new/       # Frontend con Next.js
│   ├── src/
│   │   ├── authProvider.ts         # Proveedor de autenticación para Refine
│   │   ├── providers/
│   │   │   └── odooDataProvider.ts # Proveedor de datos para Refine
│   │   ├── pages/                  # Páginas de la aplicación
│   │   └── components/             # Componentes reutilizables
│   ├── .env.local                  # Variables de entorno locales
│   └── package.json                # Dependencias del proyecto
│── jsons/                          # Archivos JSON con datos de productos
│── start_odoo.sh                   # Script para iniciar Odoo
└── pg_manager.sh                   # Script para gestionar PostgreSQL
```

### 4.2 Estructura de la Base de Datos

La base de datos principal es PostgreSQL con el nombre `odoo_pelotazo`. Las tablas principales incluyen:

- `product_template`: Productos con campos personalizados
- `product_category`: Categorías de productos
- `res_partner`: Proveedores y clientes
- `sale_order`: Pedidos de venta
- `account_invoice`: Facturas

## 5. Componentes Principales

### 5.1 Módulo Pelotazo (Backend)

El módulo `pelotazo` extiende la funcionalidad de Odoo con:

1. **Campos personalizados para productos**:
   - `x_nombre_proveedor`: Nombre del proveedor
   - `x_marca`: Marca del producto
   - `x_precio_venta_web`: Precio específico para la web
   - `x_beneficio`: Porcentaje de beneficio calculado

2. **API REST**:
   - `/api/v1/auth`: Endpoint para autenticación
   - `/api/v1/products`: Endpoint para listar productos
   - `/api/v1/products/<id>`: Endpoint para obtener detalles de un producto

### 5.2 Frontend Next.js

El frontend está desarrollado con Next.js y Refine, proporcionando:

1. **Autenticación**: Sistema de login con JWT
2. **Panel de Administración**: Interfaz para gestionar productos, proveedores, etc.
3. **Tienda Online**: Interfaz para clientes (en desarrollo)

#### 5.2.1 Proveedor de Autenticación

El archivo `authProvider.ts` gestiona la autenticación con Odoo mediante:
- Login con credenciales de Odoo
- Almacenamiento de token en localStorage
- Verificación de sesión

#### 5.2.2 Proveedor de Datos

El archivo `odooDataProvider.ts` proporciona métodos para interactuar con la API de Odoo:
- `getList`: Obtener listas de recursos (productos, etc.)
- `getOne`: Obtener un recurso específico
- `create`: Crear nuevos recursos
- `update`: Actualizar recursos existentes
- `deleteOne`: Eliminar recursos

## 6. Configuración y Credenciales

### 6.1 Base de Datos PostgreSQL
- **Nombre**: `odoo_pelotazo`
- **Usuario**: `odoo`
- **Contraseña**: `odoo`
- **Host**: `localhost`

### 6.2 Odoo
- **URL**: `http://localhost:8069`
- **Base de datos**: `odoo_pelotazo`
- **Usuario**: `admin`
- **Contraseña**: `admin`
- **API Key de usuario**: `ef55bc09043886f5302c7966a5bac5133b9089db`

### 6.3 Frontend Next.js
- **URL de desarrollo**: `http://localhost:3000`
- **Variables de entorno**:
  - `VITE_ODOO_API_URL=http://localhost:8069`
  - `VITE_ODOO_DB=odoo_pelotazo`
  - `VITE_ODOO_USERNAME=admin`
  - `VITE_ODOO_PASSWORD=admin`

## 7. Flujo de Trabajo del Proyecto

### 7.1 Flujo de Datos
1. Los datos de productos se importan desde archivos JSON en la carpeta `/home/espasiko/odoo/jsons/`
2. Estos datos se procesan y se cargan en la base de datos PostgreSQL de Odoo
3. El frontend Next.js consume estos datos a través de la API REST de Odoo
4. Los usuarios interactúan con el frontend para ver productos, realizar pedidos, etc.
5. Los administradores utilizan el panel de administración para gestionar el negocio

### 7.2 Flujo de Autenticación
1. El usuario ingresa credenciales en el frontend
2. El frontend envía estas credenciales a la API de Odoo
3. Odoo verifica las credenciales y devuelve un token
4. El frontend almacena el token y lo utiliza para futuras solicitudes

## 8. Estado Actual del Proyecto

### 8.1 Componentes Implementados
- ✅ Configuración básica de Odoo 18.0
- ✅ Módulo personalizado `pelotazo` con campos específicos
- ✅ API REST básica para productos y autenticación
- ✅ Estructura del frontend con Next.js y Refine
- ✅ Proveedores de autenticación y datos para Refine

### 8.2 Componentes en Desarrollo
- 🔄 Interfaz de usuario del panel de administración
- 🔄 Tienda online para clientes
- 🔄 Sistema de importación de datos desde JSON/Excel

### 8.3 Componentes Pendientes
- ❌ Sistema OCR para procesamiento de documentos
- ❌ Integración con TPV y códigos de barras
- ❌ Funcionalidades avanzadas de búsqueda y recomendaciones

## 9. Plan de Desarrollo Futuro

El plan de desarrollo se divide en 6 fases:

1. **Configuración del Entorno** (Completado parcialmente)
2. **Normalización e Importación de Datos** (En progreso)
3. **Desarrollo del Panel de Administración con Refine** (En progreso)
4. **Integración de OCR y Sistemas Externos** (Pendiente)
5. **Tienda Dinámica y Funcionalidades Avanzadas** (Pendiente)
6. **Pruebas y Despliegue** (Pendiente)

## 10. Herramientas y Puertos Utilizados

### 10.1 Servidores
- **Odoo**: Puerto 8069
- **Next.js (desarrollo)**: Puerto 3000
- **PostgreSQL**: Puerto 5432

### 10.2 Herramientas de Desarrollo
- **Visual Studio Code**: Editor principal
- **pgAdmin/DBeaver**: Gestión de PostgreSQL
- **Postman**: Pruebas de API

### 10.3 Scripts Útiles
- `start_odoo.sh`: Inicia el servidor de Odoo
- `pg_manager.sh`: Herramienta para gestionar la base de datos PostgreSQL

## 11. Proveedores y Datos de Productos

El sistema está diseñado para trabajar con múltiples proveedores de electrodomésticos, incluyendo:

1. Abrila
2. Aguaconfort
3. Becken-Tegaluxe
4. EAS-Johnson
5. Ufesa
6. Vitrokitchen
7. Nevir
8. Mielectro
9. Electrodirecto
10. Jata

Los datos de estos proveedores se encuentran en archivos JSON en la carpeta `/home/espasiko/odoo/jsons/`, con nombres como `PVP ABRILA_extracted.json`.

## 12. Referencias y Recursos

### 12.1 Documentación Oficial
- [Documentación de Odoo 18](https://www.odoo.com/documentation/18.0/)
- [Guía de desarrollo de Odoo](https://www.odoo.com/documentation/18.0/developer.html)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Refine](https://refine.dev/docs/)

### 12.2 Temas para Odoo
- [Temas gratuitos para Odoo 18](https://apps.odoo.com/apps/themes?price=Free&series=18.0)

### 12.3 Recursos Adicionales
- [Foro de la comunidad de Odoo](https://www.odoo.com/forum/help-1)
- [GitHub de Refine](https://github.com/refinedev/refine)

## 13. Solución de Problemas Comunes

### 13.1 Problemas de Conexión con PostgreSQL
Si hay problemas de conexión con PostgreSQL, verificar:
- Que el servicio PostgreSQL esté en ejecución
- Que el usuario `odoo` tenga los permisos adecuados
- Que la contraseña sea correcta

### 13.2 Problemas con la API de Odoo
Si hay problemas con la API de Odoo:
- Verificar que el módulo `pelotazo` esté instalado correctamente
- Comprobar que los endpoints estén correctamente definidos
- Revisar los logs de Odoo para errores específicos

### 13.3 Problemas con el Frontend
Si hay problemas con el frontend Next.js:
- Verificar que las variables de entorno estén correctamente configuradas
- Comprobar que la API de Odoo esté accesible
- Revisar la consola del navegador para errores específicos

---

*Documento generado el 23 de mayo de 2025*
