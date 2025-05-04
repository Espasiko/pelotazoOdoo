import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

async function generarAdminToken() {
  try {
    console.log('🔑 Intentando autenticar como superadmin...');
    
    // Obtener credenciales de administrador
    const adminEmail = pocketbaseConfig.admin.email;
    const adminPassword = pocketbaseConfig.admin.password;
    
    // Método 1: Autenticar como superusuario
    try {
      console.log('🔄 Método 1: Autenticando como superusuario...');
      await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
      
      if (pb.authStore.isValid) {
        const token = pb.authStore.token;
        console.log('✅ Autenticación exitosa como superusuario');
        console.log('🔒 Token de administrador:');
        console.log(token);
        return token;
      }
    } catch (error) {
      console.log(`❌ Método 1 falló: ${error.message}`);
    }
    
    // Método 2: Autenticar como administrador
    try {
      console.log('🔄 Método 2: Autenticando como administrador...');
      pb.authStore.clear(); // Limpiar cualquier autenticación previa
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      
      if (pb.authStore.isValid) {
        const token = pb.authStore.token;
        console.log('✅ Autenticación exitosa como administrador');
        console.log('🔒 Token de administrador:');
        console.log(token);
        return token;
      }
    } catch (error) {
      console.log(`❌ Método 2 falló: ${error.message}`);
    }
    
    // Método 3: Autenticar como usuario normal y luego verificar si es admin
    try {
      console.log('🔄 Método 3: Autenticando como usuario normal...');
      pb.authStore.clear(); // Limpiar cualquier autenticación previa
      await pb.collection('users').authWithPassword(adminEmail, adminPassword);
      
      if (pb.authStore.isValid) {
        const token = pb.authStore.token;
        console.log('✅ Autenticación exitosa como usuario normal');
        console.log('🔒 Token de usuario:');
        console.log(token);
        return token;
      }
    } catch (error) {
      console.log(`❌ Método 3 falló: ${error.message}`);
    }
    
    // Si llegamos aquí, todos los métodos fallaron
    throw new Error('Todos los métodos de autenticación fallaron');
  } catch (error) {
    console.error('❌ Error general al autenticar:', error.message);
    console.log('\n🔍 Sugerencia: Verifica que PocketBase esté ejecutándose y que las credenciales sean correctas.');
    console.log('🌐 También puedes generar un token de API manualmente desde la interfaz de administración de PocketBase:');
    console.log('   1. Abre http://127.0.0.1:8090/_/ en tu navegador');
    console.log('   2. Inicia sesión con tus credenciales de administrador');
    console.log('   3. Ve a "Settings" > "API Keys" > "Create new API key"');
    console.log('   4. Configura los permisos necesarios y copia el token generado');
    return null;
  }
}

// Ejecutar la función principal
generarAdminToken().catch(error => {
  console.error('❌ Error inesperado:', error);
});
