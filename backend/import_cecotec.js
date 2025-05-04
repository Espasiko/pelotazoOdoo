/**
 * Script para importar productos Cecotec desde archivos JSON a PocketBase
 * 
 * Este script procesa los archivos JSON de Cecotec y los importa a PocketBase
 * Uso: node import_cecotec.js
 */

const fs = require('fs');
const path = require('path');
const PocketBase = require('pocketbase/cjs');

// Configuración
const JSON_DIR = '../csv';
const JSON_FILES = ['cecotec.json', 'nuevo-cecotec.json'];
const PB_URL = 'http://127.0.0.1:8092';
const ADMIN_EMAIL = 'admin@elpelotazo.com';
const ADMIN_PASSWORD = 'admin123'; // Cambiar después de la primera ejecución

// Inicializar PocketBase
const pb = new PocketBase(PB_URL);

// Función principal
async function importarProductosCecotec() {
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

    // Asegurarse de que existe la marca Cecotec
    let cecotecId = marcasMap['Cecotec'];
    if (!cecotecId) {
      console.log('Marca Cecotec no encontrada, creándola...');
      const nuevaMarca = await pb.collection('marcas').create({
        nombre: 'Cecotec',
        descripcion: 'Electrodomésticos Cecotec',
        activo: true
      });
      cecotecId = nuevaMarca.id;
      marcasMap['Cecotec'] = cecotecId;
    }

    // Procesar cada archivo JSON
    for (const jsonFile of JSON_FILES) {
      console.log(`Procesando ${jsonFile}`);
      
      // Leer archivo JSON
      const jsonPath = path.resolve(__dirname, JSON_DIR, jsonFile);
      if (!fs.existsSync(jsonPath)) {
        console.warn(`Archivo no encontrado: ${jsonPath}`);
        continue;
      }
      
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      // Verificar estructura del JSON
      if (!Array.isArray(jsonData)) {
        console.warn(`El archivo ${jsonFile} no contiene un array de productos`);
        continue;
      }
      
      console.log(`Encontrados ${jsonData.length} productos en ${jsonFile}`);
      
      // Mapear categorías de Cecotec a categorías de nuestra base de datos
      const categoriaCecotecMap = {
        'Aspiración': 'Robots',
        'Climatización': 'Aire Acondicionado',
        'Cocina': 'Cocina',
        'Preparación de Alimentos': 'PAE',
        'Cafeteras': 'Cafeteras',
        'Pequeños Electrodomésticos': 'PAE',
        'Televisores': 'Televisores',
        'Lavado y Secado': 'Lavadoras'
      };
      
      // Procesar cada producto
      for (const item of jsonData) {
        try {
          // Determinar categoría
          let categoriaId = null;
          if (item.categoria) {
            const categoriaName = categoriaCecotecMap[item.categoria] || 'Otros';
            categoriaId = categoriasMap[categoriaName];
          }
          
          if (!categoriaId) {
            categoriaId = categoriasMap['PAE']; // Categoría por defecto
          }
          
          // Crear objeto de producto
          const producto = {
            nombre: item.nombre || item.modelo || '',
            descripcion: item.descripcion || '',
            precio: parseFloat(item.precio || item.pvp || '0'),
            precio_oferta: item.precio_oferta ? parseFloat(item.precio_oferta) : null,
            stock: parseInt(item.stock || '5', 10), // Stock por defecto
            sku: item.referencia || item.sku || item.codigo || '',
            ean: item.ean || item.codigo_barras || '',
            categoria: categoriaId,
            marca: cecotecId,
            destacado: item.destacado === true,
            activo: true
          };
          
          // Validar datos mínimos
          if (!producto.nombre || producto.precio <= 0 || !producto.sku) {
            console.warn(`Producto con datos incompletos: ${JSON.stringify(item)}`);
            continue;
          }
          
          // Comprobar si el producto ya existe (por SKU)
          try {
            const existente = await pb.collection('productos').getFirstListItem(`sku="${producto.sku}"`);
            
            if (existente) {
              // Actualizar producto existente
              await pb.collection('productos').update(existente.id, producto);
              console.log(`Actualizado: ${producto.nombre} (${producto.sku})`);
            } else {
              throw { status: 404 }; // Forzar creación
            }
          } catch (error) {
            if (error.status === 404) {
              // Producto no existe, crear nuevo
              await pb.collection('productos').create(producto);
              console.log(`Creado: ${producto.nombre} (${producto.sku})`);
            } else {
              throw error; // Re-lanzar otros errores
            }
          }
        } catch (error) {
          console.error(`Error al procesar producto: ${error.message}`);
        }
      }
      
      console.log(`Completado ${jsonFile}`);
    }
    
    console.log('Importación de productos Cecotec finalizada con éxito');
    
  } catch (error) {
    console.error('Error durante la importación:', error);
  }
}

// Ejecutar la importación
importarProductosCecotec();