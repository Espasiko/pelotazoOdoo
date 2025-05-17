# Integración de Odoo para El Pelotazo

Este directorio contiene la implementación de Odoo como backend para El Pelotazo, una tienda de electrodomésticos, con una interfaz personalizada desarrollada en Next.js y React.

## Estructura del Proyecto

- `/odoo-nextjs-frontend`: Aplicación Next.js que se conecta a Odoo
- `/custom_addons/odoo_api_rest`: Módulo personalizado de Odoo para exponer una API REST

## Componentes Principales

### Frontend (Next.js)

La aplicación frontend está desarrollada con Next.js y React, utilizando:
- React Query para la gestión del estado
- Hooks personalizados para la comunicación con Odoo
- Componentes de cliente y servidor separados para cumplir con las restricciones de Next.js App Router

### Backend (Odoo)

El backend está basado en Odoo Community Edition e incluye:
- Módulo personalizado para exponer una API REST
- Controladores para productos, clientes y órdenes
- Modelos extendidos para incluir campos específicos para El Pelotazo

## Configuración

Para configurar el entorno de desarrollo:

1. **Instalar Odoo**:
   - Clonar el repositorio oficial de Odoo (versión 18.0)
   - Instalar las dependencias necesarias
   - Configurar PostgreSQL

2. **Instalar el módulo personalizado**:
   - Copiar el directorio `custom_addons/odoo_api_rest` a la carpeta de addons de Odoo
   - Actualizar la lista de módulos en Odoo
   - Instalar el módulo "Odoo API REST"

3. **Configurar el frontend**:
   - Instalar las dependencias con `npm install`
   - Configurar las variables de entorno en `.env.local`
   - Iniciar el servidor de desarrollo con `npm run dev`

## Desarrollo

Para continuar el desarrollo de este proyecto, consulta el archivo `PLAN_ODOO.md` en el directorio raíz del repositorio, que contiene el plan detallado de implementación.

## Contacto

Para más información, contacta con el equipo de desarrollo de El Pelotazo.
