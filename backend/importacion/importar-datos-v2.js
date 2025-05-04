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

// Nombres de las colecciones
const COLECCION_CATEGORIAS = 'categorias';
const COLECCION_PROVEEDORES = 'proveedores';
const COLECCION_PRODUCTOS = 'productos';
const COLECCION_IMPORTACIONES = 'importaciones';

// Función para autenticar como superadmin
async function autenticarAdmin() {
  try {
    console.log(`🔑 Autenticando como superadmin (${pocketbaseConfig.admin.email})...`);
    
    // Verificar si ya está autenticado
    if (pb.authStore.isValid) {
      console.log('✅ Ya autenticado como superusuario');
      return true;
    }
    
    // Autenticar como admin
    await pb.admins.authWithPassword(pocketbaseConfig.admin.email, pocketbaseConfig.admin.password);
    console.log('✅ Autenticación exitosa como superusuario');
    return true;
  } catch (error) {
    console.error('❌ Error al autenticar:', error);
    return false;
  }
}

// Función para leer datos transformados
async function leerDatosTransformados(tipo) {
  try {
    const rutaArchivo = path.join(__dirname, `../../datos_transformados/${tipo}.json`);
    console.log(`📂 Leyendo archivo ${rutaArchivo}...`);
    
    if (!fs.existsSync(rutaArchivo)) {
      console.error(`❌ El archivo ${rutaArchivo} no existe`);
      return [];
    }
    
    const contenido = await fs.promises.readFile(rutaArchivo, 'utf8');
    const datos = JSON.parse(contenido);
    
    console.log(`✅ Se leyeron ${datos.length} registros de ${tipo}`);
    return datos;
  } catch (error) {
    console.error(`❌ Error al leer datos de ${tipo}:`, error.message);
    return [];
  }
}

// Función para registrar la importación
async function registrarImportacion(tipo, total, exitosos, fallidos) {
  try {
    console.log(`📝 Registrando importación de ${tipo}...`);
    
    const importacion = {
      tipo,
      fecha: new Date().toISOString(),
      total_registros: total,
      registros_exitosos: exitosos,
      registros_fallidos: fallidos,
      notas: `Importación de ${tipo} realizada el ${new Date().toLocaleString()}`
    };
    
    try {
      const resultado = await pb.collection(COLECCION_IMPORTACIONES).create(importacion);
      console.log(`✅ Importación registrada con ID: ${resultado.id}`);
      return resultado.id;
    } catch (error) {
      console.error(`❌ Error al registrar importación de ${tipo}:`, error.message || error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error al registrar importación de ${tipo}:`, error.message || error);
    return null;
  }
}

// Función para importar categorías
async function importarCategorias() {
  try {
    console.log('\n🔄 Importando categorías...');
    
    // Leer datos transformados
    const categorias = await leerDatosTransformados('categorias');
    
    if (categorias.length === 0) {
      console.log('⚠️ No hay categorías para importar');
      return { exitosos: 0, fallidos: 0, total: 0 };
    }
    
    // Contadores
    let exitosos = 0;
    let fallidos = 0;
    
    // Importar cada categoría
    for (const categoria of categorias) {
      try {
        // Verificar si ya existe por nombre
        const existentes = await pb.collection(COLECCION_CATEGORIAS).getList(1, 1, {
          filter: `nombre = "${categoria.nombre}"`
        });
        
        if (existentes.items.length > 0) {
          console.log(`⚠️ La categoría "${categoria.nombre}" ya existe, actualizando...`);
          
          // Actualizar categoría existente
          await pb.collection(COLECCION_CATEGORIAS).update(existentes.items[0].id, {
            ...categoria,
            activo: true
          });
          
          exitosos++;
        } else {
          // Crear nueva categoría
          await pb.collection(COLECCION_CATEGORIAS).create({
            ...categoria,
            fecha_alta: new Date().toISOString()
          });
          
          exitosos++;
        }
      } catch (error) {
        console.error(`❌ Error al importar categoría "${categoria.nombre}":`, error.message);
        fallidos++;
      }
    }
    
    console.log(`✅ Importación de categorías completada: ${exitosos} exitosas, ${fallidos} fallidas`);
    
    // Registrar importación
    await registrarImportacion('categorias', categorias.length, exitosos, fallidos);
    
    return { exitosos, fallidos, total: categorias.length };
  } catch (error) {
    console.error('❌ Error al importar categorías:', error.message);
    return { exitosos: 0, fallidos: 0, total: 0 };
  }
}

// Función para importar proveedores
async function importarProveedores() {
  try {
    console.log('\n🔄 Importando proveedores...');
    
    // Leer datos transformados
    const proveedores = await leerDatosTransformados('proveedores');
    
    if (proveedores.length === 0) {
      console.log('⚠️ No hay proveedores para importar');
      return { exitosos: 0, fallidos: 0, total: 0 };
    }
    
    // Contadores
    let exitosos = 0;
    let fallidos = 0;
    
    // Importar cada proveedor
    for (const proveedor of proveedores) {
      try {
        // Verificar si ya existe por nombre
        const existentes = await pb.collection(COLECCION_PROVEEDORES).getList(1, 1, {
          filter: `nombre = "${proveedor.nombre}"`
        });
        
        if (existentes.items.length > 0) {
          console.log(`⚠️ El proveedor "${proveedor.nombre}" ya existe, actualizando...`);
          
          // Actualizar proveedor existente
          await pb.collection(COLECCION_PROVEEDORES).update(existentes.items[0].id, {
            ...proveedor,
            activo: true
          });
          
          exitosos++;
        } else {
          // Crear nuevo proveedor
          await pb.collection(COLECCION_PROVEEDORES).create({
            ...proveedor,
            fecha_alta: new Date().toISOString()
          });
          
          exitosos++;
        }
      } catch (error) {
        console.error(`❌ Error al importar proveedor "${proveedor.nombre}":`, error.message);
        fallidos++;
      }
    }
    
    console.log(`✅ Importación de proveedores completada: ${exitosos} exitosos, ${fallidos} fallidos`);
    
    // Registrar importación
    await registrarImportacion('proveedores', proveedores.length, exitosos, fallidos);
    
    return { exitosos, fallidos, total: proveedores.length };
  } catch (error) {
    console.error('❌ Error al importar proveedores:', error.message);
    return { exitosos: 0, fallidos: 0, total: 0 };
  }
}

// Función para importar productos
async function importarProductos() {
  try {
    console.log('\n🔄 Importando productos...');
    
    // Leer datos transformados
    const productos = await leerDatosTransformados('productos');
    
    if (productos.length === 0) {
      console.log('⚠️ No hay productos para importar');
      return { exitosos: 0, fallidos: 0, total: 0 };
    }
    
    // Obtener todas las categorías
    const categorias = await pb.collection(COLECCION_CATEGORIAS).getFullList();
    const mapaCategorias = new Map();
    categorias.forEach(cat => {
      mapaCategorias.set(cat.nombre.toLowerCase(), cat.id);
    });
    
    // Obtener todos los proveedores
    const proveedores = await pb.collection(COLECCION_PROVEEDORES).getFullList();
    const mapaProveedores = new Map();
    proveedores.forEach(prov => {
      mapaProveedores.set(prov.nombre.toLowerCase(), prov.id);
    });
    
    // Contadores
    let exitosos = 0;
    let fallidos = 0;
    
    // Importar cada producto
    for (const producto of productos) {
      try {
        // Preparar datos del producto
        const datosProducto = {
          codigo: producto.codigo || '',
          nombre: producto.nombre || '',
          descripcion_larga: producto.descripcion_larga || '',
          precio_compra: producto.precio_compra || 0,
          precio_venta: producto.precio_venta || 0,
          iva: producto.iva || 21,
          stock_actual: producto.stock_actual || 0,
          stock_minimo: producto.stock_minimo || 0,
          activo: true,
          fecha_alta: new Date().toISOString(),
          notas: producto.notas || ''
        };
        
        // Asignar categoría si existe
        if (producto.categoria && mapaCategorias.has(producto.categoria.toLowerCase())) {
          datosProducto.categoria = mapaCategorias.get(producto.categoria.toLowerCase());
        }
        
        // Asignar proveedor si existe
        if (producto.proveedor && mapaProveedores.has(producto.proveedor.toLowerCase())) {
          datosProducto.proveedor = mapaProveedores.get(producto.proveedor.toLowerCase());
        }
        
        // Verificar si ya existe por código
        const existentes = await pb.collection(COLECCION_PRODUCTOS).getList(1, 1, {
          filter: `codigo = "${producto.codigo}"`
        });
        
        if (existentes.items.length > 0) {
          console.log(`⚠️ El producto "${producto.codigo}" ya existe, actualizando...`);
          
          // Actualizar producto existente
          await pb.collection(COLECCION_PRODUCTOS).update(existentes.items[0].id, datosProducto);
          
          exitosos++;
        } else {
          // Crear nuevo producto
          await pb.collection(COLECCION_PRODUCTOS).create(datosProducto);
          
          exitosos++;
        }
      } catch (error) {
        console.error(`❌ Error al importar producto "${producto.codigo}":`, error.message);
        fallidos++;
      }
    }
    
    console.log(`✅ Importación de productos completada: ${exitosos} exitosos, ${fallidos} fallidos`);
    
    // Registrar importación
    await registrarImportacion('productos', productos.length, exitosos, fallidos);
    
    return { exitosos, fallidos, total: productos.length };
  } catch (error) {
    console.error('❌ Error al importar productos:', error.message);
    return { exitosos: 0, fallidos: 0, total: 0 };
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando importación de datos...');
    
    // Autenticar como superadmin
    const autenticado = await autenticarAdmin();
    if (!autenticado) {
      console.error('❌ Error en el proceso: No se pudo autenticar como superadmin');
      return;
    }
    
    // Importar categorías
    await importarCategorias();
    
    // Importar proveedores
    await importarProveedores();
    
    // Importar productos
    await importarProductos();
    
    console.log('\n📊 Resumen final de la importación:');
    console.log(`   - Categorías: ${resumenImportacion.categorias.exitosos} exitosas, ${resumenImportacion.categorias.fallidos} fallidas (total: ${resumenImportacion.categorias.total})`);
    console.log(`   - Proveedores: ${resumenImportacion.proveedores.exitosos} exitosos, ${resumenImportacion.proveedores.fallidos} fallidos (total: ${resumenImportacion.proveedores.total})`);
    console.log(`   - Productos: ${resumenImportacion.productos.exitosos} exitosos, ${resumenImportacion.productos.fallidos} fallidos (total: ${resumenImportacion.productos.total})`);
    
    console.log('\n🏁 Proceso completado');
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message || error);
  }
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
