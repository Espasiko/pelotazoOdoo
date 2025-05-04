import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useList, useDelete } from '@refinedev/core';
import ClienteDialog from './ClienteDialog';

export const ClientesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCliente, setCurrentCliente] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);

  // Obtener lista de clientes
  const { data, isLoading, isError } = useList({
    resource: 'clientes',
    pagination: {
      current: 1,
      pageSize: 50,
    },
  });

  // Hook para eliminar clientes
  const { mutate: deleteCliente } = useDelete();

  // Filtrar clientes por término de búsqueda
  const filteredClientes = data?.data.filter(cliente => 
    cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.teléfono?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Manejar apertura del diálogo de creación/edición
  const handleOpenDialog = (cliente = null) => {
    setCurrentCliente(cliente);
    setOpenDialog(true);
  };

  // Manejar cierre del diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCliente(null);
  };

  // Manejar apertura del diálogo de confirmación de eliminación
  const handleDeleteClick = (cliente) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  // Manejar eliminación de cliente
  const handleDeleteConfirm = () => {
    if (clienteToDelete) {
      deleteCliente({
        resource: 'clientes',
        id: clienteToDelete.id,
      });
    }
    setDeleteDialogOpen(false);
    setClienteToDelete(null);
  };

  // Función para formatear la distancia
  const formatDistancia = (distancia) => {
    if (distancia === null || distancia === undefined) return 'No especificada';
    return `${distancia} km`;
  };

  // Función para determinar el color de la distancia
  const getDistanciaColor = (distancia) => {
    if (distancia === null || distancia === undefined) return 'default';
    if (distancia <= 15) return 'success';
    if (distancia <= 30) return 'warning';
    return 'error';
  };

  // Renderizar mensaje de carga o error
  if (isLoading) {
    return (
      <Box sx={{ p: 2, color: 'white' }}>
        <Typography>Cargando clientes...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 2, color: 'white' }}>
        <Typography color="error">Error al cargar los clientes.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ color: 'white' }}>
          Gestión de Clientes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Cliente
        </Button>
      </Box>

      <Paper 
        sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: '#1e2a38', 
          border: '1px solid #2d3748' 
        }}
        elevation={0}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre, apellidos, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'white' }} />
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2d3748',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4a5568',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e53935',
              },
            }
          }}
        />
      </Paper>

      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          backgroundColor: '#1e2a38',
          border: '1px solid #2d3748',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Nombre</TableCell>
                <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Contacto</TableCell>
                <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Dirección</TableCell>
                <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Distancia</TableCell>
                <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                    No se encontraron clientes.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow 
                    key={cliente.id} 
                    hover
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'rgba(255, 255, 255, 0.04)' 
                      }
                    }}
                  >
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {cliente.nombre} {cliente.apellidos}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" sx={{ color: '#a0aec0' }} />
                          <Typography variant="body2">{cliente.email || 'No disponible'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" sx={{ color: '#a0aec0' }} />
                          <Typography variant="body2">{cliente.teléfono || 'No disponible'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <LocationOnIcon fontSize="small" sx={{ color: '#a0aec0', mt: 0.3 }} />
                        <Typography variant="body2">
                          {cliente.dirección ? (
                            <>
                              {cliente.dirección}
                              <br />
                              {cliente.código_postal} {cliente.ciudad}, {cliente.provincia}
                            </>
                          ) : (
                            'No disponible'
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                      <Chip
                        label={formatDistancia(cliente.distancia_tienda)}
                        color={getDistanciaColor(cliente.distancia_tienda)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenDialog(cliente)}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(cliente)}
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
      </Paper>

      {/* Diálogo para crear/editar cliente */}
      <ClienteDialog
        open={openDialog}
        onClose={handleCloseDialog}
        cliente={currentCliente}
      />

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1e2a38',
            color: 'white',
            border: '1px solid #2d3748',
          }
        }}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#a0aec0' }}>
            ¿Está seguro de que desea eliminar al cliente "{clienteToDelete?.nombre} {clienteToDelete?.apellidos}"?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClientesList;
