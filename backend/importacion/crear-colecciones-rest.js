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
    console.log(`🔑 Autenticando como superusuario (${email})...`);
    
    const response = await fetch(`${baseUrl}/api/admins/auth-with-password`, {
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
      // Si falla la autenticación como admin, intentar como usuario normal
      console.log('⚠️ Fallo al autenticar como admin, intentando como usuario...');
      const userResponse = await fetch(`${baseUrl}/api/collections/users/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: email,
          password: password,
        }),
      });
      
      if (!userResponse.ok) {
        throw new Error(`Error de autenticación: ${userResponse.status} ${userResponse.statusText}`);
      }
      
      const userData = await userResponse.json();
      authToken = userData.token;
    } else {
      const data = await response.json();
      authToken = data.token;
    }
    
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
        'Authorization': authToken,
      },
      body: JSON.stringify({
        name: nombre,
        type: 'base',
        schema: [],
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear colección: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log(`✅ Colección "${nombre}" creada exitosamente`);
    
    // Crear campos para la colección
    for (const campo of schema) {
      await crearCampo(nombre, campo);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Error al crear colección "${nombre}":`, error.message);
    return null;
  }
}

// Función para crear un campo en una colección
async function crearCampo(coleccion, campo) {
  try {
    console.log(`📋 Creando campo "${campo.name}" en colección "${coleccion}"...`);
    
    const response = await fetch(`${baseUrl}/api/collections/${coleccion}/fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify({
        name: campo.name,
        type: campo.type,
        required: campo.required,
        options: campo.options || {},
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear campo: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log(`✅ Campo "${campo.name}" creado exitosamente en colección "${coleccion}"`);
    return data;
  } catch (error) {
    console.error(`❌ Error al crear campo "${campo.name}" en colección "${coleccion}":`, error.message);
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
      required: false,
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
      required: false,
    },
    {
      name: 'telefono',
      type: 'text',
      required: false,
    },
    {
      name: 'email',
      type: 'email',
      required: false,
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
  console.log('🚀 Iniciando creación de colecciones con API REST...');
  
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
