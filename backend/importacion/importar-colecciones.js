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

// Función para importar colecciones desde un archivo JSON
async function importarColecciones(rutaArchivo) {
  try {
    console.log(`📦 Importando colecciones desde ${rutaArchivo}...`);
    
    // Leer el archivo JSON
    const colecciones = JSON.parse(fs.readFileSync(rutaArchivo, 'utf8'));
    
    // Importar cada colección
    for (const coleccion of colecciones) {
      try {
        console.log(`📋 Importando colección "${coleccion.name}"...`);
        
        // Verificar si la colección ya existe
        try {
          await pb.collections.getOne(coleccion.id);
          console.log(`⚠️ La colección "${coleccion.name}" ya existe, actualizando...`);
          
          // Actualizar la colección existente
          await pb.collections.update(coleccion.id, coleccion);
        } catch (error) {
          // Si la colección no existe, crearla
          await pb.collections.create(coleccion);
        }
        
        console.log(`✅ Colección "${coleccion.name}" importada exitosamente`);
      } catch (error) {
        console.error(`❌ Error al importar colección "${coleccion.name}":`, error.message);
      }
    }
    
    console.log('✅ Importación de colecciones completada');
    return true;
  } catch (error) {
    console.error('❌ Error al importar colecciones:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando importación de colecciones...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Importar colecciones
  await importarColecciones('./colecciones-import.json');
  
  console.log('✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
