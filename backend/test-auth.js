// Test rápido de autenticación y fetchAdmin
import { autenticarAdmin, fetchAdmin } from './utils/auth.js';

async function test() {
  try {
    const token = await autenticarAdmin();
    console.log('Token obtenido:', token.slice(0, 16) + '...');
    const collections = await fetchAdmin('/api/collections');
    console.log('Colecciones PocketBase:', collections.map(c => c.name || c.id));
    console.log('✅ Autenticación y fetchAdmin funcionan correctamente');
  } catch (err) {
    console.error('❌ ERROR en autenticación o fetchAdmin:', err);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
  test();
}
