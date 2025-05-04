/**
 * Script para crear un usuario en la colección users de PocketBase
 */

import PocketBase from 'pocketbase';

// Inicializar PocketBase con la URL correcta
const pb = new PocketBase('http://127.0.0.1:8090');

// Función principal para crear un usuario
async function createUser() {
  try {
    console.log('Iniciando creación de usuario en PocketBase...');
    
    // Intentar autenticar como admin
    try {
      // Usar las credenciales que has configurado en el panel de administración
      await pb.admins.authWithPassword('yo@mail.com', 'Ninami12$ya');
      console.log('Autenticación exitosa como administrador');
    } catch (error) {
      console.error('Error al autenticar con PocketBase:', error);
      return;
    }
    
    // Verificar si el usuario ya existe
    try {
      const existingUsers = await pb.collection('users').getList(1, 1, {
        filter: 'email = "usuario@elpelotazo.com"'
      });
      
      if (existingUsers.items.length > 0) {
        console.log('El usuario ya existe');
        return;
      }
    } catch (error) {
      // Ignorar errores al verificar
    }
    
    // Crear usuario
    const userData = {
      email: 'usuario@elpelotazo.com',
      password: 'Pelotazo123$',
      passwordConfirm: 'Pelotazo123$',
      name: 'Usuario ERP',
      role: 'admin'
    };
    
    const newUser = await pb.collection('users').create(userData);
    console.log('Usuario creado con éxito:', newUser.id);
    
  } catch (error) {
    console.error('Error al crear usuario:', error);
  }
}

// Ejecutar la creación de usuario
createUser();
