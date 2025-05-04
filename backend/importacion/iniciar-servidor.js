/**
 * Script para iniciar el servidor con autenticación previa
 */

import PocketBase from 'pocketbase';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Configuración de ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

// Función principal
async function iniciar() {
  try {
    console.log('Iniciando proceso de autenticación...');
    
    // Intentar autenticarse como admin
    try {
      await pb.admins.authWithPassword('yo@mail.com', 'Ninami12$ya');
      console.log('Autenticación exitosa como administrador');
      
      // Verificar si PocketBase está accesible
      const colecciones = await pb.collection('collections').getFullList();
      console.log(`PocketBase accesible. ${colecciones.length} colecciones encontradas.`);
      
      // Verificar colecciones necesarias
      const coleccionesNecesarias = [
        'productos',
        'categorias',
        'proveedores',
        'importaciones',
        'devoluciones'
      ];
      
      const coleccionesExistentes = new Set(colecciones.map(c => c.name));
      const coleccionesFaltantes = coleccionesNecesarias.filter(c => !coleccionesExistentes.has(c));
      
      if (coleccionesFaltantes.length > 0) {
        console.warn('⚠️ ADVERTENCIA: Faltan las siguientes colecciones en PocketBase:');
        coleccionesFaltantes.forEach(c => console.warn(`- ${c}`));
        console.warn('Por favor, crea estas colecciones manualmente desde el panel de administración de PocketBase.');
      } else {
        console.log('✅ Todas las colecciones necesarias existen en PocketBase.');
      }
      
      // Inicializar categorías predefinidas
      const categoriasPredefinidas = [
        'FRIGORÍFICOS', 'LAVADORAS', 'LAVAVAJILLAS', 'SECADORAS', 'HORNOS', 
        'CAFETERAS', 'ASPIRADORES', 'BATIDORAS', 'PLANCHAS', 'BÁSCULAS',
        'MICROONDAS', 'PLACAS', 'CAMPANAS', 'PEQUEÑO ELECTRODOMÉSTICO', 'OTROS'
      ];
      
      console.log('Inicializando categorías predefinidas...');
      let categoriasCreadas = 0;
      
      for (const categoria of categoriasPredefinidas) {
        try {
          // Verificar si ya existe
          let categoriaExistente = null;
          try {
            categoriaExistente = await pb.collection('categorias').getFirstListItem(`nombre~"${categoria.trim().toUpperCase()}"`);
            console.log(`Categoría ya existe: ${categoriaExistente.nombre} (ID: ${categoriaExistente.id})`);
          } catch (error) {
            // Si no existe, crearla
            console.log(`Creando nueva categoría: ${categoria}`);
            const nuevaCategoria = await pb.collection('categorias').create({
              nombre: categoria.trim().toUpperCase(),
              descripcion: 'Categoría predefinida'
            });
            console.log(`Categoría creada: ${nuevaCategoria.nombre} (ID: ${nuevaCategoria.id})`);
            categoriasCreadas++;
          }
        } catch (error) {
          console.error(`Error al procesar categoría ${categoria}:`, error);
        }
      }
      
      console.log(`Se inicializaron ${categoriasCreadas} categorías predefinidas.`);
      
    } catch (authError) {
      console.error('Error al autenticar como administrador:', authError);
      console.log('Continuando sin autenticación...');
    }
    
    // Iniciar el servidor
    console.log('Iniciando servidor de importación...');
    const servidor = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    servidor.on('close', (code) => {
      console.log(`Servidor finalizado con código: ${code}`);
    });
    
    servidor.on('error', (error) => {
      console.error('Error al iniciar el servidor:', error);
    });
    
    console.log('Servidor iniciado correctamente.');
    
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
}

// Ejecutar la función principal
iniciar().catch(error => {
  console.error('Error en el script de inicio:', error);
});
