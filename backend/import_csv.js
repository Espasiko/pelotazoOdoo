/**
 * Script para importar productos desde archivos CSV a PocketBase
 * 
 * Este script procesa los archivos CSV de la carpeta /csv y los importa a PocketBase
 * Uso: node import_csv.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const PocketBase = require('pocketbase/cjs');

// Configuración
const CSV_DIR = '../csv';
const PB_URL = 'http://127.0.0.1:8092';
const ADMIN_EMAIL = 'admin@elpelotazo.com';
const ADMIN_PASSWORD = 'admin123'; // Cambiar después de la primera ejecución

// Mapeo de nombres de archivos CSV a categorías
const CSV_CATEGORIA_MAP = {
  'PVP ALMCE.xlsx - A-AC.csv': 'Aire Acondicionado',
  'PVP ALMCE.xlsx - CAFE.csv': 'Cafeteras',
  'PVP ALMCE.xlsx - CAMPANAS.csv': 'Campanas',
  'PVP ALMCE.xlsx - COCINA ESCAPARATE.csv': 'Cocina',
  'PVP ALMCE.xlsx - CONGEL.csv': 'Congeladores',
  'PVP ALMCE.xlsx - FRIGOS.csv': 'Frigoríficos',
  'PVP ALMCE.xlsx - HORNOS.csv': 'Hornos',
  'PVP ALMCE.xlsx - LAVAD.csv': 'Lavadoras',
  'PVP ALMCE.xlsx - LAVAV.csv': 'Lavavajillas',
  'PVP ALMCE.xlsx - MICRO.csv': 'Microondas',
  'PVP ALMCE.xlsx - PAE.csv': 'PAE',
  'PVP ALMCE.xlsx - PLACAS.csv': 'Placas',
  'PVP ALMCE.xlsx - ROTO.csv': 'Robots',
  'PVP ALMCE.xlsx - SECAD.csv': 'Secadoras',
  'PVP ALMCE.xlsx - TV.csv': 'Televisores',
};

// Inicializar PocketBase
const pb = new PocketBase(PB_URL);

// Función principal
async function importarProductos() {
  try {
    // Autenticar como admin
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('Autenticado correctamente como admin');

    // Obtener todas las categorías y marcas para mapeo
    const categorias = await pb.collection('categorias').getFullList();
    const marcas = await pb.collection('marcas').getFullList();

    // Crear mapeos de nombres a IDs
    const categoriasMap = {};
    categorias.forEach(cat => {
      categoriasMap[cat.nombre] = cat.id;
    });

    const marcasMap = {};
    marcas.forEach(marca => {
      marcasMap[marca.nombre] = marca.id;
    });

    // Obtener lista de archivos CSV
    const csvFiles = fs.readdirSync(path.resolve(__dirname, CSV_DIR))
      .filter(file => file.endsWith('.csv'));

    console.log(`Encontrados ${csvFiles.length} archivos CSV para procesar`);

    // Procesar cada archivo CSV
    for (const csvFile of csvFiles) {
      // Determinar la categoría basada en el nombre del archivo
      const categoriaName = CSV_CATEGORIA_MAP[csvFile] || 'Otros';
      const categoriaId = categoriasMap[categoriaName];

      if (!categoriaId) {
        console.warn(`Categoría no encontrada para ${csvFile}: ${categoriaName}`);
        continue;
      }

      console.log(`Procesando ${csvFile} (Categoría: ${categoriaName})`);

      // Leer y procesar el archivo CSV
      const productos = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(path.resolve(__dirname, CSV_DIR, csvFile))
          .pipe(csv({ separator: ';' }))
          .on('data', (data) => {
            // Adaptar según la estructura de los CSV
            // Ejemplo basado en estructura común
            const producto = {
              nombre: data.MODELO || data.Modelo || data.DESCRIPCION || data.Descripcion || '',
              descripcion: data.DESCRIPCION || data.Descripcion || '',
              precio: parseFloat(data.PVP?.replace(',', '.') || data.Precio?.replace(',', '.') || '0'),
              stock: parseInt(data.STOCK || data.Stock || '0', 10),
              sku: data.REFERENCIA || data.Referencia || data.SKU || data.Sku || '',
              ean: data.EAN || data.Ean || data.CODIGO || data.Codigo || '',
              categoria: categoriaId,
              // Intentar determinar la marca desde el nombre o usar 'Otras'
              marca: determinarMarca(data.MARCA || data.Marca || data.FABRICANTE || data.Fabricante || '', marcasMap),
              destacado: false,
              activo: true
            };

            // Solo añadir productos con datos mínimos válidos
            if (producto.nombre && producto.precio > 0 && producto.sku) {
              productos.push(producto);
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      // Importar productos a PocketBase
      console.log(`Importando ${productos.length} productos de ${csvFile}`);
      
      for (const producto of productos) {
        try {
          // Comprobar si el producto ya existe (por SKU)
          const existente = await pb.collection('productos').getFirstListItem(`sku="${producto.sku}"`);
          
          if (existente) {
            // Actualizar producto existente
            await pb.collection('productos').update(existente.id, producto);
            console.log(`Actualizado: ${producto.nombre} (${producto.sku})`);
          } else {
            // Crear nuevo producto
            await pb.collection('productos').create(producto);
            console.log(`Creado: ${producto.nombre} (${producto.sku})`);
          }
        } catch (error) {
          if (error.status !== 404) {
            console.error(`Error al procesar ${producto.sku}: ${error.message}`);
          } else {
            // Producto no existe, crear nuevo
            try {
              await pb.collection('productos').create(producto);
              console.log(`Creado: ${producto.nombre} (${producto.sku})`);
            } catch (createError) {
              console.error(`Error al crear ${producto.sku}: ${createError.message}`);
            }
          }
        }
      }

      console.log(`Completado ${csvFile}`);
    }

    console.log('Importación finalizada con éxito');

  } catch (error) {
    console.error('Error durante la importación:', error);
  }
}

// Función para determinar la marca basada en el texto
function determinarMarca(textoMarca, marcasMap) {
  if (!textoMarca) return marcasMap['Otras'];
  
  // Normalizar texto
  const normalizado = textoMarca.toLowerCase().trim();
  
  // Buscar coincidencias exactas primero
  for (const [nombre, id] of Object.entries(marcasMap)) {
    if (normalizado === nombre.toLowerCase()) {
      return id;
    }
  }
  
  // Buscar coincidencias parciales
  for (const [nombre, id] of Object.entries(marcasMap)) {
    if (normalizado.includes(nombre.toLowerCase()) || 
        nombre.toLowerCase().includes(normalizado)) {
      return id;
    }
  }
  
  // Si no hay coincidencia, usar 'Otras'
  return marcasMap['Otras'];
}

// Ejecutar la importación
importarProductos();