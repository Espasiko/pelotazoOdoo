import { pocketbaseConfig } from './config.js';
import fetch from 'node-fetch';

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;
const email = pocketbaseConfig.admin.email;
const password = pocketbaseConfig.admin.password;

// Token de autenticación
let authToken = '';

// Función para autenticar
async function autenticar() {
  try {
    console.log(`🔑 Autenticando como usuario (${email})...`);
    
    const response = await fetch(`${baseUrl}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: email,
        password: password,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error de autenticación: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    authToken = data.token;
    console.log('✅ Autenticación exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error al autenticar:', error.message);
    return false;
  }
}

// Función para crear una colección
async function crearColeccion(nombre, schema) {
  try {
    console.log(`📦 Creando colección "${nombre}"...`);
    
    const response = await fetch(`${baseUrl}/api/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: nombre,
        type: 'base',
        schema: schema,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear colección: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log(`✅ Colección "${nombre}" creada exitosamente`);
    return data;
  } catch (error) {
    console.error(`❌ Error al crear colección "${nombre}":`, error.message);
    return null;
  }
}

// Definición de esquemas
const esquemas = {
  categorias: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'descripcion',
      type: 'text',
    }
  ],
  proveedores: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'contacto',
      type: 'text',
    },
    {
      name: 'telefono',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    }
  ],
  productos: [
    {
      name: 'codigo',
      type: 'text',
      required: true,
    },
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'precio',
      type: 'number',
      required: true,
    },
    {
      name: 'activo',
      type: 'bool',
      required: true,
    },
    {
      name: 'fecha_alta',
      type: 'date',
      required: true,
    },
    {
      name: 'categoria',
      type: 'relation',
      required: false,
      options: {
        collectionId: 'categorias',
        cascadeDelete: false,
      }
    },
    {
      name: 'proveedor',
      type: 'relation',
      required: false,
      options: {
        collectionId: 'proveedores',
        cascadeDelete: false,
      }
    }
  ],
  importaciones: [
    {
      name: 'fecha',
      type: 'date',
      required: true,
    },
    {
      name: 'archivo',
      type: 'text',
      required: true,
    },
    {
      name: 'registros_procesados',
      type: 'number',
      required: true,
    },
    {
      name: 'registros_creados',
      type: 'number',
      required: true,
    },
    {
      name: 'registros_actualizados',
      type: 'number',
      required: true,
    },
    {
      name: 'registros_error',
      type: 'number',
      required: true,
    }
  ]
};

// Función principal
async function main() {
  console.log('🚀 Iniciando creación de colecciones con Fetch API...');
  
  // Autenticar
  const autenticado = await autenticar();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar');
    return;
  }
  
  // Crear colecciones
  for (const [nombre, schema] of Object.entries(esquemas)) {
    await crearColeccion(nombre, schema);
  }
  
  console.log('✅ Proceso completado');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
