import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const CONFIG = {
  directorioJsons: path.resolve(__dirname, '../../jsons'),
  directorioSalida: path.resolve(__dirname, '../../datos_transformados'),
  fechaActual: new Date().toISOString()
};

// Asegurar que el directorio de salida exista
if (!fs.existsSync(CONFIG.directorioSalida)) {
  fs.mkdirSync(CONFIG.directorioSalida, { recursive: true });
  console.log(`📁 Directorio de salida creado: ${CONFIG.directorioSalida}`);
}

// Función para leer todos los archivos JSON del directorio
function leerArchivosJSON() {
  console.log(`📂 Leyendo archivos JSON de: ${CONFIG.directorioJsons}`);
  
  const archivos = fs.readdirSync(CONFIG.directorioJsons)
    .filter(archivo => archivo.endsWith('.json'));
  
  console.log(`📄 ${archivos.length} archivos JSON encontrados`);
  
  const datos = [];
  
  for (const archivo of archivos) {
    try {
      const rutaArchivo = path.join(CONFIG.directorioJsons, archivo);
      const contenido = fs.readFileSync(rutaArchivo, 'utf8');
      const json = JSON.parse(contenido);
      
      datos.push({
        nombre: archivo,
        proveedor: extraerNombreProveedor(archivo),
        tipo: determinarTipoArchivo(archivo),
        datos: json
      });
      
      console.log(`✅ Archivo leído correctamente: ${archivo}`);
    } catch (error) {
      console.error(`❌ Error al leer el archivo ${archivo}:`, error.message);
    }
  }
  
  return datos;
}

// Función para extraer el nombre del proveedor del nombre del archivo
function extraerNombreProveedor(nombreArchivo) {
  // Patrones comunes en los nombres de archivo
  const patrones = [
    // PVP ALFADYSER_extracted_extracted.json
    { regex: /^PVP\s+([A-Za-z0-9\-]+)/i, grupo: 1 },
    // alfadyser - VENDIDO ALFA_extracted.json
    { regex: /^([A-Za-z0-9\-]+)\s+-/i, grupo: 1 }
  ];
  
  for (const patron of patrones) {
    const match = nombreArchivo.match(patron.regex);
    if (match && match[patron.grupo]) {
      return match[patron.grupo].trim().toUpperCase();
    }
  }
  
  // Si no se encuentra un patrón, usar la primera palabra
  const primeraPalabra = nombreArchivo.split(' ')[0];
  return primeraPalabra.toUpperCase();
}

// Función para determinar el tipo de archivo (productos, ventas, reclamaciones)
function determinarTipoArchivo(nombreArchivo) {
  const nombreLower = nombreArchivo.toLowerCase();
  
  if (nombreLower.includes('vendido')) return 'ventas';
  if (nombreLower.includes('reclamacion')) return 'reclamaciones';
  if (nombreLower.includes('devolucion')) return 'devoluciones';
  if (nombreLower.includes('roto')) return 'roto';
  if (nombreLower.includes('pvp')) return 'productos';
  
  return 'productos'; // Por defecto
}

// Función para normalizar códigos de productos
function normalizarCodigo(codigo, proveedor) {
  if (!codigo) return null;
  
  // Convertir a string si es número
  let codigoStr = String(codigo);
  
  // Eliminar espacios y caracteres especiales
  codigoStr = codigoStr.trim()
    .replace(/[\s\/\\\*\?\"\'\<\>\|\:\;]/g, '')
    .toUpperCase();
  
  // Si está vacío después de la limpieza, retornar null
  if (!codigoStr) return null;
  
  // Añadir prefijo del proveedor si no lo tiene ya
  const proveedorPrefix = proveedor.toUpperCase().replace(/[\s\-]/g, '');
  if (!codigoStr.startsWith(proveedorPrefix)) {
    codigoStr = `${proveedorPrefix}_${codigoStr}`;
  }
  
  return codigoStr;
}

// Función para extraer categorías únicas
function extraerCategorias(datos) {
  console.log('🔍 Extrayendo categorías únicas...');
  
  const categorias = new Map();
  
  for (const archivo of datos) {
    if (archivo.tipo !== 'productos') continue;
    
    for (const item of archivo.datos) {
      // Buscar categorías en los datos
      // Las categorías suelen ser elementos con solo el nombre y sin otros campos
      if (typeof item[archivo.proveedor] === 'string' && 
          Object.keys(item).length <= 3 && 
          !item['__EMPTY_1'] && 
          !item['__EMPTY_2']) {
        
        const nombreCategoria = item[archivo.proveedor].trim();
        
        if (nombreCategoria && nombreCategoria.length > 1) {
          if (!categorias.has(nombreCategoria.toUpperCase())) {
            categorias.set(nombreCategoria.toUpperCase(), {
              nombre: nombreCategoria,
              activo: true,
              fecha_alta: CONFIG.fechaActual
            });
          }
        }
      }
    }
  }
  
  console.log(`✅ ${categorias.size} categorías únicas encontradas`);
  return Array.from(categorias.values());
}

// Función para extraer proveedores únicos
function extraerProveedores(datos) {
  console.log('🔍 Extrayendo proveedores únicos...');
  
  const proveedores = new Map();
  
  for (const archivo of datos) {
    const nombreProveedor = archivo.proveedor;
    
    if (nombreProveedor && !proveedores.has(nombreProveedor)) {
      proveedores.set(nombreProveedor, {
        nombre: nombreProveedor,
        activo: true,
        fecha_alta: CONFIG.fechaActual
      });
    }
  }
  
  console.log(`✅ ${proveedores.size} proveedores únicos encontrados`);
  return Array.from(proveedores.values());
}

// Función para extraer productos únicos
function extraerProductos(datos, categorias) {
  console.log('🔍 Extrayendo productos únicos...');
  
  const productos = new Map();
  let categoriaActual = null;
  
  // Crear un mapa de categorías para búsqueda rápida
  const categoriasMap = new Map();
  for (const categoria of categorias) {
    categoriasMap.set(categoria.nombre.toUpperCase(), categoria);
  }
  
  for (const archivo of datos) {
    if (archivo.tipo !== 'productos') continue;
    
    categoriaActual = null;
    
    for (const producto of archivo.datos) {
      const codigoOriginal = producto[archivo.proveedor];
      
      // Si es una categoría, actualizar la categoría actual
      if (typeof codigoOriginal === 'string' && 
          Object.keys(producto).length <= 3 && 
          !producto['__EMPTY_1'] && 
          !producto['__EMPTY_2']) {
        
        categoriaActual = codigoOriginal.trim().toUpperCase();
        continue;
      }
      
      // Si no es un producto válido (no tiene código o descripción), continuar
      if (!codigoOriginal || !producto['__EMPTY_1']) continue;
      
      // Normalizar código
      const codigo = normalizarCodigo(codigoOriginal, archivo.proveedor);
      if (!codigo) continue;
      
      // Extraer datos del producto
      const nombreOriginal = producto['__EMPTY_1'] || `Producto ${codigo}`;
      const nombre = typeof nombreOriginal === 'string' ? nombreOriginal : `Producto ${codigo}`;
      
      const precioVenta = extraerNumero(producto['__EMPTY_9'] || producto['P.V.P FINAL CLIENTE'] || 0);
      const precioCompra = extraerNumero(producto['__EMPTY_3'] || producto[' IMPORTE BRUTO'] || producto['IMPORTE BRUTO'] || 0);
      const stock = extraerNumero(producto['__EMPTY_15'] || 0);
      
      // Crear objeto de producto
      const productoObj = {
        codigo: codigo,
        nombre: nombre,
        descripcion_larga: nombre,
        precio_compra: precioCompra,
        precio_venta: precioVenta,
        iva: 21, // Por defecto
        stock_actual: stock,
        stock_minimo: 1,
        activo: true,
        fecha_alta: CONFIG.fechaActual,
        proveedor: archivo.proveedor,
        categoria: categoriaActual,
        notas: ""
      };
      
      // Añadir producto al mapa si no existe o actualizar si existe
      if (!productos.has(codigo)) {
        productos.set(codigo, productoObj);
      } else {
        // Si el producto ya existe, actualizar solo si este tiene más información
        const productoExistente = productos.get(codigo);
        if (!productoExistente.precio_venta && productoObj.precio_venta) {
          productoExistente.precio_venta = productoObj.precio_venta;
        }
        if (!productoExistente.precio_compra && productoObj.precio_compra) {
          productoExistente.precio_compra = productoObj.precio_compra;
        }
        if (!productoExistente.stock_actual && productoObj.stock_actual) {
          productoExistente.stock_actual = productoObj.stock_actual;
        }
      }
    }
  }
  
  console.log(`✅ ${productos.size} productos únicos encontrados`);
  return Array.from(productos.values());
}

// Función para extraer número de un valor (puede ser string con formato de moneda)
function extraerNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  
  // Convertir a string
  const str = String(valor);
  
  // Eliminar símbolos de moneda y espacios
  const limpio = str.replace(/[€\$\s]/g, '');
  
  // Convertir comas a puntos
  const conPunto = limpio.replace(',', '.');
  
  // Convertir a número
  const numero = parseFloat(conPunto);
  
  return isNaN(numero) ? 0 : numero;
}

// Función para guardar datos transformados
function guardarDatosTransformados(categorias, proveedores, productos) {
  console.log('💾 Guardando datos transformados...');
  
  // Guardar categorías
  fs.writeFileSync(
    path.join(CONFIG.directorioSalida, 'categorias.json'),
    JSON.stringify(categorias, null, 2),
    'utf8'
  );
  console.log(`✅ Categorías guardadas: ${categorias.length}`);
  
  // Guardar proveedores
  fs.writeFileSync(
    path.join(CONFIG.directorioSalida, 'proveedores.json'),
    JSON.stringify(proveedores, null, 2),
    'utf8'
  );
  console.log(`✅ Proveedores guardados: ${proveedores.length}`);
  
  // Guardar productos
  fs.writeFileSync(
    path.join(CONFIG.directorioSalida, 'productos.json'),
    JSON.stringify(productos, null, 2),
    'utf8'
  );
  console.log(`✅ Productos guardados: ${productos.length}`);
  
  console.log(`📁 Datos guardados en: ${CONFIG.directorioSalida}`);
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando proceso de transformación de datos...');
    
    // Leer archivos JSON
    const datos = leerArchivosJSON();
    
    // Extraer categorías y proveedores
    const categorias = extraerCategorias(datos);
    const proveedores = extraerProveedores(datos);
    
    // Extraer productos
    const productos = extraerProductos(datos, categorias);
    
    // Guardar datos transformados
    guardarDatosTransformados(categorias, proveedores, productos);
    
    console.log('🏁 Proceso finalizado correctamente');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
