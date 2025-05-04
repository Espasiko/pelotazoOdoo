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
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useList, useDelete } from '@refinedev/core';
import CategoriaDialog from './CategoriaDialog';

export const CategoriasList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState(null);

  // Obtener lista de categorías
  const { data, isLoading, isError } = useList({
    resource: 'categorias',
    pagination: {
      current: 1,
      pageSize: 50,
    },
  });

  // Hook para eliminar categorías
  const { mutate: deleteCategoria } = useDelete();

  // Filtrar categorías por término de búsqueda
  const filteredCategorias = data?.data.filter(categoria => 
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Manejar apertura del diálogo de creación/edición
  const handleOpenDialog = (categoria = null) => {
    setCurrentCategoria(categoria);
    setOpenDialog(true);
  };

  // Manejar cierre del diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCategoria(null);
  };

  // Manejar apertura del diálogo de confirmación de eliminación
  const handleDeleteClick = (categoria) => {
    setCategoriaToDelete(categoria);
    setDeleteDialogOpen(true);
  };

  // Manejar eliminación de categoría
  const handleDeleteConfirm = () => {
    if (categoriaToDelete) {
      deleteCategoria({
        resource: 'categorias',
        id: categoriaToDelete.id,
      });
    }
    setDeleteDialogOpen(false);
    setCategoriaToDelete(null);
  };

  // Renderizar mensaje de carga o error
  if (isLoading) {
    return <Typography>Cargando categorías...</Typography>;
  }

  if (isError) {
    return <Typography color="error">Error al cargar las categorías.</Typography>;
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Gestión de Categorías
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Categoría
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre..."
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
              <TableCell>Descripción</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Productos</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCategorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No se encontraron categorías.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategorias.map((categoria) => (
                <TableRow key={categoria.id} hover>
                  <TableCell>
                    {categoria.imagen ? (
                      <Box
                        component="img"
                        src={`http://localhost:8092/api/files/categorias/${categoria.id}/${categoria.imagen}`}
                        alt={categoria.nombre}
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
                      {categoria.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ 
                      maxWidth: 300,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {categoria.descripcion || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={categoria.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      label={categoria.visible ? 'Visible' : 'Oculta'}
                      color={categoria.visible ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {/* En una implementación real, aquí se mostraría el número de productos en esta categoría */}
                    <Chip
                      label="0 productos"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(categoria)}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(categoria)}
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

      {/* Diálogo para crear/editar categoría */}
      <CategoriaDialog
        open={openDialog}
        onClose={handleCloseDialog}
        categoria={currentCategoria}
      />

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar la categoría "{categoriaToDelete?.nombre}"?
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

export default CategoriasList;
