/**
 * Script para configurar PocketBase con las colecciones necesarias
 * Este script verifica si existen las colecciones requeridas y las crea si no existen
 */

import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';

// Inicializar PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Definir las colecciones necesarias y sus esquemas
const coleccionesNecesarias = [
  {
    name: 'productos',
    type: 'base',
    schema: [
      {
        name: 'codigo',
        type: 'text',
        required: true,
        options: { min: 1, max: 100 }
      },
      {
        name: 'nombre',
        type: 'text',
        required: true,
        options: { min: 1, max: 200 }
      },
      {
        name: 'descripcion',
        type: 'text',
        required: false,
        options: { min: 0, max: 1000 }
      },
      {
        name: 'precio',
        type: 'number',
        required: true,
        options: { min: 0 }
      },
      {
        name: 'categoria',
        type: 'relation',
        required: false,
        options: { collectionId: 'categorias', cascadeDelete: false }
      },
      {
        name: 'proveedor',
        type: 'relation',
        required: false,
        options: { collectionId: 'proveedores', cascadeDelete: false }
      },
      {
        name: 'activo',
        type: 'bool',
        required: true,
        options: { }
      },
      {
        name: 'fecha_alta',
        type: 'date',
        required: true,
        options: { }
      }
    ]
  },
  {
    name: 'categorias',
    type: 'base',
    schema: [
      {
        name: 'nombre',
        type: 'text',
        required: true,
        options: { min: 1, max: 100 }
      },
      {
        name: 'activo',
        type: 'bool',
        required: true,
        options: { }
      },
      {
        name: 'fecha_alta',
        type: 'date',
        required: true,
        options: { }
      }
    ]
  },
  {
    name: 'proveedores',
    type: 'base',
    schema: [
      {
        name: 'nombre',
        type: 'text',
        required: true,
        options: { min: 1, max: 100 }
      },
      {
        name: 'activo',
        type: 'bool',
        required: true,
        options: { }
      },
      {
        name: 'fecha_alta',
        type: 'date',
        required: true,
        options: { }
      }
    ]
  },
  {
    name: 'importaciones',
    type: 'base',
    schema: [
      {
        name: 'fecha',
        type: 'date',
        required: true,
        options: { }
      },
      {
        name: 'proveedor',
        type: 'text',
        required: true,
        options: { min: 1, max: 100 }
      },
      {
        name: 'tipo',
        type: 'text',
        required: true,
        options: { min: 1, max: 50 }
      },
      {
        name: 'estado',
        type: 'text',
        required: true,
        options: { min: 1, max: 50 }
      },
      {
        name: 'archivo',
        type: 'text',
        required: true,
        options: { min: 1, max: 200 }
      },
      {
        name: 'log',
        type: 'text',
        required: false,
        options: { min: 0, max: 10000 }
      }
    ]
  },
  {
    name: 'devoluciones',
    type: 'base',
    schema: [
      {
        name: 'fecha',
        type: 'date',
        required: true,
        options: { }
      },
      {
        name: 'producto',
        type: 'relation',
        required: true,
        options: { collectionId: 'productos', cascadeDelete: false }
      },
      {
        name: 'cantidad',
        type: 'number',
        required: true,
        options: { min: 1 }
      },
      {
        name: 'motivo',
        type: 'text',
        required: true,
        options: { min: 1, max: 500 }
      },
      {
        name: 'importacion',
        type: 'relation',
        required: false,
        options: { collectionId: 'importaciones', cascadeDelete: false }
      }
    ]
  }
];

// Función para autenticar como superadmin
async function autenticarAdmin() {
  try {
    console.log('Intentando autenticar como superadmin en PocketBase...');
    
    await pb.collection('_superusers').authWithPassword(
      pocketbaseConfig.admin.email,
      pocketbaseConfig.admin.password
    );
    
    console.log('Autenticación exitosa como superadmin');
    return true;
  } catch (error) {
    console.error('Error al autenticar como superadmin:', error);
    throw error;
  }
}

// Función para verificar si una colección existe
async function verificarColeccion(nombre) {
  try {
    await pb.collections.getOne(nombre);
    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}

// Función para crear una colección
async function crearColeccion(coleccion) {
  try {
    console.log(`Creando colección: ${coleccion.name}`);
    
    const nuevaColeccion = await pb.collections.create({
      name: coleccion.name,
      type: coleccion.type,
      schema: coleccion.schema
    });
    
    console.log(`Colección ${coleccion.name} creada con éxito`);
    return nuevaColeccion;
  } catch (error) {
    console.error(`Error al crear colección ${coleccion.name}:`, error);
    throw error;
  }
}

// Función principal para configurar PocketBase
async function configurarPocketBase() {
  try {
    // Autenticar como superadmin
    await autenticarAdmin();
    
    // Verificar y crear colecciones
    for (const coleccion of coleccionesNecesarias) {
      const existe = await verificarColeccion(coleccion.name);
      
      if (existe) {
        console.log(`La colección ${coleccion.name} ya existe`);
      } else {
        await crearColeccion(coleccion);
      }
    }
    
    console.log('Configuración de PocketBase completada con éxito');
  } catch (error) {
    console.error('Error al configurar PocketBase:', error);
  }
}

// Ejecutar la configuración
configurarPocketBase()
  .then(() => {
    console.log('Script de configuración finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en el script de configuración:', error);
    process.exit(1);
  });
