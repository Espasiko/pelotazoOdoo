import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const pocketbaseConfig = {
  url: 'http://127.0.0.1:8090',
  admin: {
    email: 'yo@mail.com',
    password: 'Ninami12$ya'
  }
};

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superadmin
async function autenticarAdmin() {
  try {
    // Verificar si ya estamos autenticados
    if (pb.authStore.isValid && pb.authStore.model?.id) {
      console.log('✅ Ya estamos autenticados como superadmin');
      return;
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
  } catch (error) {
    console.error('❌ Error al autenticar:', error.message);
    throw new Error(`Error de autenticación: ${error.message}`);
  }
}

// Función para leer el archivo de configuración de colecciones
function leerConfiguracionColecciones() {
  try {
    const configPath = path.resolve(__dirname, 'colecciones-config-completo.json');
    console.log(`📄 Leyendo configuración desde: ${configPath}`);
    
    const configRaw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configRaw);
    
    console.log(`✅ Configuración leída correctamente. ${config.collections.length} colecciones encontradas.`);
    return config;
  } catch (error) {
    console.error('❌ Error al leer la configuración:', error.message);
    throw new Error(`Error al leer la configuración: ${error.message}`);
  }
}

// Función para verificar si una colección existe
async function verificarColeccion(nombreColeccion) {
  try {
    const colecciones = await pb.collections.getFullList();
    return colecciones.some(col => col.name === nombreColeccion);
  } catch (error) {
    console.error(`❌ Error al verificar la colección ${nombreColeccion}:`, error.message);
    return false;
  }
}

// Función para crear una colección
async function crearColeccion(coleccion) {
  try {
    console.log(`🔨 Creando colección: ${coleccion.name}...`);
    await pb.collections.create(coleccion);
    console.log(`✅ Colección ${coleccion.name} creada correctamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error al crear la colección ${coleccion.name}:`, error.message);
    return false;
  }
}

// Función para actualizar una colección
async function actualizarColeccion(coleccion) {
  try {
    // Obtener la colección existente
    const coleccionExistente = await pb.collections.getOne(coleccion.name);
    
    console.log(`🔄 Actualizando colección: ${coleccion.name}...`);
    await pb.collections.update(coleccionExistente.id, coleccion);
    console.log(`✅ Colección ${coleccion.name} actualizada correctamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error al actualizar la colección ${coleccion.name}:`, error.message);
    return false;
  }
}

// Función para crear o actualizar una colección
async function crearOActualizarColeccion(coleccion) {
  const existe = await verificarColeccion(coleccion.name);
  
  if (existe) {
    return await actualizarColeccion(coleccion);
  } else {
    return await crearColeccion(coleccion);
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando proceso de creación/actualización de colecciones...');
    
    // Autenticar como superadmin
    await autenticarAdmin();
    
    // Leer configuración
    const config = leerConfiguracionColecciones();
    
    // Crear o actualizar colecciones
    let exitosos = 0;
    let fallidos = 0;
    
    for (const coleccion of config.collections) {
      const resultado = await crearOActualizarColeccion(coleccion);
      if (resultado) {
        exitosos++;
      } else {
        fallidos++;
      }
    }
    
    console.log('\n📊 Resumen:');
    console.log(`✅ Colecciones creadas/actualizadas correctamente: ${exitosos}`);
    console.log(`❌ Colecciones con errores: ${fallidos}`);
    console.log('🏁 Proceso finalizado');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
