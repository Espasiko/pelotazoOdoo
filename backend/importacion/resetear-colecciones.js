import PocketBase from 'pocketbase';
import fs from 'fs';
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

// Función para eliminar colecciones existentes
async function eliminarColecciones(colecciones) {
  try {
    console.log('🗑️ Eliminando colecciones existentes...');
    
    for (const coleccion of colecciones) {
      try {
        console.log(`🗑️ Eliminando colección "${coleccion}"...`);
        await pb.collections.delete(coleccion);
        console.log(`✅ Colección "${coleccion}" eliminada exitosamente`);
      } catch (error) {
        console.error(`⚠️ No se pudo eliminar la colección "${coleccion}":`, error.message);
      }
    }
    
    console.log('✅ Eliminación de colecciones completada');
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar colecciones:', error.message);
    return false;
  }
}

// Función para crear colecciones con campos
async function crearColecciones() {
  try {
    console.log('📦 Creando colecciones con campos...');
    
    // Crear colección "categorias"
    console.log('📦 Creando colección "categorias"...');
    const categorias = await pb.collections.create({
      name: 'categorias',
      type: 'base',
      schema: [
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
      ]
    });
    console.log('✅ Colección "categorias" creada exitosamente');
    
    // Crear colección "proveedores"
    console.log('📦 Creando colección "proveedores"...');
    const proveedores = await pb.collections.create({
      name: 'proveedores',
      type: 'base',
      schema: [
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
      ]
    });
    console.log('✅ Colección "proveedores" creada exitosamente');
    
    // Crear colección "productos"
    console.log('📦 Creando colección "productos"...');
    const productos = await pb.collections.create({
      name: 'productos',
      type: 'base',
      schema: [
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
            collectionId: categorias.id,
            cascadeDelete: false,
            maxSelect: 1,
          }
        },
        {
          name: 'proveedor',
          type: 'relation',
          required: false,
          options: {
            collectionId: proveedores.id,
            cascadeDelete: false,
            maxSelect: 1,
          }
        }
      ]
    });
    console.log('✅ Colección "productos" creada exitosamente');
    
    // Crear colección "importaciones"
    console.log('📦 Creando colección "importaciones"...');
    const importaciones = await pb.collections.create({
      name: 'importaciones',
      type: 'base',
      schema: [
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
    });
    console.log('✅ Colección "importaciones" creada exitosamente');
    
    console.log('✅ Creación de colecciones completada');
    return true;
  } catch (error) {
    console.error('❌ Error al crear colecciones:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando reseteo y creación de colecciones...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Eliminar colecciones existentes
  await eliminarColecciones(['categorias', 'proveedores', 'productos', 'importaciones']);
  
  // Crear colecciones con campos
  await crearColecciones();
  
  console.log('✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
