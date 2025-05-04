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

// Función para hacer backup de los datos de una colección
async function hacerBackupColeccion(nombreColeccion) {
  try {
    console.log(`📦 Haciendo backup de la colección "${nombreColeccion}"...`);
    
    // Intentar obtener todos los registros
    let registros = [];
    try {
      registros = await pb.collection(nombreColeccion).getFullList({
        sort: '-created',
        expand: '*'
      });
      
      console.log(`✅ Se encontraron ${registros.length} registros en "${nombreColeccion}"`);
    } catch (error) {
      console.log(`⚠️ No se pudieron obtener registros de "${nombreColeccion}": ${error.message}`);
      return [];
    }
    
    // Guardar los registros en un archivo
    if (registros.length > 0) {
      const rutaBackup = path.join(__dirname, `../backups/${nombreColeccion}_backup_${Date.now()}.json`);
      
      // Asegurarse de que el directorio de backups existe
      const dirBackup = path.dirname(rutaBackup);
      if (!fs.existsSync(dirBackup)) {
        fs.mkdirSync(dirBackup, { recursive: true });
      }
      
      // Guardar los datos
      fs.writeFileSync(rutaBackup, JSON.stringify(registros, null, 2));
      console.log(`✅ Backup guardado en ${rutaBackup}`);
    }
    
    return registros;
  } catch (error) {
    console.error(`❌ Error al hacer backup de "${nombreColeccion}":`, error.message);
    return [];
  }
}

// Función para eliminar una colección
async function eliminarColeccion(coleccionId, nombreColeccion) {
  try {
    console.log(`🗑️ Eliminando colección "${nombreColeccion}" (${coleccionId})...`);
    
    await pb.collections.delete(coleccionId);
    console.log(`✅ Colección "${nombreColeccion}" eliminada correctamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar la colección "${nombreColeccion}":`, error.message);
    return false;
  }
}

// Función para crear una colección
async function crearColeccion(datosColeccion) {
  try {
    console.log(`🆕 Creando colección "${datosColeccion.name}"...`);
    
    // Preparar datos para creación
    const datosCreacion = {
      name: datosColeccion.name,
      type: datosColeccion.type || 'base',
      schema: datosColeccion.schema || [],
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

// Función para restaurar datos a una colección
async function restaurarDatos(nombreColeccion, datos) {
  try {
    console.log(`📥 Restaurando ${datos.length} registros a la colección "${nombreColeccion}"...`);
    
    // Contador de éxitos y errores
    let exitos = 0;
    let errores = 0;
    
    // Restaurar cada registro
    for (const registro of datos) {
      try {
        // Crear una copia del registro sin los campos del sistema
        const datosFiltrados = { ...registro };
        delete datosFiltrados.id;
        delete datosFiltrados.created;
        delete datosFiltrados.updated;
        delete datosFiltrados.collectionId;
        delete datosFiltrados.collectionName;
        
        // Crear el registro
        await pb.collection(nombreColeccion).create(datosFiltrados);
        exitos++;
      } catch (error) {
        console.error(`  ❌ Error al restaurar registro en "${nombreColeccion}":`, error.message);
        errores++;
      }
    }
    
    console.log(`✅ Restauración completada: ${exitos} éxitos, ${errores} errores`);
    return { exitos, errores };
  } catch (error) {
    console.error(`❌ Error al restaurar datos a "${nombreColeccion}":`, error.message);
    return { exitos: 0, errores: datos.length };
  }
}

// Definición de las colecciones a recrear
const coleccionesARecrear = [
  {
    name: "categorias",
    type: "base",
    schema: [
      {
        name: "nombre",
        type: "text",
        required: true
      },
      {
        name: "descripcion",
        type: "text",
        required: false
      },
      {
        name: "activo",
        type: "bool",
        required: false,
        options: {
          default: true
        }
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false
      },
      {
        name: "visible_online",
        type: "bool",
        required: false,
        options: {
          default: false
        }
      },
      {
        name: "orden",
        type: "number",
        required: false
      }
    ]
  },
  {
    name: "proveedores",
    type: "base",
    schema: [
      {
        name: "nombre",
        type: "text",
        required: true
      },
      {
        name: "contacto",
        type: "text",
        required: false
      },
      {
        name: "activo",
        type: "bool",
        required: false,
        options: {
          default: true
        }
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false
      },
      {
        name: "nif",
        type: "text",
        required: false
      },
      {
        name: "direccion",
        type: "text",
        required: false
      },
      {
        name: "email",
        type: "email",
        required: false
      },
      {
        name: "telefono",
        type: "text",
        required: false
      }
    ]
  },
  {
    name: "productos",
    type: "base",
    schema: [
      {
        name: "codigo",
        type: "text",
        required: true
      },
      {
        name: "codigo_barras",
        type: "text",
        required: false
      },
      {
        name: "codigo_barras_tipo",
        type: "text",
        required: false
      },
      {
        name: "nombre",
        type: "text",
        required: true
      },
      {
        name: "descripcion_larga",
        type: "text",
        required: false
      },
      {
        name: "precio_compra",
        type: "number",
        required: false
      },
      {
        name: "precio_venta",
        type: "number",
        required: false
      },
      {
        name: "iva",
        type: "number",
        required: false
      },
      {
        name: "recargo",
        type: "number",
        required: false
      },
      {
        name: "margen",
        type: "number",
        required: false
      },
      {
        name: "stock_actual",
        type: "number",
        required: false
      },
      {
        name: "stock_minimo",
        type: "number",
        required: false
      },
      {
        name: "activo",
        type: "bool",
        required: false,
        options: {
          default: true
        }
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false
      },
      {
        name: "notas",
        type: "text",
        required: false
      },
      {
        name: "visible_online",
        type: "bool",
        required: false
      },
      {
        name: "reservable",
        type: "bool",
        required: false
      },
      {
        name: "porcentaje_deposito",
        type: "number",
        required: false
      },
      {
        name: "descripcion_online",
        type: "text",
        required: false
      },
      {
        name: "alerta_stock_bajo",
        type: "bool",
        required: false
      },
      {
        name: "ultima_alerta",
        type: "date",
        required: false
      }
    ]
  }
];

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando recreación de colecciones...');
    
    // Autenticar como superadmin
    await autenticarAdmin();
    
    // Obtener todas las colecciones existentes
    const coleccionesExistentes = await pb.collections.getFullList();
    console.log(`📋 Se encontraron ${coleccionesExistentes.length} colecciones existentes en PocketBase`);
    
    // Mapear colecciones por nombre
    const mapColeccionesExistentes = new Map();
    coleccionesExistentes.forEach(coleccion => {
      mapColeccionesExistentes.set(coleccion.name, coleccion);
    });
    
    // Procesar cada colección a recrear
    for (const datosColeccion of coleccionesARecrear) {
      const nombreColeccion = datosColeccion.name;
      const coleccionExistente = mapColeccionesExistentes.get(nombreColeccion);
      
      // Si la colección existe, hacer backup y eliminarla
      let datosBackup = [];
      if (coleccionExistente) {
        console.log(`🔄 La colección "${nombreColeccion}" ya existe, se recreará...`);
        
        // Hacer backup de los datos
        datosBackup = await hacerBackupColeccion(nombreColeccion);
        
        // Eliminar la colección
        const eliminada = await eliminarColeccion(coleccionExistente.id, nombreColeccion);
        
        if (!eliminada) {
          console.error(`❌ No se pudo eliminar la colección "${nombreColeccion}", saltando...`);
          continue;
        }
      } else {
        console.log(`🆕 La colección "${nombreColeccion}" no existe, se creará...`);
      }
      
      // Crear la colección con la estructura correcta
      const coleccionCreada = await crearColeccion(datosColeccion);
      
      if (!coleccionCreada) {
        console.error(`❌ No se pudo crear la colección "${nombreColeccion}", saltando...`);
        continue;
      }
      
      // Si había datos, restaurarlos
      if (datosBackup.length > 0) {
        await restaurarDatos(nombreColeccion, datosBackup);
      }
      
      console.log(`✅ Colección "${nombreColeccion}" recreada correctamente`);
      console.log('-----------------------------------');
    }
    
    // Actualizar relaciones entre colecciones
    console.log('\n🔄 Actualizando relaciones entre colecciones...');
    
    // Obtener las colecciones actualizadas
    const coleccionesActualizadas = await pb.collections.getFullList();
    const mapColeccionesActualizadas = new Map();
    coleccionesActualizadas.forEach(coleccion => {
      mapColeccionesActualizadas.set(coleccion.name, coleccion);
    });
    
    // Agregar relaciones a productos
    const productosColeccion = mapColeccionesActualizadas.get('productos');
    const categoriasColeccion = mapColeccionesActualizadas.get('categorias');
    const proveedoresColeccion = mapColeccionesActualizadas.get('proveedores');
    
    if (productosColeccion && categoriasColeccion && proveedoresColeccion) {
      console.log('🔄 Agregando relaciones a la colección "productos"...');
      
      // Preparar el esquema actualizado
      const esquemaActualizado = [...productosColeccion.schema];
      
      // Agregar relación con categorías
      esquemaActualizado.push({
        name: "categoria",
        type: "relation",
        required: false,
        options: {
          collectionId: categoriasColeccion.id,
          cascadeDelete: false,
          maxSelect: 1,
          displayFields: ["nombre"]
        }
      });
      
      // Agregar relación con proveedores
      esquemaActualizado.push({
        name: "proveedor",
        type: "relation",
        required: false,
        options: {
          collectionId: proveedoresColeccion.id,
          cascadeDelete: false,
          maxSelect: 1,
          displayFields: ["nombre"]
        }
      });
      
      // Actualizar el esquema
      try {
        await pb.collections.update(productosColeccion.id, {
          schema: esquemaActualizado
        });
        console.log('✅ Relaciones agregadas correctamente a "productos"');
      } catch (error) {
        console.error('❌ Error al agregar relaciones a "productos":', error.message);
      }
    } else {
      console.error('❌ No se pudieron encontrar todas las colecciones necesarias para las relaciones');
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
