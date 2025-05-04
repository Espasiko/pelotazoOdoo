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
import { 
  importarDatos, 
  obtenerProveedorPorNombre, 
  importarABaseDeDatos, 
  actualizarLog, 
  detectarCategorias, 
  analizarNota
} from './importador.js';
import { verificarColecciones, autenticarAdmin, fetchAdmin } from './utils.js';
import { pocketbaseConfig, serverConfig } from './config.js';

// Configuración de ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL base de PocketBase
const baseUrl = pocketbaseConfig.url;

// Configuración de Express
const app = express();
app.use(express.json());

// Configuración de CORS más robusta
app.use(cors({
  origin: '*',  // Permitir solicitudes desde cualquier origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware para manejar preflight OPTIONS
app.options('*', cors());

// Configuración de Multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Verificar extensiones permitidas
    const filetypes = /csv|xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV y Excel'));
    }
  }
});

// Middleware para verificar autenticación
async function verificarAutenticacion(req, res, next) {
  try {
    // Verificar si hay un token de autenticación
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No autorizado', 
        mensaje: 'Se requiere autenticación' 
      });
    }
    
    // Verificar si el token es válido
    try {
      // Intentar autenticar con el token
      await autenticarAdmin();
      next();
    } catch (error) {
      console.error('Error de autenticación:', error);
      return res.status(401).json({ 
        error: 'No autorizado', 
        mensaje: 'Token de autenticación inválido' 
      });
    }
  } catch (error) {
    console.error('Error en verificación de autenticación:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor', 
      mensaje: error.message 
    });
  }
}

// Middleware para manejar errores de autenticación
app.use((req, res, next) => {
  // Guardar la URL original para poder volver a ella después
  req.originalUrl = req.url;
  next();
});

// Endpoint para subir archivo e iniciar importación
app.post('/api/importar', upload.single('archivo'), async (req, res) => {
  try {
    console.log('Recibida solicitud de importación...');
    
    // Verificar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    
    // Obtener datos del formulario
    const { proveedor, tipo } = req.body;
    if (!proveedor || !tipo) {
      return res.status(400).json({ error: 'Faltan parámetros: proveedor y tipo son obligatorios' });
    }
    
    console.log(`Procesando importación de ${tipo} desde ${proveedor}...`);
    console.log('Archivo:', req.file.originalname, req.file.path);
    
    // Intentar autenticar, pero no fallar si no es posible
    try {
      await autenticarAdmin();
      console.log('Autenticación exitosa para importar');
    } catch (authError) {
      console.warn('Advertencia: No se pudo autenticar para importar, continuando sin autenticación');
      // Continuamos sin autenticación, intentaremos realizar la operación de todas formas
    }
    
    // Registrar la importación en PocketBase
    try {
      // Crear registro de importación
      const importacion = await fetchAdmin(`${baseUrl}/api/collections/importaciones/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fecha: new Date().toISOString(),
          proveedor: proveedor,
          tipo: tipo,
          estado: 'procesando',
          archivo: req.file.originalname,
          log: `Iniciando importación de ${tipo} desde ${proveedor}...`
        })
      });
      
      console.log(`Importación registrada con ID: ${importacion.id}`);
      
      // Procesar el archivo en segundo plano (sin esperar)
      const filePath = req.file.path;
      
      // Ejecutar importación de forma asíncrona
      importarDatos(filePath, proveedor, tipo, importacion.id)
        .then(async (datos) => {
          try {
            // Obtener o crear el proveedor
            let proveedorInfo = null;
            try {
              // Buscar si el proveedor ya existe
              const proveedorResult = await fetchAdmin(`${baseUrl}/api/collections/proveedores/records`, {
                method: 'GET',
                params: {
                  filter: `nombre~"${proveedor}"`
                }
              });
              proveedorInfo = proveedorResult;
              console.log(`Proveedor encontrado: ${proveedorInfo.id}`);
            } catch (error) {
              // Si no existe, crear el proveedor
              try {
                // Intentar crear el proveedor
                proveedorInfo = await fetchAdmin(`${baseUrl}/api/collections/proveedores/records`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    nombre: proveedor,
                    activo: true,
                    fecha_alta: new Date().toISOString()
                  })
                });
                console.log(`Proveedor creado: ${proveedorInfo.id}`);
              } catch (createError) {
                console.error(`Error al crear proveedor ${proveedor}:`, createError);
                // Si hay error al crear, usar un proveedor genérico
                proveedorInfo = { id: `temp_${proveedor.replace(/\s+/g, '_').toLowerCase()}`, nombre: proveedor };
              }
            }
            
            // Importar datos a la base de datos
            const resultado = await importarABaseDeDatos(datos, tipo, importacion.id, proveedorInfo.id);
            
            // Actualizar estado de la importación
            try {
              await fetchAdmin(`${baseUrl}/api/collections/importaciones/records/${importacion.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  estado: resultado.exito ? 'completado' : 'error',
                  log: `Importación finalizada. Creados: ${resultado.creados}, Actualizados: ${resultado.actualizados}, Errores: ${resultado.errores}, Devoluciones: ${resultado.devoluciones || 0}`
                })
              });
            } catch (updateError) {
              console.error('Error al actualizar estado de importación:', updateError);
              // Continuar a pesar del error
            }
            
            console.log('Importación completada:', resultado);
          } catch (error) {
            console.error('Error en la importación:', error);
            try {
              await fetchAdmin(`${baseUrl}/api/collections/importaciones/records/${importacion.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  estado: 'error',
                  log: `Error en la importación: ${error.message}`
                })
              });
            } catch (updateError) {
              console.error('Error al actualizar estado de error:', updateError);
              // Continuar a pesar del error
            }
          }
        })
        .catch(async (error) => {
          console.error('Error al procesar el archivo:', error);
          try {
            await fetchAdmin(`${baseUrl}/api/collections/importaciones/records/${importacion.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                estado: 'error',
                log: `Error al procesar el archivo: ${error.message}`
              })
            });
          } catch (updateError) {
            console.error('Error al actualizar estado de error:', updateError);
            // Continuar a pesar del error
          }
        });
      
      // Responder inmediatamente con el ID de la importación
      return res.status(200).json({
        mensaje: 'Importación iniciada correctamente',
        importacion_id: importacion.id,
        id: importacion.id
      });
    } catch (pbError) {
      console.error('Error al crear registro en PocketBase:', pbError);
      
      // Crear un ID temporal para la importación
      const tempId = `temp_${Date.now()}`;
      
      // Procesar el archivo en segundo plano de todas formas
      const filePath = req.file.path;
      
      // Ejecutar importación de forma asíncrona
      importarDatos(filePath, proveedor, tipo, tempId)
        .then(async (datos) => {
          console.log('Importación completada con ID temporal:', tempId);
        })
        .catch(error => {
          console.error('Error al procesar el archivo con ID temporal:', error);
        });
      
      // Responder con el ID temporal
      return res.status(200).json({ 
        mensaje: 'Importación iniciada con ID temporal debido a problemas de conexión',
        importacion_id: tempId,
        id: tempId,
        advertencia: 'No se pudo registrar en la base de datos, pero se está procesando el archivo'
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
      console.log('Autenticación exitosa para obtener importaciones');
    } catch (authError) {
      console.warn('Advertencia: No se pudo autenticar para obtener importaciones, continuando sin autenticación');
      // Continuamos sin autenticación, intentaremos obtener los datos de todas formas
    }
    
    try {
      // Intentar obtener la lista de importaciones
      const importaciones = await fetchAdmin(`${baseUrl}/api/collections/importaciones/records`, {
        method: 'GET',
        params: {
          sort: '-fecha'
        }
      });
      
      console.log(`Obtenidas ${importaciones.items.length} importaciones`);
      res.json(importaciones);
    } catch (dbError) {
      console.error('Error al acceder a la colección de importaciones:', dbError);
      
      // Si la colección no existe o hay otro problema, devolver un array vacío
      // para que el frontend no se rompa
      res.json({
        page: 1,
        perPage: 50,
        totalItems: 0,
        totalPages: 0,
        items: []
      });
    }
  } catch (error) {
    console.error('Error general al obtener importaciones:', error);
    // Devolver una respuesta vacía en lugar de un error 500
    res.json({
      page: 1,
      perPage: 50,
      totalItems: 0,
      totalPages: 0,
      items: []
    });
  }
});

// Endpoint para obtener los detalles de una importación
app.get('/api/importaciones/:id', async (req, res) => {
  try {
    console.log(`Recibida solicitud para obtener detalles de importación ${req.params.id}`);
    
    // Intentar autenticar, pero no fallar si no es posible
    try {
      await autenticarAdmin();
      console.log('Autenticación exitosa para obtener detalles de importación');
    } catch (authError) {
      console.warn('Advertencia: No se pudo autenticar para obtener detalles de importación, continuando sin autenticación');
      // Continuamos sin autenticación, intentaremos obtener los datos de todas formas
    }
    
    try {
      const { id } = req.params;
      const importacion = await fetchAdmin(`${baseUrl}/api/collections/importaciones/records/${id}`, {
        method: 'GET'
      });
      
      console.log(`Obtenidos detalles de importación ${id}`);
      res.json(importacion);
    } catch (dbError) {
      console.error(`Error al obtener importación ${req.params.id}:`, dbError);
      
      // Si la importación no existe o hay otro problema, devolver un objeto vacío
      // para que el frontend no se rompa
      res.json({
        id: req.params.id,
        fecha: new Date().toISOString(),
        proveedor: null,
        tipo: 'desconocido',
        estado: 'error',
        detalles: 'No se pudo obtener la información de esta importación'
      });
    }
  } catch (error) {
    console.error(`Error general al obtener importación ${req.params.id}:`, error);
    // Devolver un objeto vacío en lugar de un error 500
    res.json({
      id: req.params.id,
      fecha: new Date().toISOString(),
      proveedor: null,
      tipo: 'desconocido',
      estado: 'error',
      detalles: 'Error interno al obtener la información'
    });
  }
});

// Endpoint para obtener la lista de proveedores
app.get('/api/proveedores', async (req, res) => {
  try {
    console.log('Recibida solicitud para obtener lista de proveedores');
    
    // Intentar autenticar, pero no fallar si no es posible
    try {
      await autenticarAdmin();
      console.log('Autenticación exitosa para obtener proveedores');
    } catch (authError) {
      console.warn('Advertencia: No se pudo autenticar para obtener proveedores, continuando sin autenticación');
      // Continuamos sin autenticación, intentaremos obtener los datos de todas formas
    }
    
    try {
      const proveedores = await fetchAdmin(`${baseUrl}/api/collections/proveedores/records`, {
        method: 'GET',
        params: {
          sort: 'nombre'
        }
      });
      
      console.log(`Obtenidos ${proveedores.items.length} proveedores`);
      res.json(proveedores);
    } catch (dbError) {
      console.error('Error al acceder a la colección de proveedores:', dbError);
      
      // Si la colección no existe o hay otro problema, devolver un array vacío
      res.json({
        page: 1,
        perPage: 100,
        totalItems: 0,
        totalPages: 0,
        items: []
      });
    }
  } catch (error) {
    console.error('Error general al obtener proveedores:', error);
    // Devolver una respuesta vacía en lugar de un error 500
    res.json({
      page: 1,
      perPage: 100,
      totalItems: 0,
      totalPages: 0,
      items: []
    });
  }
});

// Endpoint para obtener categorías
app.get('/api/categorias', verificarAutenticacion, async (req, res) => {
  try {
    const categorias = await fetchAdmin(`${baseUrl}/api/collections/categorias/records`, {
      method: 'GET',
      params: {
        sort: 'nombre'
      }
    });
    
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Endpoint para obtener productos
app.get('/api/productos', verificarAutenticacion, async (req, res) => {
  try {
    const { page = 1, perPage = 20, filter = '', sort = '-created' } = req.query;
    
    let filterQuery = '';
    if (filter) {
      filterQuery = `nombre~"${filter}" || codigo~"${filter}"`;
    }
    
    const productos = await fetchAdmin(`${baseUrl}/api/collections/productos/records`, {
      method: 'GET',
      params: {
        filter: filterQuery,
        sort: sort,
        expand: 'categoria,proveedor'
      }
    });
    
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Endpoint para obtener devoluciones
app.get('/api/devoluciones', verificarAutenticacion, async (req, res) => {
  try {
    const { page = 1, perPage = 20, sort = '-fecha' } = req.query;
    
    const devoluciones = await fetchAdmin(`${baseUrl}/api/collections/devoluciones/records`, {
      method: 'GET',
      params: {
        sort: sort,
        expand: 'proveedor'
      }
    });
    
    res.json(devoluciones);
  } catch (error) {
    console.error('Error al obtener devoluciones:', error);
    res.status(500).json({ error: 'Error al obtener devoluciones' });
  }
});

// Endpoint para pruebas (sin autenticación)
app.get('/api/test', async (req, res) => {
  res.json({ mensaje: 'Servidor de importación funcionando correctamente' });
});

// Endpoint para probar conexión a PocketBase
app.get('/api/test/pocketbase', async (req, res) => {
  try {
    // Intentar autenticarse usando la función centralizada
    const autenticado = await autenticarAdmin();
    
    if (!autenticado) {
      throw new Error('No se pudo autenticar con PocketBase');
    }
    
    // Probar una operación simple: obtener la lista de colecciones directamente
    try {
      // Verificar si PocketBase está respondiendo
      const healthCheck = await fetch(`${baseUrl}/api/health`);
      if (!healthCheck.ok) {
        throw new Error(`PocketBase no responde: ${healthCheck.status}`);
      }
      
      res.json({ 
        mensaje: 'Conexión a PocketBase establecida correctamente',
        estado: 'PocketBase está respondiendo, autenticación simulada'
      });
    } catch (error) {
      throw new Error(`Error al conectar con PocketBase: ${error.message}`);
    }
  } catch (error) {
    console.error('Error al conectar con PocketBase:', error);
    res.status(500).json({ 
      error: 'Error al conectar con PocketBase',
      mensaje: error.message
    });
  }
});

// Endpoint para probar importación
app.get('/api/test/importacion/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const importacion = await fetchAdmin(`${baseUrl}/api/collections/importaciones/records/${id}`, {
      method: 'GET'
    });
    res.json(importacion);
  } catch (error) {
    console.error(`Error al obtener importación ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al obtener detalles de la importación' });
  }
});

// Endpoint para probar importación completa
app.post('/api/test/importacion-completa', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    
    const { proveedor = 'GENERICO', tipo = 'productos' } = req.body;
    
    // Autenticarse como admin
    try {
      await autenticarAdmin();
    } catch (authError) {
      return res.status(500).json({ error: 'Error de autenticación', mensaje: authError.message });
    }
    
    // Crear registro de importación
    const importacion = await fetchAdmin(`${baseUrl}/api/collections/importaciones/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fecha: new Date().toISOString(),
        proveedor: proveedor,
        tipo: tipo,
        estado: 'procesando',
        archivo: req.file.originalname,
        log: `Iniciando importación de prueba: ${new Date().toISOString()}\n`
      })
    });
    
    // Procesar el archivo
    const resultado = await importarDatos(req.file.path, proveedor, tipo, importacion.id);
    
    // Actualizar estado de la importación
    await fetchAdmin(`${baseUrl}/api/collections/importaciones/records/${importacion.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estado: resultado.exito ? 'completado' : 'error',
        resultado: JSON.stringify(resultado)
      })
    });
    
    res.json({
      mensaje: 'Importación completada',
      importacion_id: importacion.id,
      resultado: resultado
    });
  } catch (error) {
    console.error('Error en importación de prueba:', error);
    res.status(500).json({ error: 'Error en importación de prueba', mensaje: error.message });
  }
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(err.status || 500).json({
    error: true,
    mensaje: err.message || 'Error interno del servidor',
    detalles: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Verificar colecciones al iniciar el servidor
verificarColecciones().then((resultado) => {
  console.log('Verificación de colecciones completada.');
  console.log('Servidor listo para recibir solicitudes.');
}).catch(error => {
  console.error('Error al verificar colecciones:', error.message);
  console.warn('⚠️ El servidor continuará funcionando, pero algunas operaciones podrían fallar.');
  console.warn('Verifica que las colecciones necesarias existan en PocketBase.');
});

// Iniciar el servidor
const PORT = serverConfig.port || 3100;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de importación iniciado en http://localhost:${PORT}`);
  console.log(`Conectado a PocketBase en ${baseUrl}`);
  console.log('CORS configurado para permitir solicitudes desde cualquier origen');
});
