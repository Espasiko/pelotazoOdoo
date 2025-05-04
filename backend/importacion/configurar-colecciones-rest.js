import fetch from 'node-fetch';
import { pocketbaseConfig } from './config.js';

// Configuración
const API_URL = pocketbaseConfig.url;
const ADMIN_EMAIL = pocketbaseConfig.admin.email;
const ADMIN_PASSWORD = pocketbaseConfig.admin.password;

// Función para autenticar como admin y obtener token
async function autenticarAdmin() {
  try {
    console.log(`🔑 Autenticando como superadmin (${ADMIN_EMAIL})...`);
    
    const response = await fetch(`${API_URL}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error de autenticación: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();
    console.log('✅ Autenticación exitosa como superusuario');
    
    return data.token;
  } catch (error) {
    console.error('❌ Error al autenticar:', error.message);
    return null;
  }
}

// Función para obtener una colección
async function obtenerColeccion(nombre, token) {
  try {
    const response = await fetch(`${API_URL}/api/collections/${nombre}`, {
      headers: {
        'Authorization': token
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(`Error al obtener colección: ${JSON.stringify(error)}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    console.error(`❌ Error al obtener colección "${nombre}":`, error.message);
    return null;
  }
}

// Función para crear una colección
async function crearColeccion(nombre, schema, token) {
  try {
    console.log(`📦 Creando colección "${nombre}"...`);
    
    const response = await fetch(`${API_URL}/api/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        name: nombre,
        type: 'base',
        schema: schema,
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error al crear colección: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();
    console.log(`✅ Colección "${nombre}" creada exitosamente`);
    
    return data;
  } catch (error) {
    console.error(`❌ Error al crear colección "${nombre}":`, error.message);
    return null;
  }
}

// Función para actualizar una colección
async function actualizarColeccion(id, nombre, schema, token) {
  try {
    console.log(`🔄 Actualizando colección "${nombre}"...`);
    
    const response = await fetch(`${API_URL}/api/collections/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        name: nombre,
        schema: schema,
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error al actualizar colección: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();
    console.log(`✅ Colección "${nombre}" actualizada exitosamente`);
    
    return data;
  } catch (error) {
    console.error(`❌ Error al actualizar colección "${nombre}":`, error.message);
    return null;
  }
}

// Función para eliminar una colección
async function eliminarColeccion(nombre, token) {
  try {
    console.log(`🗑️ Eliminando colección "${nombre}"...`);
    
    const response = await fetch(`${API_URL}/api/collections/${nombre}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token
      }
    });
    
    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(`Error al eliminar colección: ${JSON.stringify(error)}`);
    }
    
    console.log(`✅ Colección "${nombre}" eliminada exitosamente`);
    
    return true;
  } catch (error) {
    if (error.message.includes('404')) {
      console.log(`⚠️ La colección "${nombre}" no existía, no es necesario eliminarla`);
      return true;
    }
    console.error(`❌ Error al eliminar colección "${nombre}":`, error.message);
    return false;
  }
}

// Función para configurar una colección (eliminar si existe y crear nueva)
async function configurarColeccion(nombre, schema, token) {
  try {
    console.log(`\n📝 Configurando colección "${nombre}"...`);
    
    // Eliminar la colección si existe
    await eliminarColeccion(nombre, token);
    
    // Crear la colección con el esquema
    const coleccion = await crearColeccion(nombre, schema, token);
    
    if (!coleccion) {
      throw new Error(`No se pudo crear la colección "${nombre}"`);
    }
    
    return coleccion;
  } catch (error) {
    console.error(`❌ Error al configurar colección "${nombre}":`, error.message);
    return null;
  }
}

// Definiciones de esquemas
const esquemas = {
  categorias: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'descripcion',
      type: 'text',
      required: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'visible',
      type: 'bool',
      required: true,
      options: {}
    },
    {
      name: 'orden',
      type: 'number',
      required: false,
      options: {
        min: null,
        max: null
      }
    },
    {
      name: 'color',
      type: 'text',
      required: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'imagen_categoria',
      type: 'file',
      required: false,
      options: {
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        thumbs: ['100x100', '200x200']
      }
    }
  ],
  
  proveedores: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'contacto',
      type: 'text',
      required: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'telefono',
      type: 'text',
      required: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'email',
      type: 'email',
      required: false,
      options: {
        exceptDomains: null,
        onlyDomains: null
      }
    },
    {
      name: 'direccion',
      type: 'text',
      required: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'notas',
      type: 'text',
      required: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'activo',
      type: 'bool',
      required: true,
      options: {}
    }
  ],
  
  productos: [
    {
      name: 'codigo',
      type: 'text',
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'nombre',
      type: 'text',
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'precio',
      type: 'number',
      required: true,
      options: {
        min: 0,
        max: null
      }
    },
    {
      name: 'activo',
      type: 'bool',
      required: true,
      options: {}
    },
    {
      name: 'fecha_alta',
      type: 'date',
      required: true,
      options: {
        min: '',
        max: ''
      }
    },
    {
      name: 'descripcion',
      type: 'text',
      required: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'stock',
      type: 'number',
      required: false,
      options: {
        min: 0,
        max: null
      }
    },
    {
      name: 'imagen_producto',
      type: 'file',
      required: false,
      options: {
        maxSelect: 5,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        thumbs: ['100x100', '200x200', '500x500']
      }
    }
  ],
  
  importaciones: [
    {
      name: 'fecha',
      type: 'date',
      required: true,
      options: {
        min: '',
        max: ''
      }
    },
    {
      name: 'archivo',
      type: 'text',
      required: true,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'registros_procesados',
      type: 'number',
      required: true,
      options: {
        min: 0,
        max: null
      }
    },
    {
      name: 'registros_creados',
      type: 'number',
      required: true,
      options: {
        min: 0,
        max: null
      }
    },
    {
      name: 'registros_actualizados',
      type: 'number',
      required: true,
      options: {
        min: 0,
        max: null
      }
    },
    {
      name: 'registros_error',
      type: 'number',
      required: true,
      options: {
        min: 0,
        max: null
      }
    },
    {
      name: 'notas',
      type: 'text',
      required: false,
      options: {
        min: null,
        max: null,
        pattern: ''
      }
    },
    {
      name: 'archivo_original',
      type: 'file',
      required: false,
      options: {
        maxSelect: 1,
        maxSize: 10485760,
        mimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        thumbs: []
      }
    }
  ]
};

// Función principal
async function main() {
  console.log('🚀 Iniciando configuración de colecciones con REST API...');
  
  // Autenticar
  const token = await autenticarAdmin();
  if (!token) {
    console.error('❌ No se pudo autenticar como superadmin');
    return;
  }
  
  // Configurar colecciones
  const colecciones = ['categorias', 'proveedores', 'productos', 'importaciones'];
  
  for (const nombre of colecciones) {
    await configurarColeccion(nombre, esquemas[nombre], token);
  }
  
  console.log('\n✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
