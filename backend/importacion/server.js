/**
 * Servidor de importación para El Pelotazo
 * Este servidor maneja las solicitudes de importación de datos desde diferentes formatos y proveedores
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { importarDatos } from './core/index.js';
import { serverConfig } from './config.js';

// Configuración de ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear aplicación Express
const app = express();

// Configurar CORS para permitir solicitudes desde el frontend
app.use(cors());

// Configurar middleware para parsear JSON
app.use(express.json());

// Configurar multer para la subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'archivo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Ruta para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({ mensaje: 'Servidor de importación funcionando correctamente' });
});

// Ruta para subir archivo e iniciar importación
app.post('/importar', upload.single('archivo'), async (req, res) => {
  try {
    // Verificar que se ha subido un archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    
    // Obtener datos del formulario
    const { proveedor, tipo } = req.body;
    
    // Verificar que se ha especificado un proveedor
    if (!proveedor) {
      return res.status(400).json({ error: 'Debe especificar un proveedor' });
    }
    
    // Registrar la importación en la base de datos
    const importacionId = Date.now().toString(); // Simulamos un ID único
    
    // Iniciar la importación en segundo plano
    const filePath = req.file.path;
    console.log(`Iniciando importación desde ${filePath} para proveedor ${proveedor}`);
    
    // Responder inmediatamente con el ID de la importación
    res.json({ 
      mensaje: 'Importación iniciada correctamente', 
      importacionId,
      archivo: req.file.originalname,
      proveedor,
      tipo: tipo || 'productos'
    });
    
    // Ejecutar la importación en segundo plano
    importarDatos(filePath, proveedor, tipo || 'productos', importacionId)
      .then(resultado => {
        console.log('Importación completada:', resultado);
      })
      .catch(error => {
        console.error('Error en la importación:', error);
      });
    
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener el estado de una importación
app.get('/importacion/:id', (req, res) => {
  const { id } = req.params;
  
  // Aquí se debería consultar el estado real de la importación en la base de datos
  // Por ahora, devolvemos un estado simulado
  res.json({
    id,
    estado: 'en_proceso',
    progreso: Math.floor(Math.random() * 100),
    mensaje: 'Importación en proceso'
  });
});

// Ruta para obtener el historial de importaciones
app.get('/historial', (req, res) => {
  // Aquí se debería consultar el historial real de importaciones en la base de datos
  // Por ahora, devolvemos un historial simulado
  res.json({
    items: [
      {
        id: '1',
        fecha: new Date().toISOString(),
        archivo: 'ejemplo.csv',
        proveedor: 'CECOTEC',
        estado: 'completado',
        resultados: {
          total: 100,
          creados: 80,
          actualizados: 20,
          errores: 0
        }
      }
    ]
  });
});

// Iniciar el servidor
const PORT = 3200; // Puerto específico para evitar conflictos
app.listen(PORT, () => {
  console.log(`Servidor de importación ejecutándose en http://localhost:${PORT}`);
});