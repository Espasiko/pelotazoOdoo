import PocketBase from 'pocketbase';
import { pocketbaseConfig } from './config.js';

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para autenticar como superadmin
async function autenticarAdmin() {
  try {
    console.log(`🔑 Autenticando como superadmin (${pocketbaseConfig.admin.email})...`);
    
    // Verificar si ya está autenticado
    if (pb.authStore.isValid) {
      console.log('✅ Ya autenticado como superusuario');
      return true;
    }
    
    // En PocketBase 0.27.x, la autenticación de admin es a través de /api/collections/users/auth-with-password
    console.log('⚠️ Intentando autenticar como usuario normal...');
    await pb.collection('users').authWithPassword(pocketbaseConfig.admin.email, pocketbaseConfig.admin.password);
    console.log('✅ Autenticación exitosa como usuario');
    return true;
  } catch (error) {
    console.error('❌ Error al autenticar:', error);
    
    // Mostrar información detallada para depuración
    console.log('⚠️ Información de depuración:');
    console.log('- URL de PocketBase:', pocketbaseConfig.url);
    console.log('- Email de admin:', pocketbaseConfig.admin.email);
    console.log('- Versión de PocketBase: 0.27.2');
    
    return false;
  }
}

// Función para crear una colección
async function crearColeccion(nombre, campos, reglas = {}) {
  try {
    console.log(`🔄 Creando colección "${nombre}"...`);
    
    // Definir la estructura de la colección
    const data = {
      name: nombre,
      type: "base",
      schema: campos,
      listRule: reglas.listRule || "",
      viewRule: reglas.viewRule || "",
      createRule: reglas.createRule || "",
      updateRule: reglas.updateRule || "",
      deleteRule: reglas.deleteRule || ""
    };
    
    // Verificar si la colección ya existe
    try {
      const coleccionExistente = await pb.collections.getOne(nombre);
      console.log(`⚠️ La colección "${nombre}" ya existe, actualizando...`);
      
      // Actualizar la colección existente
      const coleccionActualizada = await pb.collections.update(nombre, data);
      console.log(`✅ Colección "${nombre}" actualizada correctamente`);
      return coleccionActualizada;
    } catch (error) {
      // Si la colección no existe, crearla
      const nuevaColeccion = await pb.collections.create(data);
      console.log(`✅ Colección "${nombre}" creada correctamente`);
      return nuevaColeccion;
    }
  } catch (error) {
    console.error(`❌ Error al crear/actualizar colección "${nombre}":`, error);
    return null;
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando creación de colecciones con SDK...');
    
    // Autenticar como superadmin
    const autenticado = await autenticarAdmin();
    if (!autenticado) {
      console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
      return;
    }
    
    // Crear colección de categorías
    const categorias = await crearColeccion("categorias", [
      {
        name: "nombre",
        type: "text",
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "descripcion",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "activo",
        type: "bool",
        required: false
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false,
        options: {
          min: "",
          max: ""
        }
      },
      {
        name: "visible_online",
        type: "bool",
        required: false
      },
      {
        name: "orden",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      }
    ]);
    
    // Crear colección de proveedores
    const proveedores = await crearColeccion("proveedores", [
      {
        name: "nombre",
        type: "text",
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "contacto",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "activo",
        type: "bool",
        required: false
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false,
        options: {
          min: "",
          max: ""
        }
      },
      {
        name: "nif",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "direccion",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "email",
        type: "email",
        required: false,
        options: {
          exceptDomains: null,
          onlyDomains: null
        }
      },
      {
        name: "telefono",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      }
    ]);
    
    // Crear colección de productos
    const productos = await crearColeccion("productos", [
      {
        name: "codigo",
        type: "text",
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "codigo_barras",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "codigo_barras_tipo",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "nombre",
        type: "text",
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "descripcion_larga",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "precio_compra",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "precio_venta",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "iva",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "recargo",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "margen",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "stock_actual",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "stock_minimo",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "activo",
        type: "bool",
        required: false
      },
      {
        name: "fecha_alta",
        type: "date",
        required: false,
        options: {
          min: "",
          max: ""
        }
      },
      {
        name: "notas",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
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
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "descripcion_online",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "alerta_stock_bajo",
        type: "bool",
        required: false
      },
      {
        name: "ultima_alerta",
        type: "date",
        required: false,
        options: {
          min: "",
          max: ""
        }
      },
      {
        name: "categoria",
        type: "relation",
        required: false,
        options: {
          collectionId: "categorias",
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
          displayFields: ["nombre"]
        }
      },
      {
        name: "proveedor",
        type: "relation",
        required: false,
        options: {
          collectionId: "proveedores",
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
          displayFields: ["nombre"]
        }
      }
    ]);
    
    // Crear colección de importaciones
    const importaciones = await crearColeccion("importaciones", [
      {
        name: "tipo",
        type: "text",
        required: true,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      },
      {
        name: "fecha",
        type: "date",
        required: true,
        options: {
          min: "",
          max: ""
        }
      },
      {
        name: "total_registros",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "registros_exitosos",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "registros_fallidos",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null
        }
      },
      {
        name: "notas",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: ""
        }
      }
    ]);
    
    console.log('\n📊 Resumen final de la creación de colecciones:');
    console.log(`   - Categorías: ${categorias ? '✅ Creada/Actualizada' : '❌ Error'}`);
    console.log(`   - Proveedores: ${proveedores ? '✅ Creada/Actualizada' : '❌ Error'}`);
    console.log(`   - Productos: ${productos ? '✅ Creada/Actualizada' : '❌ Error'}`);
    console.log(`   - Importaciones: ${importaciones ? '✅ Creada/Actualizada' : '❌ Error'}`);
    
    console.log('\n🏁 Proceso completado');
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message || error);
  }
}

// Ejecutar función principal
main();
