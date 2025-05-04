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

// Función para listar registros de una colección
async function listarRegistros(nombreColeccion) {
  try {
    console.log(`\n📋 Listando registros de la colección "${nombreColeccion}"...`);
    
    // Obtener registros
    const registros = await pb.collection(nombreColeccion).getList(1, 10, {
      sort: '-created'
    });
    
    console.log(`Total de registros: ${registros.totalItems}`);
    
    if (registros.items.length > 0) {
      console.log('Registros:');
      registros.items.forEach((registro, index) => {
        console.log(`\nRegistro ${index + 1}:`);
        // Mostrar todos los campos del registro
        Object.entries(registro).forEach(([clave, valor]) => {
          // Si el valor es un objeto o array, convertirlo a JSON para mostrarlo
          if (typeof valor === 'object' && valor !== null) {
            console.log(`  ${clave}: ${JSON.stringify(valor)}`);
          } else {
            console.log(`  ${clave}: ${valor}`);
          }
        });
      });
    } else {
      console.log('No se encontraron registros.');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error al listar registros de "${nombreColeccion}":`, error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando listado de registros...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Listar registros de cada colección
  await listarRegistros('categorias');
  await listarRegistros('proveedores');
  await listarRegistros('productos');
  
  console.log('\n✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
