import PocketBase from 'pocketbase';
import fs from 'fs';
import { pocketbaseConfig } from './config.js';

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superadmin
async function autenticarAdmin() {
  try {
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
async function importarColecciones(archivo) {
  try {
    console.log(`📥 Importando colecciones desde ${archivo}...`);
    
    // Leer el archivo JSON
    const json = fs.readFileSync(archivo, 'utf8');
    const colecciones = JSON.parse(json);
    
    // Importar colecciones
    await pb.collections.import(colecciones);
    
    console.log('✅ Colecciones importadas exitosamente');
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
    console.error('❌ No se pudo autenticar como superadmin');
    return;
  }
  
  // Importar colecciones
  await importarColecciones('./colecciones-exportadas.json');
  
  console.log('✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
