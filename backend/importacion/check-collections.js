// Script para verificar las colecciones existentes en PocketBase
import { fetchAdmin, autenticarAdmin } from './utils.js';

async function checkCollections() {
  try {
    console.log('Verificando colecciones en PocketBase...');
    
    // Autenticar como admin
    await autenticarAdmin();
    
    // Obtener todas las colecciones
    const collections = await fetchAdmin('/api/collections');
    console.log('Colecciones existentes:', collections.items.map(c => c.name));
    
    // Verificar si existe la colección importaciones
    const importaciones = collections.items.find(c => c.name === 'importaciones');
    console.log('Colección importaciones existe:', !!importaciones);
    
    if (!importaciones) {
      console.log('La colección importaciones no existe. Necesitas crearla.');
    } else {
      console.log('Detalles de la colección importaciones:', importaciones);
    }
  } catch (error) {
    console.error('Error al verificar colecciones:', error);
  }
}

checkCollections();
