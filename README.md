# Integración de Odoo con Next.js y React

Este proyecto demuestra cómo integrar Odoo como backend con Next.js y React como frontend para crear aplicaciones web modernas y personalizadas.

## Estructura del Proyecto

- `/odoo`: Repositorio oficial de Odoo (versión 18.0)
- `/odoo-nextjs-frontend`: Aplicación Next.js que se conecta a Odoo mediante su API

## Requisitos

- Node.js 18+ y npm
- Python 3.8+
- PostgreSQL

## Configuración de Odoo

1. Instalar las dependencias de Odoo:

```bash
cd /home/espasiko/odoo/odoo
pip install -r requirements.txt
```

2. Configurar la base de datos PostgreSQL para Odoo.

3. Iniciar el servidor de Odoo:

```bash
cd /home/espasiko/odoo/odoo
python odoo-bin --addons-path=addons -d odoo -i base --db_host=localhost --db_port=5432 --db_user=odoo --db_password=odoo
```

## Configuración del Frontend Next.js

1. Instalar las dependencias:

```bash
cd /home/espasiko/odoo/odoo-nextjs-frontend
npm install
```

2. Configurar las variables de entorno en `.env.local`:

```
NEXT_PUBLIC_ODOO_API_URL=http://localhost:8069
NEXT_PUBLIC_ODOO_DB=odoo
NEXT_PUBLIC_ODOO_USERNAME=admin
NEXT_PUBLIC_ODOO_PASSWORD=admin
```

3. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

4. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Características de la Integración

- **Autenticación**: Conexión segura con el backend de Odoo
- **Gestión de Datos**: Uso de React Query para manejar el estado y las consultas
- **Operaciones CRUD**: Crear, leer, actualizar y eliminar registros en Odoo
- **UI Moderna**: Interfaz de usuario moderna y responsiva con Tailwind CSS

## Estructura del Frontend

- `/src/services`: Servicios para conectarse a la API de Odoo
- `/src/hooks`: Hooks personalizados para interactuar con Odoo
- `/app/products`: Página de ejemplo para gestionar productos

## Desarrollo de Módulos Personalizados

Para desarrollar módulos personalizados de Odoo:

1. Crear un directorio para el módulo en `/home/espasiko/odoo/odoo/addons/custom_modules/`
2. Seguir la estructura estándar de módulos de Odoo
3. Incluir los controladores necesarios para exponer las APIs que utilizará el frontend

## Recursos Adicionales

- [Documentación de Odoo](https://www.odoo.com/documentation/18.0/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de React Query](https://tanstack.com/query/latest/docs/react/overview)
