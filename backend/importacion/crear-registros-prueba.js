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

// Función para crear registros de prueba
async function crearRegistrosPrueba() {
  try {
    console.log('\n📝 Creando registros de prueba...');
    
    // Crear categoría de prueba
    console.log('\n📝 Creando categoría de prueba...');
    const categoria = await pb.collection('categorias').create({
      nombre: 'Categoría de prueba ' + Date.now(),
      descripcion: 'Descripción de prueba',
      activo: true,
      fecha_alta: new Date().toISOString().split('T')[0],
      visible_online: true,
      orden: 1
    });
    console.log('✅ Categoría creada exitosamente:', categoria);
    
    // Crear proveedor de prueba
    console.log('\n📝 Creando proveedor de prueba...');
    const proveedor = await pb.collection('proveedores').create({
      nombre: 'Proveedor de prueba ' + Date.now(),
      contacto: 'Contacto de prueba',
      activo: true,
      fecha_alta: new Date().toISOString().split('T')[0],
      nif: 'B12345678',
      direccion: 'Dirección de prueba',
      email: 'proveedor@ejemplo.com',
      telefono: '123456789'
    });
    console.log('✅ Proveedor creado exitosamente:', proveedor);
    
    // Crear producto de prueba
    console.log('\n📝 Creando producto de prueba...');
    const producto = await pb.collection('productos').create({
      codigo: 'PROD-' + Date.now(),
      nombre: 'Producto de prueba ' + Date.now(),
      precio: 19.99,
      stock: 100,
      activo: true,
      fecha_alta: new Date().toISOString().split('T')[0],
      descripcion: 'Descripción de producto de prueba',
      categoria: categoria.id,
      proveedor: proveedor.id
    });
    console.log('✅ Producto creado exitosamente:', producto);
    
    console.log('\n✅ Registros de prueba creados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al crear registros de prueba:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando creación de registros de prueba...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
    return;
  }
  
  // Crear registros de prueba
  await crearRegistrosPrueba();
  
  console.log('\n✅ Proceso completado exitosamente');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
