# Instrucciones para configurar campos en PocketBase

Hemos identificado que PocketBase v0.27.2 tiene limitaciones para la creación programática de campos. La mejor solución es crear los campos manualmente a través de la interfaz de administración y luego exportar el esquema para uso futuro.

## Paso 1: Acceder a la interfaz de administración

1. Abre tu navegador y ve a: http://127.0.0.1:8090/_/
2. Inicia sesión con las credenciales:
   - Email: yo@mail.com
   - Contraseña: Ninami12$ya

## Paso 2: Configurar campos para la colección "categorias"

1. Haz clic en "Collections" en el menú lateral
2. Selecciona la colección "categorias"
3. Haz clic en "Schema" en la parte superior
4. Configura los siguientes campos:

| Nombre           | Tipo       | Requerido | Opciones                                   |
|------------------|------------|-----------|-------------------------------------------|
| nombre           | Text       | Sí        |                                           |
| descripcion      | Text       | No        |                                           |
| visible          | Boolean    | Sí        |                                           |
| orden            | Number     | No        |                                           |
| color            | Text       | No        |                                           |
| imagen_categoria | File       | No        | Max files: 1, Max size: 5MB, Types: Images |

## Paso 3: Configurar campos para la colección "proveedores"

1. Selecciona la colección "proveedores"
2. Haz clic en "Schema" en la parte superior
3. Configura los siguientes campos:

| Nombre    | Tipo       | Requerido | Opciones |
|-----------|------------|-----------|----------|
| nombre    | Text       | Sí        |          |
| contacto  | Text       | No        |          |
| telefono  | Text       | No        |          |
| email     | Email      | No        |          |
| direccion | Text       | No        |          |
| notas     | Text       | No        |          |
| activo    | Boolean    | Sí        |          |

## Paso 4: Configurar campos para la colección "productos"

1. Selecciona la colección "productos"
2. Haz clic en "Schema" en la parte superior
3. Configura los siguientes campos:

| Nombre          | Tipo       | Requerido | Opciones                                    |
|-----------------|------------|-----------|---------------------------------------------|
| codigo          | Text       | Sí        |                                             |
| nombre          | Text       | Sí        |                                             |
| precio          | Number     | Sí        | Min: 0                                      |
| activo          | Boolean    | Sí        |                                             |
| fecha_alta      | Date       | Sí        |                                             |
| descripcion     | Text       | No        |                                             |
| stock           | Number     | No        | Min: 0                                      |
| imagen_producto | File       | No        | Max files: 5, Max size: 5MB, Types: Images  |
| categoria       | Relation   | No        | Collection: categorias, Type: Single        |
| proveedor       | Relation   | No        | Collection: proveedores, Type: Single       |

## Paso 5: Configurar campos para la colección "importaciones"

1. Selecciona la colección "importaciones"
2. Haz clic en "Schema" en la parte superior
3. Configura los siguientes campos:

| Nombre               | Tipo       | Requerido | Opciones                                   |
|----------------------|------------|-----------|-------------------------------------------|
| fecha                | Date       | Sí        |                                           |
| archivo              | Text       | Sí        |                                           |
| registros_procesados | Number     | Sí        | Min: 0                                    |
| registros_creados    | Number     | Sí        | Min: 0                                    |
| registros_actualizados | Number   | Sí        | Min: 0                                    |
| registros_error      | Number     | Sí        | Min: 0                                    |
| notas                | Text       | No        |                                           |
| archivo_original     | File       | No        | Max files: 1, Max size: 10MB, Types: CSV, Excel |

## Paso 6: Exportar el esquema para uso futuro

1. Haz clic en "Settings" en el menú lateral
2. Haz clic en "Export collections"
3. Selecciona todas las colecciones
4. Haz clic en "Export"
5. Guarda el archivo JSON en `e:\1 programar APPs\1pelotanew\backend\importacion\colecciones-exportadas.json`

## Paso 7: Usar el esquema exportado para futuras configuraciones

Una vez que tengas el esquema exportado, puedes usarlo para recrear las colecciones en el futuro con el siguiente script:

```javascript
import PocketBase from 'pocketbase';
import fs from 'fs';
import { pocketbaseConfig } from './config.js';

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superadmin
async function autenticarAdmin() {
  try {
    // Limpiar cualquier autenticación previa
    pb.authStore.clear();

    // Autenticar como superadmin
    const adminEmail = pocketbaseConfig.admin.email;
    const adminPassword = pocketbaseConfig.admin.password;
    
    console.log(`🔑 Autenticando como superadmin (${adminEmail})...`);
    
    // Intentar directamente con la colección de superusuarios
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    console.log('✅ Autenticación exitosa como superusuario');
    return true;
  } catch (error) {
    console.error('❌ Error al autenticar:', error.message);
    return false;
  }
}

// Función para importar colecciones desde un archivo JSON
async function importarColecciones(archivo) {
  try {
    console.log(`📥 Importando colecciones desde ${archivo}...`);
    
    // Leer el archivo JSON
    const json = fs.readFileSync(archivo, 'utf8');
    const colecciones = JSON.parse(json);
    
    // Importar colecciones
    await pb.collections.import(colecciones);
    
    console.log('✅ Colecciones importadas exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al importar colecciones:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando importación de colecciones...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ No se pudo autenticar como superadmin');
    return;
  }
  
  // Importar colecciones
  await importarColecciones('./colecciones-exportadas.json');
  
  console.log('✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
```

## Conclusión

Después de varios intentos, hemos identificado que PocketBase v0.27.2 tiene limitaciones para la creación programática de campos. La mejor solución es:

1. Crear las colecciones programáticamente
2. Configurar los campos manualmente a través de la interfaz de administración (una sola vez)
3. Exportar el esquema para uso futuro
4. Usar el esquema exportado para recrear las colecciones en el futuro

Esta solución te permitirá tener un esquema consistente y reutilizable para tu aplicación.
