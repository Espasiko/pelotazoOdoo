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
import MarcaDialog from './MarcaDialog';

export const MarcasList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMarca, setCurrentMarca] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [marcaToDelete, setMarcaToDelete] = useState(null);

  // Obtener lista de marcas
  const { data, isLoading, isError } = useList({
    resource: 'marcas',
    pagination: {
      current: 1,
      pageSize: 50,
    },
  });

  // Hook para eliminar marcas
  const { mutate: deleteMarca } = useDelete();

  // Filtrar marcas por término de búsqueda
  const filteredMarcas = data?.data.filter(marca => 
    marca.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Manejar apertura del diálogo de creación/edición
  const handleOpenDialog = (marca = null) => {
    setCurrentMarca(marca);
    setOpenDialog(true);
  };

  // Manejar cierre del diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentMarca(null);
  };

  // Manejar apertura del diálogo de confirmación de eliminación
  const handleDeleteClick = (marca) => {
    setMarcaToDelete(marca);
    setDeleteDialogOpen(true);
  };

  // Manejar eliminación de marca
  const handleDeleteConfirm = () => {
    if (marcaToDelete) {
      deleteMarca({
        resource: 'marcas',
        id: marcaToDelete.id,
      });
    }
    setDeleteDialogOpen(false);
    setMarcaToDelete(null);
  };

  // Renderizar mensaje de carga o error
  if (isLoading) {
    return <Typography>Cargando marcas...</Typography>;
  }

  if (isError) {
    return <Typography color="error">Error al cargar las marcas.</Typography>;
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Gestión de Marcas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Marca
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
              <TableCell>Logo</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Productos</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMarcas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No se encontraron marcas.
                </TableCell>
              </TableRow>
            ) : (
              filteredMarcas.map((marca) => (
                <TableRow key={marca.id} hover>
                  <TableCell>
                    {marca.logo ? (
                      <Box
                        component="img"
                        src={`http://localhost:8092/api/files/marcas/${marca.id}/${marca.logo}`}
                        alt={marca.nombre}
                        sx={{ width: 80, height: 40, objectFit: 'contain' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 80,
                          height: 40,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Sin logo
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {marca.nombre}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={marca.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      label={marca.visible ? 'Visible' : 'Oculta'}
                      color={marca.visible ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {/* En una implementación real, aquí se mostraría el número de productos de esta marca */}
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
                          onClick={() => handleOpenDialog(marca)}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(marca)}
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

      {/* Diálogo para crear/editar marca */}
      <MarcaDialog
        open={openDialog}
        onClose={handleCloseDialog}
        marca={currentMarca}
      />

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar la marca "{marcaToDelete?.nombre}"?
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

export default MarcasList;
