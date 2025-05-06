/**
 * Servidor para manejar las solicitudes de importación
 * Versión refactorizada y optimizada
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Importar módulos refactorizados
import { importarDatos } from './importador-new.js';
import { obtenerProveedorPorNombre } from './db-utils.js';
import { actualizarLog } from './db-utils.js';
import { analizarNota } from './categorias.js';
import { verificarColecciones, autenticarAdmin, fetchAdmin } from './utils.js';
import { pocketbaseConfig, serverConfig } from './config.js';

// Configuración de ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;

// Crear aplicación Express
const app = express();
const PORT = serverConfig.port || 3100;

// Configurar middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar almacenamiento para archivos subidos
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtro para archivos permitidos
const fileFilter = (req, file, cb) => {
  // Verificar extensión del archivo
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv' || ext === '.xlsx' || ext === '.xls' || ext === '.json') {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no soportado. Solo se permiten archivos CSV, Excel y JSON.'), false);
  }
};

// Configurar multer
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

// Middleware para verificar autenticación
async function verificarAutenticacion(req, res, next) {
  // Obtener token de autorización
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'No autorizado',
      mensaje: 'Se requiere token de autenticación'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar token con PocketBase
    const authCheck = await fetch(`${baseUrl}/api/admins/auth-refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!authCheck.ok) {
      throw new Error('Token inválido o expirado');
    }
    
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(401).json({ 
      error: 'No autorizado',
      mensaje: 'Token inválido o expirado'
    });
  }
}

// Middleware para manejar errores de autenticación
app.use((req, res, next) => {
  // Guardar la URL original para poder volver a ella después
  req.originalUrl = req.url;
  next();
});

// Endpoint para importar archivos
app.post('/api/importar', upload.single('archivo'), async (req, res) => {
  try {
    console.log('Recibida solicitud de importación...');
    
    // Verificar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Archivo requerido',
        mensaje: 'No se ha subido ningún archivo'
      });
    }
    
    // Obtener datos del formulario
    const { proveedor, tipo } = req.body;
    
    if (!proveedor || !tipo) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        mensaje: 'Se requiere proveedor y tipo de importación'
      });
    }
    
    console.log(`Importando archivo ${req.file.originalname} de ${proveedor} (${tipo})`);
    
    // Ruta completa al archivo
    const filePath = req.file.path;
    
    try {
      // Primero necesitamos subir el archivo a PocketBase
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(req.file.path);
      formData.append('archivo', fileBuffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
      formData.append('fecha', new Date().toISOString());
      formData.append('tipo', tipo);
      formData.append('proveedor', proveedor);
      formData.append('estado', 'procesando');
      formData.append('log', `Iniciando importación: ${new Date().toISOString()}\n`);
      
      // Autenticar como admin
      await autenticarAdmin();
      
      // Crear registro de importación en PocketBase
      const importacionRes = await fetch(`${baseUrl}/api/collections/importaciones/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await autenticarAdmin()}`
        },
        body: formData
      });
      
      if (!importacionRes.ok) {
        throw new Error(`Error al crear registro de importación: ${importacionRes.statusText}`);
      }
      
      const importacion = await importacionRes.json();
      console.log(`Importación creada con ID: ${importacion.id}`);
      
      // Iniciar proceso de importación en segundo plano
      importarDatos(filePath, proveedor, tipo, importacion.id)
        .then(async (datos) => {
          try {
            // Obtener o crear el proveedor
            let proveedorInfo = null;
            try {
              proveedorInfo = await obtenerProveedorPorNombre(proveedor);
            } catch (error) {
              console.error('Error al obtener información del proveedor:', error);
            }
            
            console.log('Importación completada con éxito');
            console.log(`Resultados: ${JSON.stringify(datos)}`);
            
            // Actualizar log
            await actualizarLog(importacion.id, `Importación completada: ${JSON.stringify(datos)}`);
          } catch (error) {
            console.error('Error al finalizar importación:', error);
            await actualizarLog(importacion.id, `Error al finalizar importación: ${error.message}`);
          }
        })
        .catch(async (error) => {
          console.error('Error en proceso de importación:', error);
          
          try {
            // Actualizar estado de importación
            await fetchAdmin(`${baseUrl}/api/collections/importaciones/records/${importacion.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                estado: 'error',
                resultado: JSON.stringify({ error: error.message }),
                fecha_fin: new Date().toISOString()
              })
            });
            
            // Actualizar log
            await actualizarLog(importacion.id, `Error en importación: ${error.message}`);
          } catch (updateError) {
            console.error('Error al actualizar estado de importación:', updateError);
          }
        });
      
      // Responder al cliente
      res.status(200).json({
        mensaje: 'Importación iniciada correctamente',
        importacion: {
          id: importacion.id,
          fecha: importacion.fecha,
          tipo: importacion.tipo,
          proveedor: importacion.proveedor,
          estado: importacion.estado
        }
      });
    } catch (pbError) {
      console.error('Error al crear registro en PocketBase:', pbError);
      
      // Crear un ID temporal para la importación
      const tempId = `temp_${Date.now()}`;
      
      // Iniciar proceso de importación en segundo plano
      importarDatos(filePath, proveedor, tipo, tempId)
        .then((datos) => {
          console.log(`Importación completada con ID temporal: ${tempId}`);
          console.log(`Resultados: ${JSON.stringify(datos)}`);
        })
        .catch((error) => {
          console.error(`Error en importación con ID temporal ${tempId}:`, error);
        });
      
      // Responder al cliente
      res.status(200).json({
        mensaje: 'Importación iniciada correctamente (modo local)',
        advertencia: 'No se pudo crear registro en PocketBase, se usará almacenamiento temporal',
        importacion: {
          id: tempId,
          fecha: new Date().toISOString(),
          tipo: tipo,
          proveedor: proveedor,
          estado: 'procesando'
        }
      });
    }
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      mensaje: error.message
    });
  }
});

// Endpoint para obtener el historial de importaciones
app.get('/api/importaciones', async (req, res) => {
  try {
    console.log('Recibida solicitud para obtener historial de importaciones');
    
    // Intentar autenticar, pero no fallar si no es posible
    try {
      await autenticarAdmin();
    } catch (error) {
      console.warn('No se pudo autenticar para obtener historial:', error);
    }
    
    // Obtener parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    
    // Obtener historial de importaciones
    const importacionesRes = await fetchAdmin(`${baseUrl}/api/collections/importaciones/records`, {
      method: 'GET',
      params: {
        sort: '-fecha',
        page: page,
        perPage: perPage
      }
    });
    
    // Responder al cliente
    res.status(200).json(importacionesRes);
  } catch (error) {
    console.error('Error al obtener historial de importaciones:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      mensaje: error.message
    });
  }
});

// Endpoint para obtener detalles de una importación
app.get('/api/importaciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Recibida solicitud para obtener detalles de importación ${id}`);
    
    // Intentar autenticar, pero no fallar si no es posible
    try {
      await autenticarAdmin();
    } catch (error) {
      console.warn('No se pudo autenticar para obtener detalles:', error);
    }
    
    // Obtener detalles de la importación
    const importacionRes = await fetchAdmin(`${baseUrl}/api/collections/importaciones/records/${id}`, {
      method: 'GET'
    });
    
    // Responder al cliente
    res.status(200).json(importacionRes);
  } catch (error) {
    console.error(`Error al obtener detalles de importación ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      mensaje: error.message
    });
  }
});

// Endpoint para obtener lista de proveedores
app.get('/api/proveedores', async (req, res) => {
  try {
    console.log('Recibida solicitud para obtener lista de proveedores');
    
    // Intentar autenticar, pero no fallar si no es posible
    try {
      await autenticarAdmin();
    } catch (error) {
      console.warn('No se pudo autenticar para obtener proveedores:', error);
    }
    
    // Obtener lista de proveedores
    const proveedoresRes = await fetchAdmin(`${baseUrl}/api/collections/proveedores/records`, {
      method: 'GET',
      params: {
        sort: 'nombre',
        filter: 'activo=true'
      }
    });
    
    // Responder al cliente
    res.status(200).json(proveedoresRes);
  } catch (error) {
    console.error('Error al obtener lista de proveedores:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      mensaje: error.message
    });
  }
});

// Endpoint para verificar estado del servidor
app.get('/api/status', async (req, res) => {
  try {
    console.log('Verificando estado del servidor...');
    
    // Verificar conexión con PocketBase
    let pocketbaseStatus = 'error';
    let authStatus = 'error';
    
    try {
      const pbRes = await fetch(`${baseUrl}/api/health`, {
        method: 'GET'
      });
      
      if (pbRes.ok) {
        pocketbaseStatus = 'ok';
        
        // Verificar autenticación
        try {
          await autenticarAdmin();
          authStatus = 'ok';
        } catch (authError) {
          console.warn('Error de autenticación:', authError);
        }
      }
    } catch (pbError) {
      console.error('Error al conectar con PocketBase:', pbError);
    }
    
    // Verificar colecciones necesarias
    let coleccionesStatus = 'error';
    try {
      const coleccionesOk = await verificarColecciones();
      coleccionesStatus = coleccionesOk ? 'ok' : 'error';
    } catch (colError) {
      console.error('Error al verificar colecciones:', colError);
    }
    
    // Responder al cliente
    res.status(200).json({
      servidor: 'ok',
      pocketbase: pocketbaseStatus,
      autenticacion: authStatus,
      colecciones: coleccionesStatus,
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al verificar estado del servidor:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      mensaje: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de importación iniciado en puerto ${PORT}`);
  console.log(`URL de PocketBase: ${baseUrl}`);
  
  // Verificar conexión con PocketBase
  fetch(`${baseUrl}/api/health`)
    .then(response => {
      if (response.ok) {
        console.log('Conexión con PocketBase establecida correctamente');
        
        // Verificar colecciones necesarias
        verificarColecciones()
          .then(ok => {
            if (ok) {
              console.log('Colecciones verificadas correctamente');
            } else {
              console.warn('Algunas colecciones no existen o no tienen la estructura correcta');
            }
          })
          .catch(error => {
            console.error('Error al verificar colecciones:', error);
          });
      } else {
        console.error('Error al conectar con PocketBase:', response.statusText);
      }
    })
    .catch(error => {
      console.error('Error al conectar con PocketBase:', error);
    });
});
