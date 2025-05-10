import express from 'express';
import path from 'path';
import multer from 'multer';
import { fetchAdmin } from '../../utils/auth.js';
// Importar lectores y parsers según nueva estructura modular
// (ajustar rutas si es necesario)
import { leerArchivoCSV, leerArchivoExcel, leerArchivoJSONNormalizado } from '../../importacion/file-readers.js';
import { parserGenericoUniversal, parseCecotec, parseBSH, parseJata, parseOrbegozo, parseAlfadyser, parseVitrokitchen, parseElectrodirecto, parseAlmacenes, parseEasJohnson } from '../../importacion/parsers.js';
import { actualizarLog } from '../../importacion/db-utils.js';
import { logInfo, logError } from '../../utils/logger.js';

const router = express.Router();

// Configuración de multer para archivos temporales
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Preservar el nombre original del archivo y su extensión
    const originalName = file.originalname;
    cb(null, originalName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log('Verificando archivo:', file.originalname, file.mimetype);
    console.log('Headers completos:', req.headers);
    
    // Imprimir información detallada del archivo
    console.log('Detalles completos del archivo:', file);
    
    // Verificar extensión del archivo
    const ext = path.extname(file.originalname).toLowerCase();
    console.log('Extensión detectada:', ext);
    
    // BYPASS TEMPORAL: Aceptar cualquier archivo para depuración
    console.log('BYPASS: Aceptando cualquier archivo para depuración');
    cb(null, true);
    
    /* Comentado temporalmente para depuración
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls' || ext === '.json') {
      cb(null, true);
    } else {
      console.error(`Extensión no permitida: ${ext}`);
      cb(new Error(`Tipo de archivo no soportado: ${ext}`), false);
    }
    */
  }
});

// --- LOG DETALLADO ANTES DE CADA ENVÍO DE PRODUCTO ---
function logProductoEnvio(accion, body) {
  console.log(`\n[${accion}] Enviando producto a PocketBase:`);
  try {
    console.log(JSON.stringify(body, null, 2));
  } catch(e) {
    console.log(body);
  }
}

// Procesar archivo según el proveedor
async function procesarArchivo(datos, proveedor) {
  // Aquí puedes usar lógica de selección de parser según proveedor
  // Ejemplo:
  switch ((proveedor || '').toUpperCase()) {
    case 'CECOTEC': return parserGenericoUniversal(datos, 'CECOTEC');
    case 'BSH': return parseBSH(datos);
    case 'JATA': return parseJata(datos);
    case 'ORBEGOZO': return parseOrbegozo(datos);
    case 'ALFADYSER': return parseAlfadyser(datos);
    case 'VITROKITCHEN': return parseVitrokitchen(datos);
    case 'ELECTRODIRECTO': return parseElectrodirecto(datos);
    case 'ALMCE':
    case 'ALMACENES': return parseAlmacenes(datos);
    case 'EAS-JOHNSON': return parseEasJohnson(datos);
    default: return parserGenericoUniversal(datos, proveedor);
  }
}

// Middleware para manejar errores de multer
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Error de Multer:', err.message);
    return res.status(400).json({ exito: false, error: `Error al subir el archivo: ${err.message}` });
  } else if (err) {
    console.error('Error en middleware de upload:', err.message);
    return res.status(400).json({ exito: false, error: err.message });
  }
  next();
};

// Endpoint principal de importación
router.post('/', upload.single('file'), handleMulterErrors, async (req, res) => {
  try {
    console.log('=== RECIBIDA PETICIÓN DE IMPORTACIÓN ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Files:', req.file ? 'Archivo recibido' : 'No se recibió archivo');
    
    if (req.file) {
      console.log('Detalles del archivo:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
    }
    
    // Verificar parámetros obligatorios
    if (!req.file) {
      console.error('No se recibió ningún archivo');
      return res.status(400).json({ exito: false, error: 'No se recibió ningún archivo' });
    }
    
    const filePath = req.file.path;
    const proveedor = req.body.proveedor;
    const tipo = req.body.tipo || 'productos';
    const importacionId = req.body.importacionId;
    
    console.log(`Iniciando importación desde ${req.file.originalname} (${filePath}) para proveedor ${proveedor}`);
    
    // Determinar el tipo de archivo basado en la extensión del nombre original
    let fileType = path.extname(req.file.originalname).slice(1).toLowerCase();
    console.log(`Tipo de archivo detectado por extensión: ${fileType}`);
    
    // Si no se pudo determinar la extensión, intentar por el mimetype
    if (!fileType) {
      console.log('No se pudo determinar la extensión por el nombre, intentando por mimetype:', req.file.mimetype);
      if (req.file.mimetype.includes('csv')) {
        fileType = 'csv';
      } else if (req.file.mimetype.includes('excel') || req.file.mimetype.includes('spreadsheetml')) {
        fileType = 'xlsx';
      } else if (req.file.mimetype.includes('json')) {
        fileType = 'json';
      }
      console.log(`Tipo de archivo determinado por mimetype: ${fileType}`);
    }
    
    // Si todavía no se pudo determinar, intentar por el nombre original completo
    if (!fileType) {
      const filename = req.file.originalname.toLowerCase();
      if (filename.includes('.csv')) {
        fileType = 'csv';
      } else if (filename.includes('.xlsx') || filename.includes('.xls')) {
        fileType = filename.includes('.xlsx') ? 'xlsx' : 'xls';
      } else if (filename.includes('.json')) {
        fileType = 'json';
      }
      console.log(`Tipo de archivo determinado por nombre completo: ${fileType}`);
    }
    
    console.log(`Tipo de archivo final: ${fileType}`);
    
    // Si no se pudo determinar el tipo, devolver error
    if (!fileType) {
      console.error('No se pudo determinar el tipo de archivo');
      return res.status(400).json({ 
        exito: false, 
        error: 'No se pudo determinar el tipo de archivo' 
      });
    }
    
    // Leer archivo según su tipo
    let datos;
    try {
      if (fileType === 'csv') {
        datos = await leerArchivoCSV(filePath);
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        datos = await leerArchivoExcel(filePath);
      } else if (fileType === 'json') {
        datos = await leerArchivoJSONNormalizado(filePath);
      } else {
        console.error(`Tipo de archivo no soportado: ${fileType}`);
        return res.status(400).json({ 
          exito: false, 
          error: `Tipo de archivo no soportado: ${fileType}` 
        });
      }
    } catch (error) {
      console.error(`Error al leer el archivo: ${error.message}`);
      return res.status(400).json({ 
        exito: false, 
        error: `Error al leer el archivo: ${error.message}` 
      });
    }
    console.log(`Leídos ${datos.length} registros del archivo`);
    
    // Actualizar log si hay ID de importación
    if (importacionId) {
      await actualizarLog(importacionId, `Leídos ${datos.length} registros del archivo`);
    }
    
    // Procesar datos según el proveedor
    const resultado = await procesarArchivo(datos, proveedor);
    console.log(`Procesados ${resultado.productos?.length || resultado.length} registros`);
    
    // Actualizar log si hay ID de importación
    if (importacionId) {
      await actualizarLog(importacionId, `Procesados ${resultado.productos?.length || resultado.length} registros`);
    }
    
    // Extraer los productos procesados
    const { productos } = resultado;
    
    // Validar que haya productos a importar
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      console.error('No hay productos a importar tras el procesamiento');
      return res.status(400).json({ 
        exito: false, 
        error: 'No hay productos a importar tras el procesamiento.' 
      });
    }
    
    // Importar a la base de datos usando el servicio
    const { importarABaseDeDatos } = await import('../../services/importacion.js');
    const importacionRes = await importarABaseDeDatos(productos, proveedor, importacionId);
    
    // Devolver respuesta con los resultados
    return res.status(200).json({ 
      exito: importacionRes.exito, 
      stats: importacionRes.stats,
      importacion: {
        id: importacionId || ('import-' + Date.now()),
        proveedor: proveedor,
        tipo: tipo,
        estado: 'completado',
        fecha: new Date().toISOString(),
        stats: importacionRes.stats
      }
    });
  } catch (err) {
    console.error('[IMPORTACION] Error:', err);
    res.status(500).json({ exito: false, error: err.message });
  }
});

export default router;
