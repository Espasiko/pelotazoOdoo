import PocketBase from 'pocketbase';
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

// Función para verificar los campos de una colección
async function verificarCamposColeccion(nombre) {
  try {
    console.log(`\n🔍 Verificando campos de la colección "${nombre}":`);
    
    // Obtener la colección directamente
    const coleccion = await pb.collections.getOne(nombre);
    
    // Verificar si hay campos en la propiedad fields
    if (!coleccion.fields || coleccion.fields.length === 0) {
      console.log('❌ No hay campos definidos en la propiedad fields');
    } else {
      // Mostrar campos no del sistema
      const camposNoSistema = coleccion.fields.filter(campo => !campo.system);
      console.log(`✅ Se encontraron ${camposNoSistema.length} campos en la propiedad fields:`);
      
      camposNoSistema.forEach(campo => {
        console.log(`  - ${campo.name} (${campo.type})${campo.required ? ' [Requerido]' : ''}`);
      });
    }
    
    // Verificar si hay campos en la propiedad schema
    if (!coleccion.schema || coleccion.schema.length === 0) {
      console.log('❌ No hay campos definidos en la propiedad schema');
    } else {
      console.log(`✅ Se encontraron ${coleccion.schema.length} campos en la propiedad schema`);
    }
    
    // Intentar crear un registro de prueba
    try {
      console.log(`\n📝 Creando registro de prueba en "${nombre}"...`);
      
      // Preparar datos según el tipo de colección
      let datos = {};
      
      if (nombre === 'categorias') {
        datos = {
          nombre: `Categoría de prueba ${Date.now()}`,
          descripcion: 'Creada por script de verificación',
          visible: true,
          orden: 1,
          color: '#FF5733'
        };
      } else if (nombre === 'proveedores') {
        datos = {
          nombre: `Proveedor de prueba ${Date.now()}`,
          contacto: 'Contacto de prueba',
          telefono: '123456789',
          email: 'prueba@ejemplo.com',
          activo: true
        };
      } else if (nombre === 'productos') {
        datos = {
          codigo: `PROD-${Date.now()}`,
          nombre: `Producto de prueba ${Date.now()}`,
          precio: 19.99,
          activo: true,
          fecha_alta: new Date().toISOString().split('T')[0],
          stock: 10
        };
      } else if (nombre === 'importaciones') {
        datos = {
          fecha: new Date().toISOString().split('T')[0],
          archivo: `importacion_${Date.now()}.csv`,
          registros_procesados: 10,
          registros_creados: 5,
          registros_actualizados: 3,
          registros_error: 2,
          notas: 'Importación de prueba'
        };
      }
      
      // Crear el registro
      const registro = await pb.collection(nombre).create(datos);
      console.log('✅ Registro creado exitosamente:');
      console.log(registro);
      
      // Verificar campos del registro
      console.log('\n📋 Campos del registro creado:');
      Object.keys(registro).forEach(key => {
        if (!['collectionId', 'collectionName', 'created', 'updated', 'id', 'expand'].includes(key)) {
          console.log(`  - ${key}: ${JSON.stringify(registro[key])}`);
        }
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Error al crear registro de prueba: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error al verificar campos de la colección "${nombre}": ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación de campos...');
  
  // Autenticar
  const autenticado = await autenticarAdmin();
  if (!autenticado) {
    console.error('❌ No se pudo autenticar como superadmin');
    return;
  }
  
  // Colecciones a verificar
  const colecciones = ['categorias', 'proveedores', 'productos', 'importaciones'];
  
  // Verificar cada colección
  for (const coleccion of colecciones) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Verificando colección "${coleccion}"...`);
    await verificarCamposColeccion(coleccion);
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('🏁 Verificación completada');
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error inesperado:', error);
});
