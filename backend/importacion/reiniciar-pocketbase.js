/**
 * Script para reiniciar completamente PocketBase
 * Este script:
 * 1. Detiene el servidor de PocketBase
 * 2. Elimina el archivo de base de datos
 * 3. Inicia el servidor de PocketBase
 * 4. Crea las colecciones necesarias
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuración
const pocketbasePath = path.resolve('..', '..', 'pocketbase'); // Ajusta esta ruta según donde tengas PocketBase
const pocketbaseExe = path.join(pocketbasePath, 'pocketbase.exe');
const pocketbaseDb = path.join(pocketbasePath, 'pb_data');

// Función para detener el proceso de PocketBase
async function detenerPocketBase() {
  try {
    console.log('Deteniendo PocketBase...');
    await execAsync('taskkill /F /IM pocketbase.exe /T');
    console.log('PocketBase detenido');
    return true;
  } catch (error) {
    console.log('PocketBase no estaba en ejecución o no se pudo detener');
    return true;
  }
}

// Función para eliminar la base de datos
function eliminarBaseDeDatos() {
  try {
    console.log('Eliminando base de datos...');
    
    if (fs.existsSync(pocketbaseDb)) {
      fs.rmSync(pocketbaseDb, { recursive: true, force: true });
      console.log('Base de datos eliminada');
    } else {
      console.log('No se encontró la base de datos');
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar la base de datos:', error);
    return false;
  }
}

// Función para iniciar PocketBase
async function iniciarPocketBase() {
  try {
    console.log('Iniciando PocketBase...');
    
    // Verificar si el ejecutable existe
    if (!fs.existsSync(pocketbaseExe)) {
      console.error(`No se encontró el ejecutable de PocketBase en ${pocketbaseExe}`);
      return false;
    }
    
    // Iniciar PocketBase en segundo plano
    const pocketbase = exec(`cd "${pocketbasePath}" && "${pocketbaseExe}" serve --http="127.0.0.1:8090"`);
    
    // Manejar eventos
    pocketbase.stdout.on('data', (data) => {
      console.log(`PocketBase: ${data}`);
    });
    
    pocketbase.stderr.on('data', (data) => {
      console.error(`Error de PocketBase: ${data}`);
    });
    
    pocketbase.on('close', (code) => {
      console.log(`PocketBase se ha cerrado con código ${code}`);
    });
    
    // Esperar a que PocketBase esté listo
    console.log('Esperando a que PocketBase esté listo...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('PocketBase iniciado');
    return true;
  } catch (error) {
    console.error('Error al iniciar PocketBase:', error);
    return false;
  }
}

// Función para crear un archivo de configuración de colecciones
function crearArchivoConfiguracion() {
  try {
    console.log('Creando archivo de configuración de colecciones...');
    
    const configuracion = [
      {
        "id": "categorias",
        "name": "categorias",
        "type": "base",
        "system": false,
        "schema": [
          {
            "id": "nombre_field",
            "name": "nombre",
            "type": "text",
            "system": false,
            "required": true,
            "unique": true,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          },
          {
            "id": "activo_field",
            "name": "activo",
            "type": "bool",
            "system": false,
            "required": true,
            "unique": false,
            "options": {}
          },
          {
            "id": "fecha_alta_field",
            "name": "fecha_alta",
            "type": "date",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": "",
              "max": ""
            }
          }
        ],
        "listRule": "",
        "viewRule": "",
        "createRule": "",
        "updateRule": "",
        "deleteRule": ""
      },
      {
        "id": "proveedores",
        "name": "proveedores",
        "type": "base",
        "system": false,
        "schema": [
          {
            "id": "nombre_field",
            "name": "nombre",
            "type": "text",
            "system": false,
            "required": true,
            "unique": true,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          },
          {
            "id": "activo_field",
            "name": "activo",
            "type": "bool",
            "system": false,
            "required": true,
            "unique": false,
            "options": {}
          },
          {
            "id": "fecha_alta_field",
            "name": "fecha_alta",
            "type": "date",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": "",
              "max": ""
            }
          }
        ],
        "listRule": "",
        "viewRule": "",
        "createRule": "",
        "updateRule": "",
        "deleteRule": ""
      },
      {
        "id": "productos",
        "name": "productos",
        "type": "base",
        "system": false,
        "schema": [
          {
            "id": "codigo_field",
            "name": "codigo",
            "type": "text",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          },
          {
            "id": "nombre_field",
            "name": "nombre",
            "type": "text",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          },
          {
            "id": "precio_field",
            "name": "precio",
            "type": "number",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": null,
              "max": null
            }
          },
          {
            "id": "activo_field",
            "name": "activo",
            "type": "bool",
            "system": false,
            "required": true,
            "unique": false,
            "options": {}
          },
          {
            "id": "fecha_alta_field",
            "name": "fecha_alta",
            "type": "date",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": "",
              "max": ""
            }
          },
          {
            "id": "categoria_field",
            "name": "categoria",
            "type": "relation",
            "system": false,
            "required": false,
            "unique": false,
            "options": {
              "collectionId": "categorias",
              "cascadeDelete": false,
              "minSelect": null,
              "maxSelect": 1,
              "displayFields": []
            }
          },
          {
            "id": "proveedor_field",
            "name": "proveedor",
            "type": "relation",
            "system": false,
            "required": false,
            "unique": false,
            "options": {
              "collectionId": "proveedores",
              "cascadeDelete": false,
              "minSelect": null,
              "maxSelect": 1,
              "displayFields": []
            }
          }
        ],
        "listRule": "",
        "viewRule": "",
        "createRule": "",
        "updateRule": "",
        "deleteRule": ""
      },
      {
        "id": "importaciones",
        "name": "importaciones",
        "type": "base",
        "system": false,
        "schema": [
          {
            "id": "fecha_field",
            "name": "fecha",
            "type": "date",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": "",
              "max": ""
            }
          },
          {
            "id": "proveedor_field",
            "name": "proveedor",
            "type": "text",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          },
          {
            "id": "tipo_field",
            "name": "tipo",
            "type": "text",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          },
          {
            "id": "estado_field",
            "name": "estado",
            "type": "text",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          },
          {
            "id": "archivo_field",
            "name": "archivo",
            "type": "text",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          },
          {
            "id": "log_field",
            "name": "log",
            "type": "text",
            "system": false,
            "required": false,
            "unique": false,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          }
        ],
        "listRule": "",
        "viewRule": "",
        "createRule": "",
        "updateRule": "",
        "deleteRule": ""
      },
      {
        "id": "devoluciones",
        "name": "devoluciones",
        "type": "base",
        "system": false,
        "schema": [
          {
            "id": "fecha_field",
            "name": "fecha",
            "type": "date",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": "",
              "max": ""
            }
          },
          {
            "id": "motivo_field",
            "name": "motivo",
            "type": "text",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": null,
              "max": null,
              "pattern": ""
            }
          },
          {
            "id": "cantidad_field",
            "name": "cantidad",
            "type": "number",
            "system": false,
            "required": true,
            "unique": false,
            "options": {
              "min": null,
              "max": null
            }
          },
          {
            "id": "producto_field",
            "name": "producto",
            "type": "relation",
            "system": false,
            "required": false,
            "unique": false,
            "options": {
              "collectionId": "productos",
              "cascadeDelete": false,
              "minSelect": null,
              "maxSelect": 1,
              "displayFields": []
            }
          }
        ],
        "listRule": "",
        "viewRule": "",
        "createRule": "",
        "updateRule": "",
        "deleteRule": ""
      }
    ];
    
    // Guardar el archivo de configuración
    const rutaArchivo = path.join(pocketbasePath, 'collections.json');
    fs.writeFileSync(rutaArchivo, JSON.stringify(configuracion, null, 2));
    
    console.log(`Archivo de configuración creado en ${rutaArchivo}`);
    console.log('Instrucciones para importar las colecciones:');
    console.log('1. Abre la interfaz de administración de PocketBase en http://127.0.0.1:8090/_/');
    console.log('2. Crea un superusuario si es la primera vez que inicias PocketBase');
    console.log('3. Ve a Configuración > Importar colecciones');
    console.log('4. Selecciona el archivo collections.json');
    console.log('5. Haz clic en Importar');
    
    return true;
  } catch (error) {
    console.error('Error al crear el archivo de configuración:', error);
    return false;
  }
}

// Función principal
async function reiniciarPocketBase() {
  try {
    // Detener PocketBase
    await detenerPocketBase();
    
    // Eliminar la base de datos
    eliminarBaseDeDatos();
    
    // Iniciar PocketBase
    await iniciarPocketBase();
    
    // Crear archivo de configuración
    crearArchivoConfiguracion();
    
    console.log('PocketBase reiniciado correctamente');
    return true;
  } catch (error) {
    console.error('Error al reiniciar PocketBase:', error);
    return false;
  }
}

// Ejecutar el script
reiniciarPocketBase()
  .then(resultado => {
    if (resultado) {
      console.log('Script finalizado correctamente');
    } else {
      console.error('Script finalizado con errores');
    }
  })
  .catch(error => {
    console.error('Error fatal en el script:', error);
  });
