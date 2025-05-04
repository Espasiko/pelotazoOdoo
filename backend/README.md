# Backend con PocketBase - El Pelotazo

## Instalación

1. Descarga PocketBase desde [pocketbase.io](https://pocketbase.io/)
2. Coloca el ejecutable de PocketBase en esta carpeta
3. Inicia el servidor con `./pocketbase serve` (Linux/Mac) o `pocketbase.exe serve` (Windows)

## Estructura

```
/backend
├── pocketbase.exe       # Ejecutable de PocketBase (Windows)
├── pb_data/             # Datos de PocketBase (generado automáticamente)
├── pb_migrations/       # Migraciones para configurar colecciones
└── README.md            # Este archivo
```

## Colecciones

Las siguientes colecciones serán creadas automáticamente mediante migraciones:

- productos
- categorias
- marcas
- clientes
- pedidos
- facturas
- proveedores
- configuraciones

## Migración de Datos

Los datos de productos serán importados desde los archivos CSV disponibles en la carpeta `/csv` mediante scripts de migración.

## Backup

Se configurará un backup automático diario a las 21:00h.

## Acceso al Admin UI

Una vez iniciado PocketBase, puedes acceder al panel de administración en:

- URL: http://127.0.0.1:8090/_/
- Usuario: admin@elpelotazo.com
- Contraseña: (Configurar en la primera ejecución)