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

// Función para leer el archivo de configuración de colecciones
async function leerConfiguracionColecciones() {
  try {
    const rutaArchivo = path.join(__dirname, 'colecciones-pocketbase-import.json');
    const contenido = await fs.promises.readFile(rutaArchivo, 'utf8');
    return JSON.parse(contenido);
  } catch (error) {
    console.error('❌ Error al leer el archivo de configuración:', error.message);
    throw error;
  }
}

// Función para actualizar una colección existente
async function actualizarColeccion(coleccionId, datosColeccion) {
  try {
    console.log(`🔄 Actualizando colección "${datosColeccion.name}"...`);
    
    // Obtener la colección actual
    let coleccionExistente;
    try {
      coleccionExistente = await pb.collections.getOne(coleccionId);
      console.log(`✅ Colección "${datosColeccion.name}" encontrada`);
    } catch (error) {
      console.error(`❌ Error al obtener la colección "${datosColeccion.name}":`, error.message);
      return null;
    }
    
    // Preparar datos para actualización
    const datosActualizacion = {
      name: datosColeccion.name,
      type: datosColeccion.type,
      schema: datosColeccion.schema,
      listRule: datosColeccion.listRule || "",
      viewRule: datosColeccion.viewRule || "",
      createRule: datosColeccion.createRule || "",
      updateRule: datosColeccion.updateRule || "",
      deleteRule: datosColeccion.deleteRule || ""
    };
    
    // Actualizar la colección
    const coleccionActualizada = await pb.collections.update(coleccionId, datosActualizacion);
    console.log(`✅ Colección "${datosColeccion.name}" actualizada correctamente`);
    
    return coleccionActualizada;
  } catch (error) {
    console.error(`❌ Error al actualizar la colección "${datosColeccion.name}":`, error.message);
    return null;
  }
}

// Función para crear una nueva colección
async function crearColeccion(datosColeccion) {
  try {
    console.log(`🆕 Creando colección "${datosColeccion.name}"...`);
    
    // Preparar datos para creación
    const datosCreacion = {
      name: datosColeccion.name,
      type: datosColeccion.type,
      schema: datosColeccion.schema,
      listRule: datosColeccion.listRule || "",
      viewRule: datosColeccion.viewRule || "",
      createRule: datosColeccion.createRule || "",
      updateRule: datosColeccion.updateRule || "",
      deleteRule: datosColeccion.deleteRule || ""
    };
    
    // Crear la colección
    const coleccionCreada = await pb.collections.create(datosCreacion);
    console.log(`✅ Colección "${datosColeccion.name}" creada correctamente`);
    
    return coleccionCreada;
  } catch (error) {
    console.error(`❌ Error al crear la colección "${datosColeccion.name}":`, error.message);
    return null;
  }
}

// Función para obtener todas las colecciones existentes
async function obtenerColeccionesExistentes() {
  try {
    const colecciones = await pb.collections.getFullList();
    return colecciones;
  } catch (error) {
    console.error('❌ Error al obtener colecciones existentes:', error.message);
    return [];
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando actualización de colecciones...');
    
    // Autenticar como superadmin
    await autenticarAdmin();
    
    // Leer configuración de colecciones
    const configuracionColecciones = await leerConfiguracionColecciones();
    
    if (!configuracionColecciones || !Array.isArray(configuracionColecciones)) {
      console.error('❌ Formato de configuración inválido');
      return;
    }
    
    console.log(`📋 Se encontraron ${configuracionColecciones.length} colecciones en la configuración`);
    
    // Obtener colecciones existentes
    const coleccionesExistentes = await obtenerColeccionesExistentes();
    const mapColeccionesExistentes = new Map();
    
    coleccionesExistentes.forEach(coleccion => {
      mapColeccionesExistentes.set(coleccion.name, coleccion);
    });
    
    console.log(`📋 Se encontraron ${coleccionesExistentes.length} colecciones existentes en PocketBase`);
    
    // Procesar cada colección de la configuración
    const resultados = {
      actualizadas: [],
      creadas: [],
      errores: []
    };
    
    for (const datosColeccion of configuracionColecciones) {
      // Verificar si la colección ya existe
      const coleccionExistente = mapColeccionesExistentes.get(datosColeccion.name);
      
      if (coleccionExistente) {
        // Actualizar colección existente
        const resultado = await actualizarColeccion(coleccionExistente.id, datosColeccion);
        
        if (resultado) {
          resultados.actualizadas.push(datosColeccion.name);
        } else {
          resultados.errores.push(`Error al actualizar ${datosColeccion.name}`);
        }
      } else {
        // Crear nueva colección
        const resultado = await crearColeccion(datosColeccion);
        
        if (resultado) {
          resultados.creadas.push(datosColeccion.name);
        } else {
          resultados.errores.push(`Error al crear ${datosColeccion.name}`);
        }
      }
    }
    
    // Mostrar resumen
    console.log('\n📊 Resumen de la actualización:');
    console.log(`✅ Colecciones actualizadas (${resultados.actualizadas.length}): ${resultados.actualizadas.join(', ')}`);
    console.log(`🆕 Colecciones creadas (${resultados.creadas.length}): ${resultados.creadas.join(', ')}`);
    
    if (resultados.errores.length > 0) {
      console.log(`❌ Errores (${resultados.errores.length}): ${resultados.errores.join(', ')}`);
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
