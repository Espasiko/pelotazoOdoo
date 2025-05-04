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
  ListItemText,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  MoreVert as MoreVertIcon,
  Receipt as ReceiptIcon,
  ReceiptLong as ReceiptLongIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useList, useDelete } from '@refinedev/core';
import FacturaDialog from './FacturaDialog';

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

// Componente para mostrar el estado de la factura
const FacturaStatus = ({ status }) => {
  let color = 'default';
  let label = status;
  let icon = null;

  switch (status.toLowerCase()) {
    case 'pagada':
      color = 'success';
      break;
    case 'pendiente':
      color = 'warning';
      break;
    case 'anulada':
      color = 'error';
      break;
    case 'vencida':
      color = 'error';
      break;
    case 'enviada':
      color = 'info';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip 
      label={label} 
      color={color} 
      size="small" 
      variant="outlined"
      sx={{ minWidth: '100px' }}
    />
  );
};

// Componente para mostrar el tipo de factura
const FacturaTipo = ({ tipo }) => {
  let color = 'default';
  let label = tipo;
  let icon = null;

  switch (tipo.toLowerCase()) {
    case 'normal':
      color = 'primary';
      icon = <ReceiptIcon fontSize="small" />;
      break;
    case 'electrónica':
      color = 'secondary';
      icon = <ReceiptLongIcon fontSize="small" />;
      break;
    case 'simplificada':
      color = 'info';
      break;
    case 'rectificativa':
      color = 'warning';
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
    />
  );
};

// Componente TabPanel para las pestañas
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`facturacion-tabpanel-${index}`}
      aria-labelledby={`facturacion-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export const FacturacionList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentFactura, setCurrentFactura] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Obtener lista de facturas
  const { data, isLoading, isError } = useList({
    resource: 'facturas',
    pagination: {
      current: 1,
      pageSize: 50,
    },
  });

  // Hook para eliminar facturas
  const { mutate: deleteFactura } = useDelete();

  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Manejar apertura del diálogo de creación/edición
  const handleOpenDialog = (factura = null) => {
    setCurrentFactura(factura);
    setOpenDialog(true);
  };

  // Manejar cierre del diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentFactura(null);
  };

  // Manejar apertura del menú de acciones
  const handleMenuOpen = (event, factura) => {
    setAnchorEl(event.currentTarget);
    setSelectedFactura(factura);
  };

  // Manejar cierre del menú de acciones
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFactura(null);
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

  // Manejar eliminación de factura
  const handleDeleteFactura = () => {
    if (selectedFactura) {
      deleteFactura({
        resource: 'facturas',
        id: selectedFactura.id,
      });
    }
    handleMenuClose();
  };

  // Renderizar mensaje de carga o error
  if (isLoading) {
    return (
      <Box sx={{ p: 2, color: 'white' }}>
        <Typography>Cargando facturas...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 2, color: 'white' }}>
        <Typography color="error">Error al cargar las facturas.</Typography>
      </Box>
    );
  }

  // Datos de ejemplo para facturas normales
  const facturasNormalesEjemplo = [
    {
      id: 'F-2025-001',
      fecha: '2025-04-28',
      cliente: { nombre: 'Juan', apellidos: 'Pérez', email: 'juan@example.com' },
      total: 1299.99,
      estado: 'Pagada',
      tipo: 'Normal',
      pedido_id: 'PED-001',
      metodo_pago: 'Tarjeta',
      fecha_vencimiento: '2025-05-28'
    },
    {
      id: 'F-2025-002',
      fecha: '2025-04-27',
      cliente: { nombre: 'María', apellidos: 'López', email: 'maria@example.com' },
      total: 499.50,
      estado: 'Pendiente',
      tipo: 'Normal',
      pedido_id: 'PED-002',
      metodo_pago: 'PayPal',
      fecha_vencimiento: '2025-05-27'
    },
    {
      id: 'F-2025-003',
      fecha: '2025-04-26',
      cliente: { nombre: 'Carlos', apellidos: 'Rodríguez', email: 'carlos@example.com' },
      total: 249.99,
      estado: 'Enviada',
      tipo: 'Normal',
      pedido_id: 'PED-003',
      metodo_pago: 'Transferencia',
      fecha_vencimiento: '2025-05-26'
    },
    {
      id: 'F-2025-004',
      fecha: '2025-04-25',
      cliente: { nombre: 'Ana', apellidos: 'Martínez', email: 'ana@example.com' },
      total: 799.00,
      estado: 'Vencida',
      tipo: 'Normal',
      pedido_id: 'PED-004',
      metodo_pago: 'Tarjeta',
      fecha_vencimiento: '2025-04-25'
    },
    {
      id: 'F-2025-005',
      fecha: '2025-04-24',
      cliente: { nombre: 'Pedro', apellidos: 'Sánchez', email: 'pedro@example.com' },
      total: 129.99,
      estado: 'Anulada',
      tipo: 'Normal',
      pedido_id: 'PED-005',
      metodo_pago: 'Contra reembolso',
      fecha_vencimiento: '2025-05-24'
    }
  ];

  // Datos de ejemplo para facturas electrónicas
  const facturasElectronicasEjemplo = [
    {
      id: 'FE-2025-001',
      fecha: '2025-04-28',
      cliente: { nombre: 'Empresa A', apellidos: 'S.L.', email: 'info@empresaa.com', nif: 'B12345678' },
      total: 2500.00,
      estado: 'Pagada',
      tipo: 'Electrónica',
      pedido_id: 'PED-006',
      metodo_pago: 'Transferencia',
      fecha_vencimiento: '2025-05-28'
    },
    {
      id: 'FE-2025-002',
      fecha: '2025-04-27',
      cliente: { nombre: 'Empresa B', apellidos: 'S.A.', email: 'info@empresab.com', nif: 'A87654321' },
      total: 1800.50,
      estado: 'Pendiente',
      tipo: 'Electrónica',
      pedido_id: 'PED-007',
      metodo_pago: 'Transferencia',
      fecha_vencimiento: '2025-05-27'
    },
    {
      id: 'FE-2025-003',
      fecha: '2025-04-26',
      cliente: { nombre: 'Empresa C', apellidos: 'S.L.', email: 'info@empresac.com', nif: 'B55555555' },
      total: 3200.75,
      estado: 'Enviada',
      tipo: 'Electrónica',
      pedido_id: 'PED-008',
      metodo_pago: 'Transferencia',
      fecha_vencimiento: '2025-05-26'
    }
  ];

  // Filtrar facturas según la pestaña activa y términos de búsqueda
  const getFilteredFacturas = () => {
    const facturas = tabValue === 0 ? facturasNormalesEjemplo : facturasElectronicasEjemplo;
    
    return facturas.filter(factura => {
      const matchesSearch = 
        factura.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.cliente?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.cliente?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.pedido_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === '' || factura.estado?.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredFacturas = getFilteredFacturas();

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ color: 'white' }}>
          Gestión de Facturación
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Factura
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: '#2d3748', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#e53935',
            },
            '& .MuiTab-root': {
              color: '#a0aec0',
              '&.Mui-selected': {
                color: 'white',
              },
            },
          }}
        >
          <Tab 
            icon={<ReceiptIcon />} 
            iconPosition="start" 
            label="Facturas Normales" 
          />
          <Tab 
            icon={<ReceiptLongIcon />} 
            iconPosition="start" 
            label="Facturas Electrónicas" 
          />
        </Tabs>
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
          placeholder="Buscar por ID, cliente, email o pedido..."
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
          <MenuItem onClick={() => handleStatusFilterSelect('Enviada')}>
            <ListItemIcon>
              <Chip label="Enviada" color="info" size="small" variant="outlined" />
            </ListItemIcon>
            <ListItemText>Enviada</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterSelect('Pagada')}>
            <ListItemIcon>
              <Chip label="Pagada" color="success" size="small" variant="outlined" />
            </ListItemIcon>
            <ListItemText>Pagada</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterSelect('Vencida')}>
            <ListItemIcon>
              <Chip label="Vencida" color="error" size="small" variant="outlined" />
            </ListItemIcon>
            <ListItemText>Vencida</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterSelect('Anulada')}>
            <ListItemIcon>
              <Chip label="Anulada" color="error" size="small" variant="outlined" />
            </ListItemIcon>
            <ListItemText>Anulada</ListItemText>
          </MenuItem>
        </Menu>
      </Paper>

      <TabPanel value={tabValue} index={0}>
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
                  <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Nº Factura</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Fecha</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Cliente</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Pedido</TableCell>
                  <TableCell align="right" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Total</TableCell>
                  <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Estado</TableCell>
                  <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFacturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      No se encontraron facturas.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFacturas.map((factura) => (
                    <TableRow 
                      key={factura.id} 
                      hover
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(255, 255, 255, 0.04)' 
                        }
                      }}
                    >
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {factura.id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        {formatDate(factura.fecha)}
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        <Typography variant="body2">
                          {factura.cliente.nombre} {factura.cliente.apellidos}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          {factura.cliente.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        <Typography variant="body2">
                          {factura.pedido_id}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {formatPrice(factura.total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                        <FacturaStatus status={factura.estado} />
                      </TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(factura)}
                              size="small"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Imprimir">
                            <IconButton
                              color="primary"
                              size="small"
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Más acciones">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, factura)}
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
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
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
                  <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Nº Factura</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Fecha</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Cliente</TableCell>
                  <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>NIF</TableCell>
                  <TableCell align="right" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Total</TableCell>
                  <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Estado</TableCell>
                  <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFacturas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                      No se encontraron facturas electrónicas.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFacturas.map((factura) => (
                    <TableRow 
                      key={factura.id} 
                      hover
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(255, 255, 255, 0.04)' 
                        }
                      }}
                    >
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {factura.id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        {formatDate(factura.fecha)}
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        <Typography variant="body2">
                          {factura.cliente.nombre} {factura.cliente.apellidos}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                          {factura.cliente.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        <Typography variant="body2">
                          {factura.cliente.nif}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {formatPrice(factura.total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                        <FacturaStatus status={factura.estado} />
                      </TableCell>
                      <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(factura)}
                              size="small"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Descargar XML">
                            <IconButton
                              color="primary"
                              size="small"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Más acciones">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, factura)}
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
      </TabPanel>

      {/* Menú de acciones para cada factura */}
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
          handleOpenDialog(selectedFactura);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Editar factura</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PrintIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Imprimir factura</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SendIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Enviar por email</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Descargar PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteFactura}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogo para crear/editar factura */}
      <FacturaDialog
        open={openDialog}
        onClose={handleCloseDialog}
        factura={currentFactura}
        tipoFactura={tabValue === 0 ? 'Normal' : 'Electrónica'}
      />
    </>
  );
};

export default FacturacionList;
