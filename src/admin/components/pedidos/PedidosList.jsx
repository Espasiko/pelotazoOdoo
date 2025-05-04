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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  MoreVert as MoreVertIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useList, useDelete } from '@refinedev/core';
import PedidoDialog from './PedidoDialog';

// Función para formatear fechas
const formatDate = (dateString) => {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

// Función para formatear precios
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

// Componente para mostrar el estado del pedido
const OrderStatus = ({ status }) => {
  let color = 'default';
  let label = status;
  let icon = null;

  switch (status.toLowerCase()) {
    case 'completado':
      color = 'success';
      icon = <CheckCircleIcon fontSize="small" />;
      break;
    case 'pendiente':
      color = 'warning';
      icon = null;
      break;
    case 'cancelado':
      color = 'error';
      icon = <CancelIcon fontSize="small" />;
      break;
    case 'en proceso':
      color = 'info';
      icon = <ShippingIcon fontSize="small" />;
      break;
    case 'enviado':
      color = 'primary';
      icon = <ShippingIcon fontSize="small" />;
      break;
    default:
      color = 'default';
  }

  return (
    <Chip 
      icon={icon}
      label={label} 
      color={color} 
      size="small" 
      variant="outlined"
      sx={{ minWidth: '100px' }}
    />
  );
};

export const PedidosList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPedido, setCurrentPedido] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  // Obtener lista de pedidos
  const { data, isLoading, isError } = useList({
    resource: 'pedidos',
    pagination: {
      current: 1,
      pageSize: 50,
    },
  });

  // Hook para eliminar pedidos
  const { mutate: deletePedido } = useDelete();

  // Filtrar pedidos por término de búsqueda y estado
  const filteredPedidos = data?.data.filter(pedido => {
    const matchesSearch = 
      pedido.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || pedido.estado?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Manejar apertura del diálogo de creación/edición
  const handleOpenDialog = (pedido = null) => {
    setCurrentPedido(pedido);
    setOpenDialog(true);
  };

  // Manejar cierre del diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPedido(null);
  };

  // Manejar apertura del menú de acciones
  const handleMenuOpen = (event, pedido) => {
    setAnchorEl(event.currentTarget);
    setSelectedPedido(pedido);
  };

  // Manejar cierre del menú de acciones
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPedido(null);
  };

  // Manejar apertura del menú de filtros
  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  // Manejar cierre del menú de filtros
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  // Manejar selección de filtro de estado
  const handleStatusFilterSelect = (status) => {
    setStatusFilter(status);
    setFilterAnchorEl(null);
  };

  // Manejar eliminación de pedido
  const handleDeletePedido = () => {
    if (selectedPedido) {
      deletePedido({
        resource: 'pedidos',
        id: selectedPedido.id,
      });
    }
    handleMenuClose();
  };

  // Renderizar mensaje de carga o error
  if (isLoading) {
    return (
      <Box sx={{ p: 2, color: 'white' }}>
        <Typography>Cargando pedidos...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 2, color: 'white' }}>
        <Typography color="error">Error al cargar los pedidos.</Typography>
      </Box>
    );
  }

  // Datos de ejemplo para pedidos
  const pedidosEjemplo = [
    {
      id: 'PED-001',
      fecha: '2025-04-28',
      cliente: { nombre: 'Juan', apellidos: 'Pérez', email: 'juan@example.com' },
      total: 1299.99,
      estado: 'Completado',
      productos: 3,
      metodo_pago: 'Tarjeta',
      direccion_envio: 'Calle Principal 123, Madrid'
    },
    {
      id: 'PED-002',
      fecha: '2025-04-27',
      cliente: { nombre: 'María', apellidos: 'López', email: 'maria@example.com' },
      total: 499.50,
      estado: 'Pendiente',
      productos: 2,
      metodo_pago: 'PayPal',
      direccion_envio: 'Avenida Central 45, Barcelona'
    },
    {
      id: 'PED-003',
      fecha: '2025-04-26',
      cliente: { nombre: 'Carlos', apellidos: 'Rodríguez', email: 'carlos@example.com' },
      total: 249.99,
      estado: 'En Proceso',
      productos: 1,
      metodo_pago: 'Transferencia',
      direccion_envio: 'Plaza Mayor 8, Valencia'
    },
    {
      id: 'PED-004',
      fecha: '2025-04-25',
      cliente: { nombre: 'Ana', apellidos: 'Martínez', email: 'ana@example.com' },
      total: 799.00,
      estado: 'Enviado',
      productos: 4,
      metodo_pago: 'Tarjeta',
      direccion_envio: 'Calle Secundaria 56, Sevilla'
    },
    {
      id: 'PED-005',
      fecha: '2025-04-24',
      cliente: { nombre: 'Pedro', apellidos: 'Sánchez', email: 'pedro@example.com' },
      total: 129.99,
      estado: 'Cancelado',
      productos: 1,
      metodo_pago: 'Contra reembolso',
      direccion_envio: 'Avenida Principal 23, Bilbao'
    }
  ];

  // Usar datos de ejemplo en lugar de datos reales (para desarrollo)
  const displayPedidos = pedidosEjemplo.filter(pedido => {
    const matchesSearch = 
      pedido.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || pedido.estado?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ color: 'white' }}>
          Gestión de Pedidos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Pedido
        </Button>
      </Box>

      <Paper 
        sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: '#1e2a38', 
          border: '1px solid #2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
        elevation={0}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por ID, cliente o email..."
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
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleFilterMenuOpen}
          sx={{
            color: statusFilter ? 'primary.main' : 'white',
            borderColor: statusFilter ? 'primary.main' : '#2d3748',
            '&:hover': {
              borderColor: '#4a5568',
              backgroundColor: 'rgba(255, 255, 255, 0.04)'
            }
          }}
        >
          {statusFilter || 'Filtrar'}
        </Button>
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: '#1e2a38',
              color: 'white',
              border: '1px solid #2d3748',
            }
          }}
        >
          <MenuItem onClick={() => handleStatusFilterSelect('')}>
            <ListItemText>Todos</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterSelect('Pendiente')}>
            <ListItemIcon>
              <Chip label="Pendiente" color="warning" size="small" variant="outlined" />
            </ListItemIcon>
            <ListItemText>Pendiente</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterSelect('En Proceso')}>
            <ListItemIcon>
              <Chip label="En Proceso" color="info" size="small" variant="outlined" />
            </ListItemIcon>
            <ListItemText>En Proceso</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterSelect('Enviado')}>
            <ListItemIcon>
              <Chip label="Enviado" color="primary" size="small" variant="outlined" />
            </ListItemIcon>
            <ListItemText>Enviado</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterSelect('Completado')}>
            <ListItemIcon>
              <Chip label="Completado" color="success" size="small" variant="outlined" />
            </ListItemIcon>
            <ListItemText>Completado</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterSelect('Cancelado')}>
            <ListItemIcon>
              <Chip label="Cancelado" color="error" size="small" variant="outlined" />
            </ListItemIcon>
            <ListItemText>Cancelado</ListItemText>
          </MenuItem>
        </Menu>
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
                <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>ID</TableCell>
                <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Fecha</TableCell>
                <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Cliente</TableCell>
                <TableCell align="right" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Total</TableCell>
                <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Estado</TableCell>
                <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayPedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                    No se encontraron pedidos.
                  </TableCell>
                </TableRow>
              ) : (
                displayPedidos.map((pedido) => (
                  <TableRow 
                    key={pedido.id} 
                    hover
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'rgba(255, 255, 255, 0.04)' 
                      }
                    }}
                  >
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {pedido.id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      {formatDate(pedido.fecha)}
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      <Typography variant="body2">
                        {pedido.cliente.nombre} {pedido.cliente.apellidos}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        {pedido.cliente.email}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {formatPrice(pedido.total)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                        {pedido.productos} productos
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                      <OrderStatus status={pedido.estado} />
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenDialog(pedido)}
                            size="small"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Más acciones">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, pedido)}
                            size="small"
                            sx={{ color: 'white' }}
                          >
                            <MoreVertIcon fontSize="small" />
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

      {/* Menú de acciones para cada pedido */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: '#1e2a38',
            color: 'white',
            border: '1px solid #2d3748',
          }
        }}
      >
        <MenuItem onClick={() => {
          handleOpenDialog(selectedPedido);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Editar pedido</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PrintIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Imprimir pedido</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ReceiptIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Generar factura</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ShippingIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Actualizar estado</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeletePedido}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogo para crear/editar pedido */}
      <PedidoDialog
        open={openDialog}
        onClose={handleCloseDialog}
        pedido={currentPedido}
      />
    </>
  );
};

export default PedidosList;
