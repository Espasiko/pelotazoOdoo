/**
 * Rutas para gestionar el historial de importaciones
 */

import express from 'express';
import PocketBase from 'pocketbase';
import { pocketbaseConfig } from '../../importacion/config.js';

const router = express.Router();
const pb = new PocketBase(pocketbaseConfig.url);

// Middleware para verificar autenticación
async function verificarAutenticacion(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado: Token no proporcionado' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar si el token es válido
    pb.authStore.save(token);
    
    if (!pb.authStore.isValid) {
      return res.status(401).json({ error: 'No autorizado: Token inválido' });
    }
    
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    return res.status(401).json({ error: 'Error de autenticación' });
  }
}

// Ruta para obtener el historial de importaciones
router.get('/', verificarAutenticacion, async (req, res) => {
  try {
    console.log('Obteniendo historial de importaciones...');
    
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 50;
    
    // Obtener las importaciones ordenadas por fecha (más recientes primero)
    try {
      const importaciones = await pb.collection('importaciones').getList(page, perPage, {
        sort: '-created',
        expand: 'proveedor'
      });
      
      console.log(`Se encontraron ${importaciones.items.length} importaciones`);
      return res.status(200).json(importaciones);
    } catch (pbError) {
      console.error('Error al obtener importaciones de PocketBase:', pbError);
      
      // Si no hay colección de importaciones, devolver una lista vacía
      if (pbError.status === 404) {
        return res.status(200).json({
          page: page,
          perPage: perPage,
          totalItems: 0,
          totalPages: 0,
          items: []
        });
      }
      
      return res.status(500).json({
        error: 'Error al obtener las importaciones',
        detalles: pbError.message
      });
    }
  } catch (error) {
    console.error('Error al obtener importaciones:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener una importación específica
router.get('/:id', verificarAutenticacion, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID de importación no proporcionado' });
    }
    
    console.log(`Obteniendo detalles de la importación ${id}...`);
    
    try {
      const importacion = await pb.collection('importaciones').getOne(id, {
        expand: 'proveedor'
      });
      
      return res.status(200).json(importacion);
    } catch (pbError) {
      console.error('Error al obtener importación de PocketBase:', pbError);
      
      // Si no existe la importación, devolver un error 404
      if (pbError.status === 404) {
        return res.status(404).json({
          error: 'Importación no encontrada',
          detalles: `No se encontró ninguna importación con ID ${id}`
        });
      }
      
      return res.status(500).json({
        error: 'Error al obtener la importación',
        detalles: pbError.message
      });
    }
  } catch (error) {
    console.error('Error al obtener importación:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;