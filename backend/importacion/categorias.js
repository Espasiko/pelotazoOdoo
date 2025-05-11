/**
 * Módulo de categorías para el sistema de importación
 * Este módulo maneja la detección, creación y asignación de categorías
 */

import { fetchAdmin, get, post } from './db/client.js';

// Categorías predefinidas para productos
const CATEGORIAS_PREDEFINIDAS = [
  'Electrodomésticos',
  'Cocina',
  'Pequeño electrodoméstico',
  'Climatización',
  'Audio y vídeo',
  'Informática',
  'Telefonía',
  'Hogar',
  'Jardín',
  'Limpieza',
  'Cuidado personal',
  'Otros'
];

/**
 * Inicializa las categorías predefinidas en la base de datos
 * @returns {Promise<Array>} - Array de categorías creadas
 */
export async function inicializarCategoriasPredefinidas() {
  console.log('Inicializando categorías predefinidas...');
  
  const categorias = [];
  
  for (const nombre of CATEGORIAS_PREDEFINIDAS) {
    try {
      const categoria = await crearCategoria(nombre);
      if (categoria) {
        categorias.push(categoria);
      }
    } catch (error) {
      console.error(`Error al inicializar categoría ${nombre}:`, error);
    }
  }
  
  console.log(`${categorias.length} categorías inicializadas`);
  return categorias;
}

/**
 * Crea una categoría o encuentra una existente
 * @param {string} nombre - Nombre de la categoría
 * @returns {Promise<Object|null>} - Categoría creada o encontrada
 */
export async function crearCategoria(nombre) {
  if (!nombre) return null;
  
  // Normalizar el nombre
  const nombreNormalizado = nombre.trim();
  
  try {
    // Buscar si ya existe
    const categoriasExistentes = await fetchAdmin(`/api/collections/categorias/records`, {
      method: 'GET',
      params: {
        filter: `nombre="${nombreNormalizado}"`
      }
    });
    
    if (categoriasExistentes.items && categoriasExistentes.items.length > 0) {
      console.log(`Categoría ${nombreNormalizado} ya existe con ID: ${categoriasExistentes.items[0].id}`);
      return categoriasExistentes.items[0];
    }
    
    // Si no existe, crearla
    const nuevaCategoria = await fetchAdmin(`/api/collections/categorias/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: nombreNormalizado,
        descripcion: `Categoría para productos de ${nombreNormalizado}`,
        activo: true
      }),
    });
    
    console.log(`Categoría ${nombreNormalizado} creada con ID: ${nuevaCategoria.id}`);
    return nuevaCategoria;
  } catch (error) {
    console.error(`Error al crear categoría ${nombreNormalizado}:`, error);
    return null;
  }
}

/**
 * Detecta categorías en los datos
 * @param {Array} datos - Datos a analizar
 * @returns {Promise<Array>} - Array de categorías detectadas
 */
export async function detectarCategorias(datos) {
  console.log('Detectando categorías en los datos...');
  
  const categorias = [];
  const nombresCategorias = new Set();
  
  // Buscar posibles categorías en los datos
  for (const item of datos) {
    // Buscar en campos que podrían contener categorías
    for (const key of Object.keys(item)) {
      if (key.toUpperCase().includes('CATEG') || key.toUpperCase().includes('TIPO')) {
        const valor = item[key];
        if (valor && typeof valor === 'string' && valor.length > 2) {
          nombresCategorias.add(valor.trim());
        }
      }
    }
    
    // Intentar inferir categoría por el nombre del producto
    if (item.nombre || item.NOMBRE || item.DESCRIPCION) {
      const nombreProducto = (item.nombre || item.NOMBRE || item.DESCRIPCION).toUpperCase();
      
      // Palabras clave para categorías
      const keywordsCategorias = {
        'Electrodomésticos': ['LAVADORA', 'NEVERA', 'FRIGORÍFICO', 'LAVAVAJILLAS', 'HORNO', 'MICROONDAS'],
        'Cocina': ['COCINA', 'BATIDORA', 'CAFETERA', 'TOSTADORA', 'FREIDORA', 'ROBOT'],
        'Pequeño electrodoméstico': ['PLANCHA', 'ASPIRADORA', 'SECADOR', 'VENTILADOR'],
        'Climatización': ['AIRE', 'CALEFACTOR', 'ESTUFA', 'RADIADOR', 'CLIMATIZADOR'],
        'Audio y vídeo': ['TV', 'TELEVISOR', 'ALTAVOZ', 'AURICULAR', 'RADIO', 'SONIDO'],
        'Informática': ['ORDENADOR', 'PORTÁTIL', 'TABLET', 'IMPRESORA', 'MONITOR', 'TECLADO', 'RATÓN'],
        'Telefonía': ['MÓVIL', 'TELÉFONO', 'SMARTPHONE', 'CARGADOR'],
        'Hogar': ['MUEBLE', 'LÁMPARA', 'CORTINA', 'ALFOMBRA', 'COJÍN'],
        'Jardín': ['JARDÍN', 'CORTACÉSPED', 'MANGUERA', 'MACETA', 'PLANTA'],
        'Limpieza': ['LIMPIEZA', 'DETERGENTE', 'ESCOBA', 'FREGONA', 'ASPIRADORA'],
        'Cuidado personal': ['AFEITADORA', 'DEPILADORA', 'CEPILLO', 'SECADOR', 'MAQUINILLA']
      };
      
      for (const [categoria, keywords] of Object.entries(keywordsCategorias)) {
        for (const keyword of keywords) {
          if (nombreProducto.includes(keyword)) {
            nombresCategorias.add(categoria);
            break;
          }
        }
      }
    }
  }
  
  // Crear o encontrar categorías
  for (const nombre of nombresCategorias) {
    try {
      const categoria = await crearCategoria(nombre);
      if (categoria) {
        categorias.push(categoria);
      }
    } catch (error) {
      console.error(`Error al procesar categoría ${nombre}:`, error);
    }
  }
  
  // Añadir categorías predefinidas si no se detectaron suficientes
  if (categorias.length < 3) {
    console.log('Pocas categorías detectadas, añadiendo predefinidas...');
    const predefinidas = await inicializarCategoriasPredefinidas();
    
    for (const predefinida of predefinidas) {
      if (!categorias.some(c => c.id === predefinida.id)) {
        categorias.push(predefinida);
      }
    }
  }
  
  console.log(`${categorias.length} categorías detectadas o creadas`);
  return categorias;
}

/**
 * Asigna una categoría a un producto
 * @param {number} indice - Índice del producto en el array
 * @param {Array} categorias - Array de categorías disponibles
 * @param {string} nombreProducto - Nombre del producto
 * @returns {Promise<string|null>} - ID de la categoría asignada
 */
export async function asignarCategoria(indice, categorias, nombreProducto) {
  if (!categorias || categorias.length === 0) return null;
  
  // Si hay pocas categorías, asignar por índice
  if (categorias.length <= 5) {
    const categoriaIndex = indice % categorias.length;
    return categorias[categoriaIndex].id;
  }
  
  // Intentar asignar por nombre del producto
  if (nombreProducto) {
    const nombreUpper = nombreProducto.toUpperCase();
    
    // Palabras clave para categorías
    const keywordsCategorias = {
      'Electrodomésticos': ['LAVADORA', 'NEVERA', 'FRIGORÍFICO', 'LAVAVAJILLAS', 'HORNO', 'MICROONDAS'],
      'Cocina': ['COCINA', 'BATIDORA', 'CAFETERA', 'TOSTADORA', 'FREIDORA', 'ROBOT'],
      'Pequeño electrodoméstico': ['PLANCHA', 'ASPIRADORA', 'SECADOR', 'VENTILADOR'],
      'Climatización': ['AIRE', 'CALEFACTOR', 'ESTUFA', 'RADIADOR', 'CLIMATIZADOR'],
      'Audio y vídeo': ['TV', 'TELEVISOR', 'ALTAVOZ', 'AURICULAR', 'RADIO', 'SONIDO'],
      'Informática': ['ORDENADOR', 'PORTÁTIL', 'TABLET', 'IMPRESORA', 'MONITOR', 'TECLADO', 'RATÓN'],
      'Telefonía': ['MÓVIL', 'TELÉFONO', 'SMARTPHONE', 'CARGADOR'],
      'Hogar': ['MUEBLE', 'LÁMPARA', 'CORTINA', 'ALFOMBRA', 'COJÍN'],
      'Jardín': ['JARDÍN', 'CORTACÉSPED', 'MANGUERA', 'MACETA', 'PLANTA'],
      'Limpieza': ['LIMPIEZA', 'DETERGENTE', 'ESCOBA', 'FREGONA', 'ASPIRADORA'],
      'Cuidado personal': ['AFEITADORA', 'DEPILADORA', 'CEPILLO', 'SECADOR', 'MAQUINILLA']
    };
    
    for (const categoria of categorias) {
      const nombreCategoria = categoria.nombre;
      
      // Comprobar si el nombre de la categoría está en el nombre del producto
      if (nombreUpper.includes(nombreCategoria.toUpperCase())) {
        return categoria.id;
      }
      
      // Comprobar palabras clave
      const keywords = keywordsCategorias[nombreCategoria];
      if (keywords) {
        for (const keyword of keywords) {
          if (nombreUpper.includes(keyword)) {
            return categoria.id;
          }
        }
      }
    }
  }
  
  // Si no se pudo asignar por nombre, asignar por índice
  const categoriaIndex = indice % categorias.length;
  return categorias[categoriaIndex].id;
}

/**
 * Analiza notas y extrae información de abonos/devoluciones
 * @param {string} texto - Texto de la nota
 * @returns {Object|null} - Información extraída o null si no es una devolución
 */
export function analizarNota(texto) {
  if (!texto || typeof texto !== 'string') return null;
  
  // Normalizar texto
  const textoNormalizado = texto.toUpperCase();
  
  // Palabras clave para devoluciones
  const keywordsDevoluciones = ['DEVOL', 'ABONO', 'RETORNO', 'CAMBIO', 'GARANTÍA', 'DEFECTO', 'AVERÍA', 'ROTURA'];
  
  // Verificar si es una devolución
  let esDevolucion = false;
  for (const keyword of keywordsDevoluciones) {
    if (textoNormalizado.includes(keyword)) {
      esDevolucion = true;
      break;
    }
  }
  
  if (!esDevolucion) return null;
  
  // Extraer información
  const resultado = {
    esDevolucion: true,
    motivo: 'No especificado',
    cantidad: 1,
    importe: 0
  };
  
  // Extraer motivo
  const motivoMatch = texto.match(/motivo:?\s*([^,\.;]+)/i) || 
                      texto.match(/por:?\s*([^,\.;]+)/i) || 
                      texto.match(/debido a:?\s*([^,\.;]+)/i);
  if (motivoMatch && motivoMatch[1]) {
    resultado.motivo = motivoMatch[1].trim();
  } else {
    // Si no hay motivo explícito, usar la primera frase como motivo
    const primeraFrase = texto.split(/[\.;!?]/)[0];
    if (primeraFrase && primeraFrase.length > 5) {
      resultado.motivo = primeraFrase.trim();
    }
  }
  
  // Extraer cantidad
  const cantidadMatch = texto.match(/(\d+)\s*unidades/i) || 
                        texto.match(/cantidad:?\s*(\d+)/i) || 
                        texto.match(/(\d+)\s*uds/i);
  if (cantidadMatch && cantidadMatch[1]) {
    resultado.cantidad = parseInt(cantidadMatch[1], 10);
  }
  
  // Extraer importe
  const importeMatch = texto.match(/(\d+[,\.]\d+)\s*€/i) || 
                       texto.match(/importe:?\s*(\d+[,\.]\d+)/i) || 
                       texto.match(/valor:?\s*(\d+[,\.]\d+)/i);
  if (importeMatch && importeMatch[1]) {
    resultado.importe = parseFloat(importeMatch[1].replace(',', '.'));
  }
  
  return resultado;
}
