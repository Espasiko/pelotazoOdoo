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
    return colecciones;
  } catch (error) {
    console.error('❌ Error al obtener colecciones:', error.message);
    return [];
  }
}

// Función para verificar registros de una colección
async function verificarRegistros(coleccion) {
  try {
    console.log(`\n📋 Verificando registros de la colección "${coleccion.name}":`);
    
    // Obtener total de registros - sin ordenar para evitar errores
    try {
      const registros = await pb.collection(coleccion.name).getFullList({
        limit: 1000
      });
      
      console.log(`✅ Total de registros: ${registros.length}`);
      
      // Mostrar algunos registros de ejemplo
      if (registros.length > 0) {
        console.log(`\n📝 Primeros 5 registros:`);
        
        const ejemplos = registros.slice(0, 5);
        
        for (const registro of ejemplos) {
          console.log(`\n🔹 ID: ${registro.id}`);
          
          // Mostrar campos principales
          Object.keys(registro).forEach(key => {
            if (key !== 'id' && key !== 'created' && key !== 'updated' && key !== 'collectionId' && key !== 'collectionName') {
              console.log(`   ${key}: ${JSON.stringify(registro[key])}`);
            }
          });
        }
        
        if (registros.length > 5) {
          console.log(`\n... y ${registros.length - 5} registros más`);
        }
      } else {
        console.log('❌ No hay registros en esta colección');
      }
      
      return registros.length;
    } catch (error) {
      console.error(`❌ Error al obtener registros de "${coleccion.name}":`, error.message);
      return 0;
    }
  } catch (error) {
    console.error(`❌ Error al verificar registros de ${coleccion.name}:`, error.message);
    return 0;
  }
}

// Función para verificar esquema de una colección
async function verificarEsquema(coleccion) {
  try {
    console.log(`\n🔍 Verificando esquema de la colección "${coleccion.name}":`);
    
    // Obtener esquema
    const schema = coleccion.schema;
    
    if (schema && schema.length > 0) {
      console.log(`✅ Esquema (${schema.length} campos):`);
      
      for (const campo of schema) {
        console.log(`   - ${campo.name} (${campo.type})`);
      }
    } else {
      console.log('❌ No hay campos definidos en el esquema');
    }
    
    return schema ? schema.length : 0;
  } catch (error) {
    console.error(`❌ Error al verificar esquema de ${coleccion.name}:`, error.message);
    return 0;
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando verificación de colecciones y registros...');
    
    // Autenticar como superadmin
    await autenticarAdmin();
    
    // Obtener todas las colecciones
    const colecciones = await obtenerColecciones();
    
    if (colecciones.length === 0) {
      console.log('❌ No se encontraron colecciones');
      return;
    }
    
    console.log(`\n📊 Se encontraron ${colecciones.length} colecciones:`);
    
    // Resumen de colecciones
    for (const coleccion of colecciones) {
      console.log(`   - ${coleccion.name}`);
    }
    
    // Verificar cada colección
    const resumen = {};
    
    for (const coleccion of colecciones) {
      // Verificar esquema
      const camposCount = await verificarEsquema(coleccion);
      
      // Verificar registros
      const registrosCount = await verificarRegistros(coleccion);
      
      resumen[coleccion.name] = {
        campos: camposCount,
        registros: registrosCount
      };
    }
    
    // Mostrar resumen final
    console.log('\n📊 Resumen final:');
    
    for (const [nombre, datos] of Object.entries(resumen)) {
      console.log(`   - ${nombre}: ${datos.campos} campos, ${datos.registros} registros`);
    }
    
    console.log('\n🏁 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error.message);
  }
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
