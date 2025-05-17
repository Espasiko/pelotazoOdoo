# Plan de Implementación de Odoo para El Pelotazo

## Resumen Ejecutivo

Este documento detalla el plan de implementación de Odoo como backend para El Pelotazo, una tienda de electrodomésticos, con una interfaz personalizada desarrollada en Next.js y React. El objetivo es aprovechar las capacidades de Odoo para la gestión de inventario, ventas y compras, mientras se mantiene una interfaz de usuario moderna y adaptada a las necesidades específicas del negocio.

## Situación Actual

El Pelotazo actualmente utiliza:
- **PocketBase** como base de datos
- **Next.js/React** para el frontend
- **Sistema OCR propio** basado en Tesseract.js y PDF.js para procesar facturas
- **Sistema de importación** para productos de diferentes proveedores

## Objetivos del Proyecto

1. Migrar de PocketBase a Odoo Community Edition
2. Mantener y mejorar la interfaz personalizada con Next.js/React
3. Integrar el sistema OCR existente con Odoo
4. Adaptar el sistema de importación para trabajar con Odoo
5. Implementar funcionalidades adicionales (POS, reservas, etc.)
6. Garantizar el cumplimiento del RGPD

## Arquitectura Propuesta

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Frontend       │     │  API REST       │     │  Odoo           │
│  Next.js/React  │────▶│  Personalizada  │────▶│  (PostgreSQL)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                                                ▲
        │                                                │
        │                                                │
        │                                                │
┌─────────────────┐                            ┌─────────────────┐
│                 │                            │                 │
│  Sistema OCR    │                            │  Sistema de     │
│  (Tesseract.js) │                            │  Importación    │
│                 │                            │                 │
└─────────────────┘                            └─────────────────┘
```

## Plan de Implementación

### Fase 1: Configuración y Migración (4 semanas)

#### Semana 1: Configuración del Entorno Local de Odoo
- Instalar Odoo 18.0 Community Edition
- Configurar PostgreSQL para Odoo
- Instalar módulos básicos (Inventario, Ventas, Compras, Contactos)
- Configurar entorno de desarrollo

#### Semana 2: Desarrollo de Modelos Personalizados
- Crear módulo personalizado para El Pelotazo
- Extender modelos existentes con campos específicos:
  - Añadir `nombre_proveedor` a `product.template`
  - Añadir campos para gestión de reservas y pagos parciales
- Desarrollar API REST personalizada para Odoo

#### Semana 3: Adaptación del Sistema de Importación
- Adaptar el sistema de importación existente para Odoo
- Reutilizar parsers existentes para diferentes proveedores
- Modificar la capa de base de datos para trabajar con la API de Odoo

#### Semana 4: Migración de Datos
- Desarrollar scripts de migración de PocketBase a Odoo
- Migrar productos, proveedores, categorías y clientes
- Validar la integridad de los datos migrados

### Fase 2: Integración del Sistema OCR (3 semanas)

#### Semana 5: Análisis y Adaptación
- Analizar el sistema OCR existente
- Identificar puntos de integración con Odoo
- Diseñar la arquitectura de integración

#### Semana 6: Desarrollo de la Integración
- Adaptar el sistema OCR para trabajar con Odoo
- Desarrollar endpoints para procesar facturas y albaranes
- Implementar la lógica de extracción y almacenamiento de datos

#### Semana 7: Pruebas y Optimización
- Realizar pruebas con diferentes tipos de documentos
- Optimizar la precisión del OCR
- Documentar el proceso de integración

### Fase 3: Desarrollo de Interfaces (4 semanas)

#### Semana 8-9: Desarrollo de Componentes Básicos
- Crear componentes para gestión de productos
- Desarrollar interfaces para proveedores y clientes
- Implementar sistema de autenticación

#### Semana 10-11: Funcionalidades Avanzadas
- Desarrollar sistema de punto de venta (POS)
- Implementar sistema de reservas con pago parcial (30%)
- Crear interfaz para gestión de facturas y albaranes

### Fase 4: Seguridad y Cumplimiento (2 semanas)

#### Semana 12: Implementación de Seguridad
- Configurar permisos y roles en Odoo
- Implementar autenticación segura entre Next.js y Odoo
- Revisar y mejorar la seguridad general del sistema

#### Semana 13: Cumplimiento RGPD
- Implementar políticas de privacidad
- Configurar gestión de consentimientos
- Asegurar el cumplimiento de la normativa de protección de datos

### Fase 5: Pruebas y Lanzamiento (3 semanas)

#### Semana 14: Pruebas Integrales
- Realizar pruebas de integración de todos los componentes
- Verificar la funcionalidad completa del sistema
- Identificar y corregir errores

#### Semana 15: Formación y Documentación
- Preparar materiales de formación para la dueña
- Documentar el sistema completo
- Realizar sesiones de formación

#### Semana 16: Lanzamiento
- Migrar a producción (Hostinger VPS)
- Realizar pruebas finales en el entorno de producción
- Lanzamiento oficial del sistema

## Mapeo de Colecciones de PocketBase a Modelos de Odoo

### 1. Productos (`productos`)

**En PocketBase**: Tiene campos como código, nombre, descripción, precio_venta, precio_compra, iva, stock_actual, etc.

**Mapeo a Odoo**:
- **Modelo**: `product.template` y `product.product`
- **Campos principales**:
  - `default_code` → código
  - `name` → nombre
  - `description` → descripción
  - `list_price` → precio_venta
  - `standard_price` → precio_compra
  - `taxes_id` → iva (relación con impuestos)
  - `qty_available` → stock_actual
  - `nombre_proveedor` → Campo personalizado a crear

**Campos adicionales a crear**:
- `pvp_web` (para el precio en la tienda online)
- `porcentaje_deposito` (para el 30% de reserva)

### 2. Proveedores (`proveedores`)

**En PocketBase**: Tiene campos como nombre, contacto, teléfono, etc.

**Mapeo a Odoo**:
- **Modelo**: `res.partner` (con `supplier_rank > 0`)
- **Campos principales**:
  - `name` → nombre
  - `phone` → teléfono
  - `email` → email
  - `supplier_rank` → 1 (para marcar como proveedor)

### 3. Clientes (`clientes`)

**En PocketBase**: Datos de clientes

**Mapeo a Odoo**:
- **Modelo**: `res.partner` (con `customer_rank > 0`)
- **Campos principales**:
  - `name` → nombre
  - `phone` → teléfono
  - `email` → email
  - `customer_rank` → 1 (para marcar como cliente)

### 4. Facturas (`facturas`)

**En PocketBase**: Facturas con número, fecha, total, iva, etc.

**Mapeo a Odoo**:
- **Modelo**: `account.move` (para facturas)
- **Campos principales**:
  - `name` → numero_factura
  - `invoice_date` → fecha_emision
  - `amount_total` → total
  - `amount_tax` → iva_total

### 5. Gastos e Ingresos (`gastos`, `ingresos`)

**En PocketBase**: Registros de gastos e ingresos

**Mapeo a Odoo**:
- **Modelo**: `account.move` (con diferentes tipos)
- **Campos principales**:
  - `move_type` → 'in_invoice' para gastos, 'out_invoice' para ingresos
  - Otros campos similares a facturas

## Adaptación del Sistema de Importación

El sistema de importación actual está bien estructurado y puede adaptarse para trabajar con Odoo:

1. **Mantener la estructura modular**:
   - `core/`: Lógica principal de importación
   - `db/`: Adaptar para interactuar con Odoo en lugar de PocketBase
   - `parsers/`: Reutilizar los parsers existentes
   - `scripts/`: Adaptar para trabajar con Odoo

2. **Cambios necesarios**:
   - Reemplazar las llamadas a PocketBase por llamadas a la API de Odoo
   - Adaptar la lógica de creación/actualización de productos
   - Modificar la gestión de categorías y proveedores

3. **Nuevas funcionalidades**:
   - Importación de precios de coste y venta
   - Actualización de stock
   - Gestión de impuestos

## Integración del Sistema OCR

El sistema OCR existente puede integrarse con Odoo:

1. **Componentes a reutilizar**:
   - Procesamiento de PDF con PDF.js
   - Reconocimiento de texto con Tesseract.js
   - Extracción de datos con expresiones regulares

2. **Nuevos componentes**:
   - Integración con el módulo de contabilidad de Odoo
   - Creación automática de facturas de proveedor
   - Asociación con órdenes de compra

3. **Flujo de trabajo**:
   - Escaneo de factura → OCR → Extracción de datos → Creación en Odoo

## Despliegue y Seguridad

### Opciones de Despliegue

Se utilizará Hostinger VPS para el despliegue:

1. **Requisitos**:
   - Plan VPS con al menos 4GB de RAM
   - Instalación de PostgreSQL y Odoo
   - Configuración de dominio y SSL

2. **Configuración**:
   - Servidor Linux (Ubuntu 22.04 LTS)
   - PostgreSQL 14 o superior
   - Odoo 18.0 Community Edition
   - Nginx como proxy inverso

### Seguridad y Cumplimiento RGPD

1. **Medidas de seguridad**:
   - Autenticación de dos factores
   - Cifrado de datos sensibles
   - Copias de seguridad cifradas

2. **Cumplimiento RGPD**:
   - Política de privacidad clara
   - Gestión de consentimientos
   - Capacidad para exportar/eliminar datos de clientes

## Conclusión

Este plan proporciona una hoja de ruta clara para la implementación de Odoo en El Pelotazo, aprovechando el trabajo ya realizado y adaptándolo a la nueva plataforma. La migración se realizará de manera gradual, asegurando que cada fase se complete correctamente antes de pasar a la siguiente.

El resultado final será un sistema integrado que combina la potencia de Odoo como backend con una interfaz personalizada desarrollada en Next.js y React, proporcionando una solución completa para la gestión del negocio.

## Próximos Pasos Inmediatos

1. Configurar el entorno local de Odoo
2. Crear el módulo personalizado para El Pelotazo
3. Comenzar la adaptación del sistema de importación

---

*Documento creado el 17 de mayo de 2025*
