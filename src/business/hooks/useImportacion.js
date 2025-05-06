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
    { id: 'ALMCE', nombre: 'ALMACENES' },
    { id: 'ALMACENES', nombre: 'ALMACENES (Alternativo)' },
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
        console.warn('No se puede actualizar el estado: ID de importación no válido');
        return null;
      }
      
      const data = await obtenerEstadoImportacion(importacionId);
      setImportacionActual(data);
      
      // Si la importación ha finalizado, actualizar el historial
      if (data.estado === 'completado' || data.estado === 'error') {
        cargarHistorial();
      }
      
      return data;
    } catch (err) {
      console.error('Error al actualizar estado de importación:', err);
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
      
      // Validar que la importación tenga un ID válido
      if (!importacion || !importacion.id) {
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
    const intervalo = setInterval(async () => {
      const importacion = await actualizarEstadoImportacion(importacionId);
      
      // Si la importación ha finalizado, detener el polling
      if (importacion && (importacion.estado === 'completado' || importacion.estado === 'error')) {
        clearInterval(intervalo);
      }
    }, 2000); // Actualizar cada 2 segundos
    
    // Detener el polling después de 5 minutos (300000 ms) para evitar polling infinito
    setTimeout(() => {
      clearInterval(intervalo);
    }, 300000);
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
