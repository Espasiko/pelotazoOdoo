# Módulo El Pelotazo para Odoo

Este módulo personalizado añade campos y funcionalidades específicas para la tienda de electrodomésticos El Pelotazo, permitiendo la migración de datos desde PocketBase a Odoo.

## Características

- Campos personalizados para productos (P.V.P. Web, descuentos, beneficios, etc.)
- Campos personalizados para proveedores
- Vistas adaptadas para mostrar la información específica de El Pelotazo
- Script de importación para cargar datos desde archivos CSV

## Instalación

1. Copiar el módulo a la carpeta `custom_addons` de Odoo
2. Reiniciar el servidor Odoo
3. Ir a Aplicaciones > Actualizar lista de aplicaciones
4. Buscar "El Pelotazo" e instalar el módulo

## Uso del script de importación

El script de importación está diseñado para cargar los datos de los archivos CSV de PVP ALMCE a Odoo.

### Requisitos

- Odoo 18 instalado y funcionando
- Base de datos PostgreSQL configurada
- Archivos CSV de PVP ALMCE disponibles en la carpeta `/home/espasiko/pelotanew/ejemplos`

### Ejecución

```bash
cd /home/espasiko/odoo
source odoo-venv/bin/activate
python /home/espasiko/odoo/custom_addons/pelotazo/scripts/import_almce.py
```

### Mapeo de campos

El script mapea los campos de los archivos CSV a los campos de Odoo de la siguiente manera:

| Campo CSV | Campo Odoo |
|-----------|------------|
| CÓDIGO | default_code |
| DESCRIPCIÓN | name |
| IMPORTE BRUTO | standard_price |
| P.V.P FINAL CLIENTE | list_price |
| P.V.P WEB | x_pvp_web |
| PRECIO CON MARGEN 25% | x_precio_margen |
| DTO | x_dto |
| UNID. | x_vendidas |
| QUEDAN EN TIENDA | stock.quant (quantity) |

## Estructura del módulo

- `models/`: Definición de modelos y campos personalizados
- `views/`: Vistas XML para la interfaz de usuario
- `security/`: Archivos de permisos de acceso
- `scripts/`: Scripts de importación y utilidades

## Personalización

Si necesitas añadir más campos o funcionalidades, puedes modificar los siguientes archivos:

- `models/product.py`: Para añadir campos a productos
- `models/partner.py`: Para añadir campos a proveedores
- `views/product_views.xml`: Para modificar la interfaz de productos
- `views/partner_views.xml`: Para modificar la interfaz de proveedores