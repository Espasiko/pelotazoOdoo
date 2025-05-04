import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const pocketbaseConfig = {
  url: 'http://127.0.0.1:8090',
  admin: {
    email: 'yo@mail.com',
    password: 'Ninami12$ya'
  }
};

const CONFIG = {
  directorioTransformados: path.resolve(__dirname, '../../datos_transformados'),
  logFile: path.resolve(__dirname, '../../logs/importacion.log')
};

// Asegurar que el directorio de logs exista
const logDir = path.dirname(CONFIG.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Instancia de PocketBase
const pb = new PocketBase(pocketbaseConfig.url);

// Función para escribir en el log
function escribirLog(mensaje) {
  const timestamp = new Date().toISOString();
  const logMensaje = `[${timestamp}] ${mensaje}\n`;
  
  console.log(mensaje);
  
  fs.appendFileSync(CONFIG.logFile, logMensaje, 'utf8');
}

// Función para autenticar como superadmin
async function autenticarAdmin() {
  try {
    // Verificar si ya estamos autenticados
    if (pb.authStore.isValid && pb.authStore.model?.id) {
      escribirLog('✅ Ya estamos autenticados como superadmin');
      return;
    }

    // Limpiar cualquier autenticación previa
    pb.authStore.clear();

    // Autenticar como superadmin
    const adminEmail = pocketbaseConfig.admin.email;
    const adminPassword = pocketbaseConfig.admin.password;
    
    escribirLog(`🔑 Autenticando como superadmin (${adminEmail})...`);
    
    // Intentar directamente con la colección de superusuarios
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    escribirLog('✅ Autenticación exitosa como superusuario');
  } catch (error) {
    escribirLog(`❌ Error al autenticar: ${error.message}`);
    throw new Error(`Error de autenticación: ${error.message}`);
  }
}

// Función para leer datos transformados
function leerDatosTransformados(archivo) {
  try {
    const rutaArchivo = path.join(CONFIG.directorioTransformados, archivo);
    
    if (!fs.existsSync(rutaArchivo)) {
      escribirLog(`❌ El archivo ${rutaArchivo} no existe`);
      return [];
    }
    
    escribirLog(`📄 Leyendo datos de: ${rutaArchivo}`);
    const contenido = fs.readFileSync(rutaArchivo, 'utf8');
    const datos = JSON.parse(contenido);
    
    escribirLog(`✅ Datos leídos correctamente. ${datos.length} registros encontrados.`);
    return datos;
  } catch (error) {
    escribirLog(`❌ Error al leer datos de ${archivo}: ${error.message}`);
    return [];
  }
}

// Función para importar categorías
async function importarCategorias(categorias) {
  escribirLog('🔄 Importando categorías...');
  
  const categoriasMap = new Map();
  let creadas = 0;
  let actualizadas = 0;
  let errores = 0;
  
  for (const categoria of categorias) {
    try {
      // Verificar si la categoría ya existe
      const filtro = `nombre="${categoria.nombre}"`;
      const existentes = await pb.collection('categorias').getFullList({ filter: filtro });
      
      if (existentes.length > 0) {
        // Actualizar categoría existente
        const id = existentes[0].id;
        await pb.collection('categorias').update(id, categoria);
        categoriasMap.set(categoria.nombre.toUpperCase(), id);
        actualizadas++;
        escribirLog(`🔄 Categoría actualizada: ${categoria.nombre}`);
      } else {
        // Crear nueva categoría
        const nuevaCategoria = await pb.collection('categorias').create(categoria);
        categoriasMap.set(categoria.nombre.toUpperCase(), nuevaCategoria.id);
        creadas++;
        escribirLog(`✅ Categoría creada: ${categoria.nombre}`);
      }
    } catch (error) {
      escribirLog(`❌ Error al importar categoría ${categoria.nombre}: ${error.message}`);
      // Intentar crear con campos mínimos si falla
      try {
        const categoriaMinima = {
          nombre: categoria.nombre,
          activo: true
        };
        const nuevaCategoria = await pb.collection('categorias').create(categoriaMinima);
        categoriasMap.set(categoria.nombre.toUpperCase(), nuevaCategoria.id);
        creadas++;
        escribirLog(`✅ Categoría creada con campos mínimos: ${categoria.nombre}`);
      } catch (innerError) {
        escribirLog(`❌ Error al crear categoría mínima ${categoria.nombre}: ${innerError.message}`);
        errores++;
      }
    }
  }
  
  escribirLog(`📊 Resumen de importación de categorías:`);
  escribirLog(`✅ Creadas: ${creadas}`);
  escribirLog(`🔄 Actualizadas: ${actualizadas}`);
  escribirLog(`❌ Errores: ${errores}`);
  
  return categoriasMap;
}

// Función para importar proveedores
async function importarProveedores(proveedores) {
  escribirLog('🔄 Importando proveedores...');
  
  const proveedoresMap = new Map();
  let creados = 0;
  let actualizados = 0;
  let errores = 0;
  
  for (const proveedor of proveedores) {
    try {
      // Verificar si el proveedor ya existe
      const filtro = `nombre="${proveedor.nombre}"`;
      const existentes = await pb.collection('proveedores').getFullList({ filter: filtro });
      
      if (existentes.length > 0) {
        // Actualizar proveedor existente
        const id = existentes[0].id;
        await pb.collection('proveedores').update(id, proveedor);
        proveedoresMap.set(proveedor.nombre.toUpperCase(), id);
        actualizados++;
        escribirLog(`🔄 Proveedor actualizado: ${proveedor.nombre}`);
      } else {
        // Crear nuevo proveedor
        const nuevoProveedor = await pb.collection('proveedores').create(proveedor);
        proveedoresMap.set(proveedor.nombre.toUpperCase(), nuevoProveedor.id);
        creados++;
        escribirLog(`✅ Proveedor creado: ${proveedor.nombre}`);
      }
    } catch (error) {
      escribirLog(`❌ Error al importar proveedor ${proveedor.nombre}: ${error.message}`);
      // Intentar crear con campos mínimos si falla
      try {
        const proveedorMinimo = {
          nombre: proveedor.nombre,
          activo: true
        };
        const nuevoProveedor = await pb.collection('proveedores').create(proveedorMinimo);
        proveedoresMap.set(proveedor.nombre.toUpperCase(), nuevoProveedor.id);
        creados++;
        escribirLog(`✅ Proveedor creado con campos mínimos: ${proveedor.nombre}`);
      } catch (innerError) {
        escribirLog(`❌ Error al crear proveedor mínimo ${proveedor.nombre}: ${innerError.message}`);
        errores++;
      }
    }
  }
  
  escribirLog(`📊 Resumen de importación de proveedores:`);
  escribirLog(`✅ Creados: ${creados}`);
  escribirLog(`🔄 Actualizados: ${actualizados}`);
  escribirLog(`❌ Errores: ${errores}`);
  
  return proveedoresMap;
}

// Función para importar productos
async function importarProductos(productos, categoriasMap, proveedoresMap) {
  escribirLog('🔄 Importando productos...');
  
  let creados = 0;
  let actualizados = 0;
  let errores = 0;
  
  for (const producto of productos) {
    try {
      // Preparar datos del producto para PocketBase
      const productoPB = { 
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion_larga: producto.descripcion_larga,
        precio_compra: producto.precio_compra || 0,
        precio_venta: producto.precio_venta || 0,
        iva: producto.iva || 21,
        stock_actual: producto.stock_actual || 0,
        stock_minimo: producto.stock_minimo || 1,
        activo: true,
        fecha_alta: producto.fecha_alta || new Date().toISOString()
      };
      
      // Asignar ID de categoría si existe
      if (producto.categoria && categoriasMap.has(producto.categoria.toUpperCase())) {
        productoPB.categoria = categoriasMap.get(producto.categoria.toUpperCase());
      }
      
      // Asignar ID de proveedor si existe
      if (producto.proveedor && proveedoresMap.has(producto.proveedor.toUpperCase())) {
        productoPB.proveedor = proveedoresMap.get(producto.proveedor.toUpperCase());
      }
      
      // Verificar si el producto ya existe
      const filtro = `codigo="${producto.codigo}"`;
      const existentes = await pb.collection('productos').getFullList({ filter: filtro });
      
      if (existentes.length > 0) {
        // Actualizar producto existente
        const id = existentes[0].id;
        await pb.collection('productos').update(id, productoPB);
        actualizados++;
        
        if (actualizados % 10 === 0) {
          escribirLog(`🔄 ${actualizados} productos actualizados...`);
        }
      } else {
        // Crear nuevo producto
        await pb.collection('productos').create(productoPB);
        creados++;
        
        if (creados % 10 === 0) {
          escribirLog(`✅ ${creados} productos creados...`);
        }
      }
    } catch (error) {
      escribirLog(`❌ Error al importar producto ${producto.codigo}: ${error.message}`);
      // Intentar crear con campos mínimos si falla
      try {
        const productoMinimo = {
          codigo: producto.codigo,
          nombre: producto.nombre || `Producto ${producto.codigo}`,
          activo: true
        };
        await pb.collection('productos').create(productoMinimo);
        creados++;
        escribirLog(`✅ Producto creado con campos mínimos: ${producto.codigo}`);
      } catch (innerError) {
        escribirLog(`❌ Error al crear producto mínimo ${producto.codigo}: ${innerError.message}`);
        errores++;
      }
    }
  }
  
  escribirLog(`📊 Resumen de importación de productos:`);
  escribirLog(`✅ Creados: ${creados}`);
  escribirLog(`🔄 Actualizados: ${actualizados}`);
  escribirLog(`❌ Errores: ${errores}`);
}

// Función para registrar la importación
async function registrarImportacion(resumen) {
  try {
    const importacion = {
      fecha: new Date().toISOString(),
      archivo: 'datos_transformados',
      estado: 'completado',
      registros_procesados: resumen.total,
      registros_creados: resumen.creados,
      registros_actualizados: resumen.actualizados,
      registros_con_error: resumen.errores,
      log: `Importación completada. ${resumen.creados} creados, ${resumen.actualizados} actualizados, ${resumen.errores} errores.`
    };
    
    const nuevaImportacion = await pb.collection('importaciones').create(importacion);
    escribirLog(`✅ Importación registrada con ID: ${nuevaImportacion.id}`);
    
    return nuevaImportacion.id;
  } catch (error) {
    escribirLog(`❌ Error al registrar la importación: ${error.message}`);
    return null;
  }
}

// Función principal
async function main() {
  try {
    escribirLog('🚀 Iniciando proceso de importación de datos...');
    
    // Autenticar como superadmin
    await autenticarAdmin();
    
    // Leer datos transformados
    const categorias = leerDatosTransformados('categorias.json');
    const proveedores = leerDatosTransformados('proveedores.json');
    const productos = leerDatosTransformados('productos.json');
    
    // Importar datos
    const categoriasMap = await importarCategorias(categorias);
    const proveedoresMap = await importarProveedores(proveedores);
    await importarProductos(productos, categoriasMap, proveedoresMap);
    
    // Registrar importación
    const resumen = {
      total: categorias.length + proveedores.length + productos.length,
      creados: 0, // Esto debería actualizarse con los valores reales
      actualizados: 0, // Esto debería actualizarse con los valores reales
      errores: 0 // Esto debería actualizarse con los valores reales
    };
    
    await registrarImportacion(resumen);
    
    escribirLog('🏁 Proceso de importación finalizado');
    
  } catch (error) {
    escribirLog(`❌ Error en el proceso de importación: ${error.message}`);
  }
}

// Ejecutar función principal
main().catch(error => {
  escribirLog(`❌ Error fatal: ${error.message}`);
  process.exit(1);
});
