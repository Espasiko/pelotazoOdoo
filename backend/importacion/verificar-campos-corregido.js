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

// Función para verificar campos de todas las colecciones
async function verificarCampos() {
  try {
    console.log('🚀 Verificando campos de todas las colecciones...');
    
    // Obtener todas las colecciones
    const colecciones = await pb.collections.getFullList();
    
    // Verificar campos en cada colección
    for (const coleccion of colecciones) {
      console.log(`\n📋 Colección: ${coleccion.name}`);
      console.log(`ID: ${coleccion.id}`);
      console.log('Campos:');
      if (coleccion.fields && coleccion.fields.length > 0) {
        for (const campo of coleccion.fields) {
          console.log(`  - ${campo.name} (${campo.type})`);
        }
      } else {
        console.log('  No se encontraron campos.');
      }
    }
    
    console.log('\n✅ Verificación de campos completada');
    return true;
  } catch (error) {
    console.error('❌ Error al verificar campos:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación de campos en PocketBase...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Verificar campos
  await verificarCampos();
  
  console.log('✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
