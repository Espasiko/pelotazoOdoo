import PocketBase from 'pocketbase';

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

// Función para probar la conexión
async function testConexion() {
  try {
    console.log('🔍 Probando conexión con PocketBase...');
    
    // Verificar si el servidor está en línea
    const health = await pb.health.check();
    console.log('✅ Servidor PocketBase en línea:', health);
    
    // Limpiar cualquier autenticación previa
    pb.authStore.clear();
    
    // Intentar autenticar como superusuario
    console.log('🔑 Intentando autenticar como superusuario...');
    
    try {
      await pb.collection('_superusers').authWithPassword(
        pocketbaseConfig.admin.email, 
        pocketbaseConfig.admin.password
      );
      console.log('✅ Autenticación exitosa como superusuario');
      console.log('🔐 Token:', pb.authStore.token.slice(0, 20) + '...');
      console.log('👤 Usuario:', pb.authStore.model.email);
    } catch (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      
      // Intentar con el método alternativo
      console.log('🔄 Intentando método alternativo de autenticación...');
      
      try {
        await pb.admins.authWithPassword(
          pocketbaseConfig.admin.email, 
          pocketbaseConfig.admin.password
        );
        console.log('✅ Autenticación alternativa exitosa');
      } catch (altAuthError) {
        console.error('❌ Error de autenticación alternativa:', altAuthError.message);
      }
    }
    
    // Verificar si estamos autenticados
    if (pb.authStore.isValid) {
      console.log('✅ Autenticación válida');
      
      // Listar colecciones
      console.log('📋 Obteniendo lista de colecciones...');
      
      try {
        const colecciones = await pb.collections.getFullList();
        console.log(`✅ Se encontraron ${colecciones.length} colecciones:`);
        
        for (const coleccion of colecciones) {
          console.log(`   - ${coleccion.name} (ID: ${coleccion.id})`);
          console.log(`     Campos: ${coleccion.schema ? coleccion.schema.length : 0}`);
          
          // Intentar crear un registro de prueba
          if (coleccion.name === 'categorias') {
            console.log('🧪 Intentando crear una categoría de prueba...');
            
            try {
              const prueba = await pb.collection('categorias').create({
                nombre: 'CATEGORÍA DE PRUEBA',
                activo: true,
                fecha_alta: new Date().toISOString()
              });
              
              console.log('✅ Categoría de prueba creada:', prueba.id);
            } catch (createError) {
              console.error('❌ Error al crear categoría de prueba:', createError.message);
              console.error('Detalles:', JSON.stringify(createError.data, null, 2));
            }
          }
        }
      } catch (listError) {
        console.error('❌ Error al listar colecciones:', listError.message);
      }
    } else {
      console.error('❌ No estamos autenticados');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar prueba
testConexion().catch(error => {
  console.error('❌ Error fatal:', error.message);
});
