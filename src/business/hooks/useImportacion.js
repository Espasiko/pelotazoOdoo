/**
 * Hook personalizado para la lógica de importación
 * Capa de negocio: Maneja la lógica entre la UI y los servicios de datos
 */

import { useState, useEffect } from 'react';
import { 
  subirArchivoImportacion, 
  obtenerHistorialImportaciones,
  obtenerEstadoImportacion 
} from '../../data/services/importacionService';

export const useImportacion = () => {
  const [file, setFile] = useState(null);
  const [proveedor, setProveedor] = useState('');
  const [tipo, setTipo] = useState('');
  const [importacionActual, setImportacionActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  // Lista de proveedores disponibles
  const proveedores = [
    { id: 'CECOTEC', nombre: 'CECOTEC' },
    { id: 'BSH', nombre: 'BSH (Bosch, Siemens, Balay)' },
    { id: 'JATA', nombre: 'JATA' },
    { id: 'ORBEGOZO', nombre: 'ORBEGOZO' },
    { id: 'ALFADYSER', nombre: 'ALFADYSER' },
    { id: 'VITROKITCHEN', nombre: 'VITROKITCHEN' },
    { id: 'ELECTRODIRECTO', nombre: 'ELECTRODIRECTO' },
    { id: 'ALMCE', nombre: 'ALMCE' },
    { id: 'ABRILA', nombre: 'ABRILA' },
    { id: 'AGUACONFORT', nombre: 'AGUACONFORT' },
    { id: 'BECKEN', nombre: 'BECKEN' },
    { id: 'TEGALUXE', nombre: 'TEGALUXE' },
    { id: 'EAS-JOHNSON', nombre: 'EAS-JOHNSON' },
    { id: 'UFESA', nombre: 'UFESA' },
    { id: 'NEVIR', nombre: 'NEVIR' },
    { id: 'MIELECTRO', nombre: 'MIELECTRO' },
    // { id: 'ALMACENES', nombre: 'ALMACENES (Alternativo)' }, // Ocultamos la alternativa para evitar confusión
    { id: 'GENERICO', nombre: 'Genérico (Otros proveedores)' }
  ];

  // Tipos de importación disponibles
  const tipos = [
    { id: 'productos', nombre: 'Productos (Completo)' },
    { id: 'precios', nombre: 'Actualización de Precios' },
    { id: 'stock', nombre: 'Actualización de Stock' }
  ];

  // Cargar historial de importaciones al montar el componente
  useEffect(() => {
    cargarHistorial();
  }, []);

  // Cargar historial de importaciones
  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await obtenerHistorialImportaciones();
      setHistorial(data.items || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar el historial de importaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar el estado de una importación en curso
  const actualizarEstadoImportacion = async (importacionId) => {
    try {
      // Validar que el ID de importación sea válido
      if (!importacionId) {
        console.warn('[actualizarEstadoImportacion] No se puede actualizar el estado: ID de importación no válido');
        return null;
      }
      
      // Ya no usamos objetos simulados, siempre consultamos el estado real en PocketBase
      
      // Intentar obtener el estado de la importación
      try {
        console.log(`[actualizarEstadoImportacion] Obteniendo estado para importación: ${importacionId}`);
        const data = await obtenerEstadoImportacion(importacionId);
        
        // Si tenemos datos válidos, actualizar el estado
        if (data && typeof data === 'object') {
          console.log(`[actualizarEstadoImportacion] Estado obtenido correctamente: ${data.estado || 'desconocido'}`);
          
          // Ya no hay objetos simulados
          
          setImportacionActual(data);
          
          // Si la importación ha finalizado, actualizar el historial
          if (data.estado === 'completado' || data.estado === 'error') {
            console.log(`[actualizarEstadoImportacion] Importación finalizada con estado: ${data.estado}`);
            cargarHistorial();
          }
          
          return data;
        } else {
          console.warn('[actualizarEstadoImportacion] Datos de importación inválidos:', data);
          return null;
        }
      } catch (fetchErr) {
        // Manejar errores al obtener el estado de la importación
        console.error('[actualizarEstadoImportacion] Error al obtener estado de importación:', fetchErr);
        
        // Verificar si es un error de lectura múltiple del cuerpo de la respuesta
        if (fetchErr.message && fetchErr.message.includes('body stream already read')) {
          console.warn('[actualizarEstadoImportacion] Error de lectura múltiple del cuerpo de la respuesta.');
          // Intentar nuevamente en la próxima iteración del polling
          return null;
        }
        
        // Propagar el error para que sea manejado por el componente
        throw fetchErr;
      }
    } catch (err) {
      console.error('[actualizarEstadoImportacion] Error general al actualizar estado de importación:', err);
      return null;
    }
  };

  // Iniciar una nueva importación
  const iniciarImportacion = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // Validar que haya un archivo seleccionado
      if (!file) {
        setError('Debe seleccionar un archivo');
        setLoading(false);
        return;
      }
      
      // Validar que haya un proveedor seleccionado
      if (!proveedor) {
        setError('Debe seleccionar un proveedor');
        setLoading(false);
        return;
      }
      
      // Validar que haya un tipo seleccionado
      if (!tipo) {
        setError('Debe seleccionar un tipo de importación');
        setLoading(false);
        return;
      }
      
      // Subir archivo y registrar importación
      const respuesta = await subirArchivoImportacion(file, proveedor, tipo);
      
      // Validar que la respuesta tenga un formato válido
      if (!respuesta) {
        setError('Error: No se recibió respuesta del servidor');
        console.error('No se recibió respuesta del servidor');
        setLoading(false);
        return null;
      }
      
      // Extraer la información de importación de la respuesta
      // La respuesta puede tener formato {importacion: {...}} o ser directamente el objeto importacion
      const importacion = respuesta.importacion || respuesta;
      
      // El servidor restaurado devuelve importacionId en lugar de id
      // Adaptamos la respuesta para que sea compatible con el resto del código
      if (importacion.importacionId && !importacion.id) {
        importacion.id = importacion.importacionId;
      }
      
      // Validar que la importación tenga un ID válido
      if (!importacion || (!importacion.id && !importacion.importacionId)) {
        setError('Error: No se pudo obtener el ID de la importación');
        console.error('Respuesta de importación inválida:', respuesta);
        setLoading(false);
        return null;
      }
      
      setImportacionActual(importacion);
      
      // Iniciar polling para actualizar el estado
      iniciarPolling(importacion.id);
      
      setSuccess(true);
      cargarHistorial();
      
      return importacion;
    } catch (err) {
      setError('Error al iniciar la importación: ' + (err.message || 'Error desconocido'));
      console.error('Error al iniciar importación:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Iniciar polling para actualizar el estado de la importación
  const iniciarPolling = (importacionId) => {
    // Guardar una referencia al intervalo para poder cancelarlo
    let intervalo;
    let intentos = 0;
    let erroresConsecutivos = 0;
    const maxIntentos = 30; // Máximo número de intentos (30 * 2 segundos = 1 minuto)
    const maxErroresConsecutivos = 5; // Máximo número de errores consecutivos antes de detener
    
    // Función para detener el polling
    const detenerPolling = () => {
      if (intervalo) {
        clearInterval(intervalo);
        console.log(`[iniciarPolling] Polling detenido para importación: ${importacionId}`);
      }
    };
    
    console.log(`[iniciarPolling] Iniciando polling para importación: ${importacionId}`);
    
    // Iniciar el intervalo de polling
    intervalo = setInterval(async () => {
      try {
        // Incrementar contador de intentos
        intentos++;
        
        // Si superamos el máximo de intentos, detener el polling
        if (intentos >= maxIntentos) {
          console.warn(`[iniciarPolling] Polling detenido después de ${maxIntentos} intentos para importación: ${importacionId}`);
          detenerPolling();
          return;
        }
        
        console.log(`[iniciarPolling] Intento ${intentos}/${maxIntentos} para importación: ${importacionId}`);
        
        // Intentar actualizar el estado
        const importacion = await actualizarEstadoImportacion(importacionId);
        
        // Si la actualización fue exitosa, resetear el contador de errores
        if (importacion) {
          erroresConsecutivos = 0;
          
          // Si la importación ha finalizado, detener el polling
          if (importacion.estado === 'completado' || importacion.estado === 'error') {
            console.log(`[iniciarPolling] Importación finalizada con estado: ${importacion.estado}, deteniendo polling`);
            detenerPolling();
          }
        } else {
          // Si no hay datos de importación, incrementar el contador de errores
          erroresConsecutivos++;
          console.warn(`[iniciarPolling] No se obtuvieron datos de importación. Errores consecutivos: ${erroresConsecutivos}/${maxErroresConsecutivos}`);
          
          // Si hay demasiados errores consecutivos, detener el polling
          if (erroresConsecutivos >= maxErroresConsecutivos) {
            console.error(`[iniciarPolling] Demasiados errores consecutivos (${erroresConsecutivos}), deteniendo polling`);
            detenerPolling();
          }
        }
      } catch (err) {
        // Incrementar el contador de errores consecutivos
        erroresConsecutivos++;
        console.error(`[iniciarPolling] Error en el polling de importación (${erroresConsecutivos}/${maxErroresConsecutivos}):`, err);
        
        // Si hay demasiados errores consecutivos, detener el polling
        if (erroresConsecutivos >= maxErroresConsecutivos) {
          console.error(`[iniciarPolling] Demasiados errores consecutivos (${erroresConsecutivos}), deteniendo polling`);
          detenerPolling();
        }
      }
    }, 2000); // Actualizar cada 2 segundos
    
    // Detener el polling después de 1 minuto (60000 ms) para evitar polling infinito
    setTimeout(() => {
      console.log(`[iniciarPolling] Tiempo máximo alcanzado (60s), deteniendo polling para importación: ${importacionId}`);
      detenerPolling();
    }, 60000);
    
    // Devolver la función para detener el polling (para uso externo)
    return detenerPolling;
  };

  // Previsualizar datos del archivo
  const previsualizarArchivo = (file) => {
    // Implementar lógica para previsualizar el archivo
    // Por ahora, solo mostraremos el nombre y tamaño
    setPreviewData([
      { campo: 'Nombre', valor: file.name },
      { campo: 'Tamaño', valor: `${(file.size / 1024).toFixed(2)} KB` },
      { campo: 'Tipo', valor: file.type }
    ]);
  };

  // Manejar cambio de archivo
  const handleFileChange = (newFile) => {
    setFile(newFile);
    if (newFile) {
      previsualizarArchivo(newFile);
    } else {
      setPreviewData([]);
    }
  };

  // Manejar cambio de proveedor
  const handleProveedorChange = (nuevoProveedor) => {
    setProveedor(nuevoProveedor);
  };

  // Manejar cambio de tipo
  const handleTipoChange = (nuevoTipo) => {
    setTipo(nuevoTipo);
  };

  // Resetear el formulario
  const resetForm = () => {
    setFile(null);
    setProveedor('');
    setTipo('');
    setPreviewData([]);
    setError(null);
    setSuccess(false);
  };

  return {
    file,
    proveedor,
    tipo,
    importacionActual,
    historial,
    loading,
    error,
    success,
    previewData,
    proveedores,
    tipos,
    handleFileChange,
    handleProveedorChange,
    handleTipoChange,
    iniciarImportacion,
    cargarHistorial,
    actualizarEstadoImportacion,
    resetForm
  };
};

export default useImportacion;
