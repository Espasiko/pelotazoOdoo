import { useState } from 'react';
import { useList, useDelete } from '@refinedev/core';

/**
 * Hook personalizado para gestionar productos
 * @returns {Object} - Métodos y datos para gestionar productos
 */
export const useProductos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProducto, setCurrentProducto] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState(null);

  // Obtener lista de productos
  const { data, isLoading, isError } = useList({
    resource: 'productos',
    pagination: {
      current: 1,
      pageSize: 50,
    },
  });

  // Hook para eliminar productos
  const { mutate: deleteProducto } = useDelete();

  // Filtrar productos por término de búsqueda
  const filteredProductos = data?.data.filter(producto => 
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Manejar apertura del diálogo de creación/edición
  const handleOpenDialog = (producto = null) => {
    setCurrentProducto(producto);
    setOpenDialog(true);
  };

  // Manejar cierre del diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProducto(null);
  };

  // Manejar apertura del diálogo de confirmación de eliminación
  const handleDeleteClick = (producto) => {
    setProductoToDelete(producto);
    setDeleteDialogOpen(true);
  };

  // Manejar eliminación de producto
  const handleDeleteConfirm = () => {
    if (productoToDelete) {
      deleteProducto({
        resource: 'productos',
        id: productoToDelete.id,
      });
    }
    setDeleteDialogOpen(false);
    setProductoToDelete(null);
  };

  return {
    productos: filteredProductos,
    isLoading,
    isError,
    searchTerm,
    setSearchTerm,
    openDialog,
    currentProducto,
    handleOpenDialog,
    handleCloseDialog,
    deleteDialogOpen,
    setDeleteDialogOpen,
    productoToDelete,
    handleDeleteClick,
    handleDeleteConfirm
  };
};

export default useProductos;
