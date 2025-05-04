import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superadmin
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

// Función para verificar la estructura de una colección
async function verificarEstructuraColeccion(nombreColeccion) {
  try {
    console.log(`\n📋 Verificando estructura de la colección "${nombreColeccion}"...`);
    
    // Obtener la colección
    const coleccion = await pb.collections.getOne(nombreColeccion);
    
    console.log(`ID: ${coleccion.id}`);
    console.log(`Nombre: ${coleccion.name}`);
    console.log(`Tipo: ${coleccion.type}`);
    
    // Verificar campos
    console.log('Campos:');
    if (coleccion.schema && coleccion.schema.length > 0) {
      coleccion.schema.forEach(campo => {
        console.log(`  - ${campo.name} (${campo.type})${campo.required ? ' [Requerido]' : ''}`);
        
        // Mostrar opciones específicas según el tipo de campo
        if (campo.type === 'relation') {
          console.log(`    Relación con: ${campo.options.collectionId}`);
          console.log(`    Max. selecciones: ${campo.options.maxSelect || 'Sin límite'}`);
        } else if (campo.type === 'number') {
          console.log(`    Min: ${campo.options.min !== null ? campo.options.min : 'Sin límite'}`);
          console.log(`    Max: ${campo.options.max !== null ? campo.options.max : 'Sin límite'}`);
        } else if (campo.type === 'text') {
          console.log(`    Min. longitud: ${campo.options.min !== null ? campo.options.min : 'Sin límite'}`);
          console.log(`    Max. longitud: ${campo.options.max !== null ? campo.options.max : 'Sin límite'}`);
        }
      });
    } else {
      console.log('  No se encontraron campos definidos en schema.');
    }
    
    // Verificar si hay campos en fields pero no en schema
    if (coleccion.fields && coleccion.fields.length > 0) {
      console.log('Campos en fields:');
      coleccion.fields.forEach(campo => {
        console.log(`  - ${campo.name} (${campo.type})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error al verificar estructura de "${nombreColeccion}":`, error.message);
    return false;
  }
}

// Función para verificar registros en una colección
async function verificarRegistrosColeccion(nombreColeccion) {
  try {
    console.log(`\n📊 Verificando registros en la colección "${nombreColeccion}"...`);
    
    // Obtener registros
    const registros = await pb.collection(nombreColeccion).getList(1, 10, {
      sort: '-created'
    });
    
    console.log(`Total de registros: ${registros.totalItems}`);
    
    if (registros.items.length > 0) {
      console.log('Primeros registros:');
      registros.items.forEach((registro, index) => {
        console.log(`\nRegistro ${index + 1}:`);
        console.log(`  ID: ${registro.id}`);
        
        // Mostrar campos del registro (excluyendo objetos complejos)
        Object.keys(registro).forEach(key => {
          if (typeof registro[key] !== 'object' || registro[key] === null) {
            console.log(`  ${key}: ${registro[key]}`);
          }
        });
      });
    } else {
      console.log('No se encontraron registros.');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error al verificar registros de "${nombreColeccion}":`, error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación de colecciones en PocketBase...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Obtener todas las colecciones
  const colecciones = await pb.collections.getFullList();
  console.log(`\n📋 Se encontraron ${colecciones.length} colecciones en PocketBase`);
  
  // Filtrar colecciones del sistema
  const coleccionesPersonalizadas = colecciones.filter(col => 
    !col.name.startsWith('_') && col.name !== 'users'
  );
  
  console.log(`\n📋 Colecciones personalizadas: ${coleccionesPersonalizadas.length}`);
  
  // Verificar cada colección personalizada
  for (const coleccion of coleccionesPersonalizadas) {
    await verificarEstructuraColeccion(coleccion.name);
    await verificarRegistrosColeccion(coleccion.name);
    console.log('-----------------------------------');
  }
  
  console.log('\n✅ Verificación completada exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
