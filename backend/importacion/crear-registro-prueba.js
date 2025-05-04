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

// Función para crear un registro de prueba en cada colección
async function crearRegistrosPrueba() {
  try {
    console.log('📝 Creando registros de prueba...');
    
    // Crear registro en categorias
    console.log('📝 Creando registro en categorias...');
    try {
      const categoria = await pb.collection('categorias').create({
        nombre: 'Categoría de prueba',
        descripcion: 'Descripción de prueba'
      });
      console.log('✅ Registro creado en categorias:', categoria);
    } catch (error) {
      console.error('❌ Error al crear registro en categorias:', error.message);
      console.log('Detalles del error:', error);
    }
    
    // Crear registro en proveedores
    console.log('📝 Creando registro en proveedores...');
    try {
      const proveedor = await pb.collection('proveedores').create({
        nombre: 'Proveedor de prueba',
        contacto: 'Contacto de prueba',
        telefono: '123456789',
        email: 'proveedor@ejemplo.com'
      });
      console.log('✅ Registro creado en proveedores:', proveedor);
    } catch (error) {
      console.error('❌ Error al crear registro en proveedores:', error.message);
      console.log('Detalles del error:', error);
    }
    
    // Crear registro en importaciones
    console.log('📝 Creando registro en importaciones...');
    try {
      const importacion = await pb.collection('importaciones').create({
        fecha: new Date().toISOString(),
        archivo: 'archivo_prueba.csv',
        registros_procesados: 10,
        registros_creados: 5,
        registros_actualizados: 3,
        registros_error: 2
      });
      console.log('✅ Registro creado en importaciones:', importacion);
    } catch (error) {
      console.error('❌ Error al crear registro en importaciones:', error.message);
      console.log('Detalles del error:', error);
    }
    
    // Intentar obtener información directa de las colecciones
    console.log('🔍 Obteniendo información directa de las colecciones...');
    
    try {
      const categoriasInfo = await pb.collections.getOne('categorias');
      console.log('ℹ️ Información de categorias:', JSON.stringify(categoriasInfo, null, 2));
    } catch (error) {
      console.error('❌ Error al obtener información de categorias:', error.message);
    }
    
    console.log('✅ Pruebas completadas');
  } catch (error) {
    console.error('❌ Error al crear registros de prueba:', error.message);
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando pruebas de campos en colecciones...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Crear registros de prueba
  await crearRegistrosPrueba();
  
  console.log('✅ Proceso completado');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
