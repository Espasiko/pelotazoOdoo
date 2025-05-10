/**
 * Servidor de importación para El Pelotazo
 * Este servidor maneja las solicitudes de importación de datos desde diferentes formatos y proveedores
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { importarDatos } from './importador-new.js';
import { serverConfig } from './config.js';
import { pocketbaseConfig } from './config.js';
import { autenticarAdmin } from './utils.js';

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
    console.log('=== RECIBIDA PETICIÓN DE IMPORTACIÓN ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // Verificar que se ha subido un archivo
    if (!req.file) {
      console.error('No se recibió ningún archivo');
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    
    console.log('Detalles del archivo:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
    
    // Obtener datos del formulario
    const { proveedor, tipo } = req.body;
    
    // Verificar que se ha especificado un proveedor
    if (!proveedor) {
      console.error('No se especificó un proveedor');
      return res.status(400).json({ error: 'Debe especificar un proveedor' });
    }
    
    // Crear un registro en PocketBase para la importación
    try {
      console.log('Creando registro de importación en PocketBase...');
      
      // Obtener token de autenticación
      const token = await autenticarAdmin();
      if (!token) {
        console.error('No se pudo autenticar con PocketBase');
        return res.status(500).json({ error: 'Error de autenticación con PocketBase' });
      }
      
      // Crear FormData para enviar a PocketBase
      const formData = new FormData();
      
      // Leer el archivo y adjuntarlo al FormData
      const fileStream = fs.createReadStream(req.file.path);
      formData.append('archivo', fileStream, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
      
      // Agregar los demás campos requeridos
      formData.append('tipo', tipo || 'productos');
      formData.append('fecha', new Date().toISOString().split('T')[0]); // Formato YYYY-MM-DD
      formData.append('estado', 'pendiente');
      formData.append('proveedor', proveedor);
      formData.append('log', `${new Date().toISOString()}: Importación iniciada\n`);
      
      console.log('Enviando solicitud a PocketBase para crear registro de importación...');
      console.log(`URL: ${pocketbaseConfig.url}/api/collections/importaciones/records`);
      console.log('Campos enviados:', {
        tipo: tipo || 'productos',
        fecha: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        proveedor: proveedor,
        archivo: req.file.originalname
      });
      
      // Enviar solicitud a PocketBase para crear el registro
      const response = await fetch(`${pocketbaseConfig.url}/api/collections/importaciones/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      // Verificar la respuesta
      const responseText = await response.text();
      console.log(`Respuesta de PocketBase: ${response.status} ${response.statusText}`);
      console.log('Contenido de la respuesta:', responseText);
      
      if (!response.ok) {
        console.error(`Error al crear registro en PocketBase: ${response.status} ${response.statusText}\n${responseText}`);
        return res.status(500).json({ error: `Error al crear registro en PocketBase: ${response.status} ${response.statusText}` });
      }
      
      // Parsear la respuesta para obtener el ID
      let importacionData;
      try {
        importacionData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error al parsear la respuesta de PocketBase:', parseError);
        return res.status(500).json({ error: 'Error al parsear la respuesta de PocketBase' });
      }
      
      // Obtener el ID del registro creado
      const importacionId = importacionData.id;
      
      console.log(`Registro de importación creado en PocketBase con ID: ${importacionId}`);
      
      // Guardar la ruta del archivo para usarla más tarde
      const filePath = req.file.path;
      console.log(`Archivo guardado en: ${filePath}`);
      
      // Responder inmediatamente con el ID de la importación
      res.json({ 
        mensaje: 'Importación iniciada correctamente', 
        importacionId,
        id: importacionId, // Agregar también como 'id' para compatibilidad
        archivo: req.file.originalname,
        proveedor,
        tipo: tipo || 'productos',
        estado: 'pendiente'
      });
      
      // Ejecutar la importación en segundo plano
      console.log(`Iniciando importación desde ${filePath} para proveedor ${proveedor} con ID: ${importacionId}`);
      importarDatos(filePath, proveedor, tipo || 'productos', importacionId)
        .then(resultado => {
          console.log(`Importación ${importacionId} completada:`, resultado);
        })
        .catch(error => {
          console.error(`Error en la importación ${importacionId}:`, error);
          // Intentar actualizar el estado de la importación a 'error'
          try {
            import('./db-utils.js').then(({ actualizarImportacion }) => {
              actualizarImportacion(importacionId, 'error', { error: error.message || 'Error desconocido' });
            }).catch(importError => {
              console.error(`Error al importar actualizarImportacion: ${importError}`);
            });
          } catch (updateError) {
            console.error(`Error al actualizar estado de importación ${importacionId}:`, updateError);
          }
        });
    } catch (error) {
      console.error('Error al crear registro de importación:', error);
      return res.status(500).json({ error: `Error al crear registro de importación: ${error.message}` });
    }
    
  } catch (error) {
    console.error('Error en el servidor de importación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciar el servidor
const PORT = serverConfig.port || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de importación escuchando en puerto ${PORT}`);
});
