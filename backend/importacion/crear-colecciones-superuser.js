import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superadmin (método que funciona)
async function autenticarAdmin() {
  try {
    // Verificar si ya estamos autenticados
    if (pb.authStore.isValid && pb.authStore.model?.id) {
      console.log('✅ Ya estamos autenticados como superadmin');
      return true;
    }

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

// Función para crear una colección
async function crearColeccion(nombre, schema) {
  try {
    console.log(`📦 Creando colección "${nombre}"...`);
    
    // Crear la colección
    const coleccion = await pb.collections.create({
      name: nombre,
      type: 'base',
      schema: []
    });
    
    console.log(`✅ Colección "${nombre}" creada exitosamente`);
    
    // Crear campos para la colección
    for (const campo of schema) {
      await crearCampo(nombre, campo);
    }
    
    return coleccion;
  } catch (error) {
    console.error(`❌ Error al crear colección "${nombre}":`, error.message);
    
    // Si la colección ya existe, intentar continuar con los campos
    if (error.status === 400 && error.data?.name?.code === 'validation_not_unique') {
      console.log(`⚠️ La colección "${nombre}" ya existe, continuando con los campos...`);
      
      // Crear campos para la colección existente
      for (const campo of schema) {
        await crearCampo(nombre, campo);
      }
      
      return null;
    }
    
    return null;
  }
}

// Función para crear un campo en una colección
async function crearCampo(coleccion, campo) {
  try {
    console.log(`📋 Creando campo "${campo.name}" en colección "${coleccion}"...`);
    
    // Obtener la colección existente
    const coleccionExistente = await pb.collections.getOne(coleccion);
    
    // Preparar el esquema actualizado
    const schemaActualizado = [...coleccionExistente.schema];
    
    // Verificar si el campo ya existe
    const campoExistente = schemaActualizado.find(c => c.name === campo.name);
    if (campoExistente) {
      console.log(`⚠️ El campo "${campo.name}" ya existe en la colección "${coleccion}", actualizando...`);
      
      // Actualizar el campo existente
      Object.assign(campoExistente, campo);
    } else {
      // Añadir el nuevo campo
      schemaActualizado.push(campo);
    }
    
    // Actualizar la colección con el nuevo esquema
    await pb.collections.update(coleccion, {
      schema: schemaActualizado
    });
    
    console.log(`✅ Campo "${campo.name}" creado exitosamente en colección "${coleccion}"`);
    return true;
  } catch (error) {
    console.error(`❌ Error al crear campo "${campo.name}" en colección "${coleccion}":`, error.message);
    return false;
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
  console.log('🚀 Iniciando creación de colecciones con SDK (autenticación superuser)...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Crear colecciones
  for (const [nombre, schema] of Object.entries(esquemas)) {
    await crearColeccion(nombre, schema);
  }
  
  console.log('✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
