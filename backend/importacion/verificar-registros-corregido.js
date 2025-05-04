import PocketBase from 'pocketbase';
import { fileURLToPath } from 'url';
import path from 'path';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de PocketBase
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

// Función para obtener todas las colecciones
async function obtenerColecciones() {
  try {
    const colecciones = await pb.collections.getFullList();
    return colecciones.map(coleccion => coleccion.name);
  } catch (error) {
    console.error('❌ Error al obtener colecciones:', error.message);
    throw new Error(`Error al obtener colecciones: ${error.message}`);
  }
}

// Función para verificar registros de una colección
async function verificarRegistros(coleccion) {
  try {
    console.log(`📋 Verificando registros de la colección "${coleccion}":`);
    
    // Obtener registros
    const registros = await pb.collection(coleccion).getFullList();
    
    // Mostrar total de registros
    console.log(`✅ Total de registros: ${registros.length}`);
    
    // Si no hay registros, mostrar mensaje
    if (registros.length === 0) {
      console.log('❌ No hay registros en esta colección');
      return;
    }
    
    // Mostrar primeros 5 registros
    console.log('📝 Primeros 5 registros:');
    console.log();
    
    const registrosMostrar = registros.slice(0, 5);
    for (const registro of registrosMostrar) {
      console.log(`🔹 ID: ${registro.id}`);
      
      // Mostrar campos del registro (excepto expand)
      Object.keys(registro).forEach(key => {
        if (key !== 'expand') {
          console.log(`   ${key}: ${JSON.stringify(registro[key])}`);
        }
      });
      
      console.log();
    }
  } catch (error) {
    console.error(`❌ Error al verificar registros de la colección "${coleccion}":`, error.message);
  }
}

// Función para verificar esquema de una colección
async function verificarEsquema(coleccion) {
  try {
    console.log(`🔍 Verificando esquema de la colección "${coleccion}":`);
    
    // Obtener la colección
    const coleccionObj = await pb.collections.getOne(coleccion);
    
    // Verificar si hay campos definidos (usando fields en lugar de schema)
    if (!coleccionObj.fields || coleccionObj.fields.length === 0) {
      console.log('❌ No hay campos definidos en el esquema');
      return;
    }
    
    // Filtrar campos del sistema (opcional)
    const camposNoSistema = coleccionObj.fields.filter(campo => !campo.system);
    
    // Mostrar campos
    console.log(`✅ Esquema (${camposNoSistema.length} campos):`);
    for (const campo of camposNoSistema) {
      console.log(`  - ${campo.name} (${campo.type})${campo.required ? ' [Requerido]' : ''}`);
    }
  } catch (error) {
    console.error(`❌ Error al verificar esquema de la colección "${coleccion}":`, error.message);
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación de colecciones y registros...');
  
  // Autenticar
  await autenticarAdmin();
  
  // Obtener colecciones
  const colecciones = await obtenerColecciones();
  
  // Mostrar colecciones
  console.log('\n📊 Se encontraron', colecciones.length, 'colecciones:');
  colecciones.forEach(coleccion => console.log('   -', coleccion));
  console.log();
  
  // Resumen para mostrar al final
  const resumen = {};
  
  // Verificar cada colección
  for (const coleccion of colecciones) {
    console.log('\n' + '='.repeat(50));
    
    // Verificar esquema
    await verificarEsquema(coleccion);
    
    // Verificar registros
    await verificarRegistros(coleccion);
    
    // Guardar información para el resumen
    try {
      const coleccionObj = await pb.collections.getOne(coleccion);
      const numCampos = coleccionObj.fields ? coleccionObj.fields.filter(campo => !campo.system).length : 0;
      const numRegistros = (await pb.collection(coleccion).getFullList()).length;
      
      resumen[coleccion] = {
        campos: numCampos,
        registros: numRegistros
      };
    } catch (error) {
      console.error(`❌ Error al obtener información para el resumen de "${coleccion}":`, error.message);
      resumen[coleccion] = {
        campos: 0,
        registros: 0
      };
    }
  }
  
  // Mostrar resumen final
  console.log('\n📊 Resumen final:');
  Object.keys(resumen).forEach(coleccion => {
    console.log(`   - ${coleccion}: ${resumen[coleccion].campos} campos, ${resumen[coleccion].registros} registros`);
  });
  
  console.log('\n🏁 Verificación completada');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
