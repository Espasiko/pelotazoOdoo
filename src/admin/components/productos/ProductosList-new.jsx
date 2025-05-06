import React from 'react';
import {
  Typography,
  Box,
  Button
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// Importamos los componentes refactorizados
import ProductoTable from './components/ProductoTable';
import ProductoFilters from './components/ProductoFilters';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import ProductoDialog from './ProductoDialog';

// Importamos el hook personalizado
import useProductos from './hooks/useProductos';

/**
 * Componente principal para la gestión de productos
 * @returns {JSX.Element} - Componente de listado de productos
 */
export const ProductosList = () => {
  // Utilizamos el hook personalizado para gestionar los productos
  const {
    productos,
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
  } = useProductos();

  // Renderizar mensaje de carga o error
  if (isLoading) {
    return <Typography>Cargando productos...</Typography>;
  }

  if (isError) {
    return <Typography color="error">Error al cargar los productos.</Typography>;
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Gestión de Productos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Producto
        </Button>
      </Box>

      {/* Componente de filtros */}
      <ProductoFilters 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />

      {/* Tabla de productos */}
      <ProductoTable 
        productos={productos} 
        onEdit={handleOpenDialog} 
        onDelete={handleDeleteClick} 
      />

      {/* Diálogo de creación/edición de producto */}
      <ProductoDialog
        open={openDialog}
        onClose={handleCloseDialog}
        producto={currentProducto}
      />

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        producto={productoToDelete}
      />
    </>
  );
};

export default ProductosList;
