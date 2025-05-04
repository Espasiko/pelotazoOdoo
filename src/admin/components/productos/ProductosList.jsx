import React, { useState } from 'react';
import {
  List,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { useList, useDelete } from '@refinedev/core';
import ProductoDialog from './ProductoDialog';

// Función para formatear precios
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

export const ProductosList = () => {
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

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre o código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Destacado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProductos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            ) : (
              filteredProductos.map((producto) => (
                <TableRow key={producto.id} hover>
                  <TableCell>
                    {producto.imagen ? (
                      <Box
                        component="img"
                        src={`http://localhost:8092/api/files/productos/${producto.id}/${producto.imagen}`}
                        alt={producto.nombre}
                        sx={{ width: 50, height: 50, objectFit: 'contain' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Sin imagen
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {producto.nombre}
                    </Typography>
                    {producto.codigo_barras && (
                      <Typography variant="caption" color="text.secondary">
                        Código: {producto.codigo_barras}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{producto.marca?.nombre || '-'}</TableCell>
                  <TableCell>{producto.categoria?.nombre || '-'}</TableCell>
                  <TableCell align="right">{formatPrice(producto.precio)}</TableCell>
                  <TableCell align="right">{producto.stock}</TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={producto.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      label={producto.visible ? 'Visible' : 'Oculto'}
                      color={producto.visible ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {producto.destacado ? (
                      <Tooltip title="Producto destacado">
                        <StarIcon color="warning" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="No destacado">
                        <StarBorderIcon color="disabled" />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(producto)}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(producto)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para crear/editar producto */}
      <ProductoDialog
        open={openDialog}
        onClose={handleCloseDialog}
        producto={currentProducto}
      />

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el producto "{productoToDelete?.nombre}"?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductosList;
