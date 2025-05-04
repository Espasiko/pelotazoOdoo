# Plan de Implementación - El Pelotazo

## Resumen del Proyecto

Desarrollo de una tienda online y sistema de gestión (CRM/ERP) para "El Pelotazo", una tienda física de electrodomésticos ubicada en Roquetas de Mar, España.

## Requisitos Principales

### Tienda Online
- Catálogo de productos con filtros por marca, precio y categoría
- Sistema de reserva con pago del 30% inicial
- Cálculo automático de costes de envío (gratis hasta 15km de Roquetas de Mar)
- Integración con financiación Santander y Pepper
- Diseño según la imagen proporcionada

### Panel de Administración
- Gestión completa de productos, categorías y marcas
- Optimización SEO de productos
- Gestión de pedidos y reservas
- Facturación manual y electrónica
- Integración con lectores de códigos de barras
- Sistema de backup automático diario (21:00h)
- Herramienta de migración desde Excel/CSV
- Sistema OCR para extraer datos de facturas en PDF
- Diseño según la imagen proporcionada del dashboard

## Arquitectura Técnica

### Frontend
- **Framework**: React con Vite
- **Framework de Administración**: Refine
- **UI**: Material-UI para componentes
- **Estado**: React Context API / Redux
- **Rutas**: React Router

### Backend
- **Plataforma**: PocketBase (Go)
- **Base de datos**: SQLite (integrada en PocketBase)
- **Puertos**: 8092 (API), 8093 (Admin)

## Estructura de Base de Datos

### Colecciones en PocketBase

1. **productos**
   - id, nombre, descripción, descripción_seo, precio, marca_id, categoria_id, stock, imagen, visible, destacado, codigo_barras

2. **categorias**
   - id, nombre, descripción, imagen, visible

3. **marcas**
   - id, nombre, logo, visible

4. **clientes**
   - id, nombre, apellidos, email, teléfono, dirección, código_postal, ciudad, provincia, distancia_tienda

5. **pedidos**
   - id, cliente_id, fecha, estado, total, pago_inicial, pago_restante, método_pago, financiado, entidad_financiera

6. **pedido_productos**
   - id, pedido_id, producto_id, cantidad, precio_unitario

7. **facturas**
   - id, pedido_id, número, fecha, total, estado, pdf_url

8. **proveedores**
   - id, nombre, contacto, email, teléfono, dirección

9. **compras**
   - id, proveedor_id, fecha, total, estado

10. **compra_productos**
    - id, compra_id, producto_id, cantidad, precio_unitario

11. **configuracion**
    - id, nombre, valor (para almacenar configuraciones del sistema)

## Plan de Implementación por Fases

### Fase 1: Configuración del Proyecto (Semana 1)

1. **Inicialización del Frontend**
   - Crear proyecto React con Vite
   - Configurar Refine
   - Instalar dependencias necesarias
   - Configurar estructura de carpetas

2. **Configuración del Backend**
   - Descargar e instalar PocketBase
   - Configurar puertos (8092/8093)
   - Crear estructura inicial de la base de datos

### Fase 2: Implementación del Backend (Semana 2-3)

1. **Diseño de Colecciones**
   - Crear todas las colecciones en PocketBase
   - Definir relaciones entre colecciones
   - Configurar reglas de validación

2. **Implementación de API**
   - Configurar endpoints para CRUD
   - Implementar autenticación y autorización
   - Crear funciones para cálculo de distancias
   - Implementar lógica de reservas y pagos parciales

3. **Sistema de Backup**
   - Configurar backup automático diario a las 21:00h

### Fase 3: Panel de Administración (Semana 4-6)

1. **Autenticación y Dashboard**
   - Implementar login para administradores
   - Crear dashboard principal según diseño proporcionado
   - Implementar widgets de resumen (ventas, clientes, productos, entregas)

2. **Gestión de Productos**
   - CRUD completo de productos
   - Gestión de categorías y marcas
   - Optimización SEO
   - Gestión de visibilidad y productos destacados

3. **Gestión de Pedidos**
   - Listado y detalle de pedidos
   - Seguimiento de estado
   - Gestión de pagos (inicial y restante)

4. **Facturación**
   - Generación manual de facturas
   - Integración con sistema de facturación electrónica
   - Exportación de facturas en PDF

5. **Integración con Lectores de Códigos**
   - Implementar API para recibir datos de lectores
   - Gestión de inventario mediante códigos de barras

6. **Herramienta de Migración**
   - Crear interfaz para importar datos desde Excel
   - Implementar mapeo de campos
   - Validación de datos importados

### Fase 4: Tienda Online (Semana 7-9)

1. **Diseño e Implementación**
   - Crear layout según diseño proporcionado
   - Implementar página de inicio
   - Crear componentes reutilizables

2. **Catálogo de Productos**
   - Listado de productos con filtros
   - Página de detalle de producto
   - Búsqueda por marca, precio y categoría

3. **Sistema de Reserva**
   - Implementar carrito de compra
   - Proceso de checkout
   - Cálculo de costes de envío basado en distancia
   - Integración con pasarelas de pago

4. **Financiación**
   - Integración con Santander y Pepper
   - Calculadora de financiación

### Fase 5: Integración y Pruebas (Semana 10-11)

1. **Integración de Sistemas**
   - Conectar tienda online con panel de administración
   - Pruebas de integración

2. **Pruebas de Usuario**
   - Pruebas de usabilidad
   - Corrección de errores

3. **Optimización**
   - Mejoras de rendimiento
   - Optimización SEO

### Fase 6: Despliegue y Formación (Semana 12)

1. **Despliegue**
   - Configuración de servidor de producción
   - Despliegue de aplicación

2. **Formación**
   - Capacitación al personal
   - Documentación de uso

3. **Soporte Inicial**
   - Período de soporte post-lanzamiento

## Estructura de Carpetas del Proyecto

```
/
├── frontend/
│   ├── admin/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── App.jsx
│   │   ├── public/
│   │   └── package.json
│   └── tienda/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── utils/
│       │   └── App.jsx
│       ├── public/
│       └── package.json
├── backend/
│   ├── pb_data/
│   ├── pb_migrations/
│   ├── backups/
│   └── pocketbase.exe
├── docs/
│   ├── manual_usuario.pdf
│   └── manual_tecnico.pdf
└── ejemplos/
    └── (archivos CSV y PDF existentes)
```

## Herramientas y Tecnologías Específicas

- **Frontend**: React, Vite, Refine, Material-UI, React Router
- **Backend**: PocketBase
- **Base de datos**: SQLite (integrada en PocketBase)
- **Gestión de Estado**: React Context API / Redux
- **Estilos**: Styled Components / Emotion
- **Formularios**: React Hook Form
- **Validación**: Yup / Zod
- **Gráficos**: Recharts
- **Mapas**: Leaflet (para cálculo de distancias)
- **Pasarelas de Pago**: Stripe / Redsys
- **Facturación Electrónica**: API propia compatible con normativa española
- **OCR**: Tesseract.js / PDF.js para extracción de datos de facturas

## Consideraciones Adicionales

1. **Migración de Datos**
   - Se creará una herramienta específica para importar los datos desde archivos Excel y CSV
   - Se implementará validación y limpieza de datos durante la importación
   - Sistema OCR para extraer datos de facturas en formato PDF

2. **Backup y Seguridad**
   - Backup automático diario a las 21:00h
   - Cifrado de datos sensibles
   - Implementación de roles y permisos

3. **Cumplimiento Legal**
   - RGPD para datos de clientes
   - Normativa de facturación electrónica española
   - Información sobre opciones de financiación y entregas en la tienda

4. **Mantenimiento**
   - Plan de actualizaciones periódicas
   - Monitorización de rendimiento
   - Soporte técnico

## Próximos Pasos Inmediatos

1. Configurar entorno de desarrollo
2. Inicializar proyecto React con Vite y Refine
3. Configurar PocketBase
4. Diseñar estructura inicial de la base de datos
5. Implementar prototipo básico del panel de administración