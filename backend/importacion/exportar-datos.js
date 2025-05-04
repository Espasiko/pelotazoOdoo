import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Función para exportar datos de una colección
async function exportarDatos(nombreColeccion) {
  try {
    console.log(`\n📤 Exportando datos de la colección "${nombreColeccion}"...`);
    
    // Obtener registros
    const registros = await pb.collection(nombreColeccion).getFullList({
      limit: 10000
    });
    
    console.log(`✅ Se encontraron ${registros.length} registros en "${nombreColeccion}"`);
    
    if (registros.length === 0) {
      return [];
    }
    
    // Crear directorio de exportación si no existe
    const dirExport = path.join(__dirname, '../datos_exportados');
    if (!fs.existsSync(dirExport)) {
      fs.mkdirSync(dirExport, { recursive: true });
    }
    
    // Guardar datos en archivo JSON
    const rutaArchivo = path.join(dirExport, `${nombreColeccion}_${Date.now()}.json`);
    fs.writeFileSync(rutaArchivo, JSON.stringify(registros, null, 2));
    
    console.log(`✅ Datos exportados a ${rutaArchivo}`);
    
    return registros;
  } catch (error) {
    console.error(`❌ Error al exportar datos de "${nombreColeccion}":`, error.message);
    return [];
  }
}

// Función para mostrar estructura de un registro
function mostrarEstructuraRegistro(registro) {
  const campos = Object.keys(registro).filter(key => 
    !['id', 'created', 'updated', 'collectionId', 'collectionName', 'expand'].includes(key)
  );
  
  if (campos.length === 0) {
    console.log('   ⚠️ El registro no tiene campos personalizados');
    return;
  }
  
  console.log('   📋 Campos del registro:');
  campos.forEach(campo => {
    const valor = registro[campo];
    const tipo = typeof valor;
    console.log(`      - ${campo}: ${tipo} (${valor === null ? 'null' : valor})`);
  });
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando exportación de datos...');
    
    // Autenticar como superadmin
    await autenticarAdmin();
    
    // Colecciones a exportar
    const colecciones = ['categorias', 'proveedores', 'productos', 'importaciones'];
    
    // Exportar cada colección
    for (const nombreColeccion of colecciones) {
      const registros = await exportarDatos(nombreColeccion);
      
      // Mostrar estructura del primer registro si existe
      if (registros.length > 0) {
        console.log(`\n🔍 Analizando estructura del primer registro de "${nombreColeccion}":`);
        mostrarEstructuraRegistro(registros[0]);
      }
    }
    
    console.log('\n🏁 Proceso completado');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
