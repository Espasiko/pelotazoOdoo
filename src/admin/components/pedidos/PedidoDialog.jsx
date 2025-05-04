import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Tabs,
  Tab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { useCreate, useUpdate, useList } from '@refinedev/core';

// Función para formatear precios
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pedido-tabpanel-${index}`}
      aria-labelledby={`pedido-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export const PedidoDialog = ({ open, onClose, pedido }) => {
  const isEditing = !!pedido;
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    cliente_id: '',
    estado: 'Pendiente',
    metodo_pago: '',
    direccion_envio: '',
    notas: '',
    items: []
  });
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [newItem, setNewItem] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: 0
  });

  // Hooks para crear y actualizar pedidos
  const { mutate: createPedido } = useCreate();
  const { mutate: updatePedido } = useUpdate();

  // Obtener lista de clientes
  const { data: clientesData } = useList({
    resource: 'clientes',
  });

  // Obtener lista de productos
  const { data: productosData } = useList({
    resource: 'productos',
  });

  // Inicializar datos cuando se abre el diálogo
  useEffect(() => {
    if (clientesData) {
      setClientes(clientesData.data || []);
    }

    if (productosData) {
      setProductos(productosData.data || []);
    }

    if (pedido) {
      setFormData({
        cliente_id: pedido.cliente?.id || '',
        estado: pedido.estado || 'Pendiente',
        metodo_pago: pedido.metodo_pago || '',
        direccion_envio: pedido.direccion_envio || '',
        notas: pedido.notas || '',
        items: pedido.items || []
      });
    } else {
      // Resetear formulario para nuevo pedido
      setFormData({
        cliente_id: '',
        estado: 'Pendiente',
        metodo_pago: '',
        direccion_envio: '',
        notas: '',
        items: []
      });
    }

    // Resetear pestaña activa
    setTabValue(0);
  }, [pedido, open, clientesData, productosData]);

  // Cambiar pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en el nuevo ítem
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'producto_id') {
      const producto = productos.find(p => p.id === value);
      setNewItem({
        ...newItem,
        producto_id: value,
        precio_unitario: producto ? producto.precio : 0
      });
    } else {
      setNewItem({
        ...newItem,
        [name]: value
      });
    }
  };

  // Añadir ítem al pedido
  const handleAddItem = () => {
    if (!newItem.producto_id) return;

    const producto = productos.find(p => p.id === newItem.producto_id);
    
    const item = {
      ...newItem,
      producto: producto,
      subtotal: newItem.cantidad * newItem.precio_unitario
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    // Resetear nuevo ítem
    setNewItem({
      producto_id: '',
      cantidad: 1,
      precio_unitario: 0
    });
  };

  // Eliminar ítem del pedido
  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Calcular total del pedido
  const calcularTotal = () => {
    return formData.items.reduce((total, item) => total + (item.cantidad * item.precio_unitario), 0);
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    const pedidoData = {
      ...formData,
      total: calcularTotal()
    };

    if (isEditing) {
      // Actualizar pedido existente
      updatePedido({
        resource: 'pedidos',
        id: pedido.id,
        values: pedidoData,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      // Crear nuevo pedido
      createPedido({
        resource: 'pedidos',
        values: pedidoData,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  // Datos de ejemplo para clientes
  const clientesEjemplo = [
    { id: '1', nombre: 'Juan', apellidos: 'Pérez', email: 'juan@example.com' },
    { id: '2', nombre: 'María', apellidos: 'López', email: 'maria@example.com' },
    { id: '3', nombre: 'Carlos', apellidos: 'Rodríguez', email: 'carlos@example.com' },
    { id: '4', nombre: 'Ana', apellidos: 'Martínez', email: 'ana@example.com' },
    { id: '5', nombre: 'Pedro', apellidos: 'Sánchez', email: 'pedro@example.com' }
  ];

  // Datos de ejemplo para productos
  const productosEjemplo = [
    { id: '1', nombre: 'Frigorífico Samsung RT38', precio: 899.99 },
    { id: '2', nombre: 'Televisor LG 43UQ75', precio: 499.50 },
    { id: '3', nombre: 'Microondas Cecotec ProClean 6010', precio: 89.99 },
    { id: '4', nombre: 'Lavadora Balay 3TS992B', precio: 449.00 },
    { id: '5', nombre: 'Cafetera Delonghi Magnifica', precio: 329.99 }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          backgroundColor: '#1e2a38',
          color: 'white',
          border: '1px solid #2d3748',
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? `Editar Pedido: ${pedido?.id}` : 'Nuevo Pedido'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: '#2d3748' }}>
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
              <Tab label="Información General" icon={<PersonIcon />} iconPosition="start" />
              <Tab label="Productos" icon={<CartIcon />} iconPosition="start" />
              <Tab label="Envío y Pago" icon={<ShippingIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Pestaña de Información General */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="cliente-label" sx={{ color: '#a0aec0' }}>Cliente</InputLabel>
                  <Select
                    labelId="cliente-label"
                    name="cliente_id"
                    value={formData.cliente_id}
                    onChange={handleChange}
                    required
                    sx={{
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
                      '& .MuiSvgIcon-root': {
                        color: 'white',
                      }
                    }}
                  >
                    <MenuItem value="" disabled>Seleccione un cliente</MenuItem>
                    {clientesEjemplo.map((cliente) => (
                      <MenuItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre} {cliente.apellidos} ({cliente.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="estado-label" sx={{ color: '#a0aec0' }}>Estado del pedido</InputLabel>
                  <Select
                    labelId="estado-label"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    required
                    sx={{
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
                      '& .MuiSvgIcon-root': {
                        color: 'white',
                      }
                    }}
                  >
                    <MenuItem value="Pendiente">Pendiente</MenuItem>
                    <MenuItem value="En Proceso">En Proceso</MenuItem>
                    <MenuItem value="Enviado">Enviado</MenuItem>
                    <MenuItem value="Completado">Completado</MenuItem>
                    <MenuItem value="Cancelado">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notas"
                  label="Notas adicionales"
                  value={formData.notas}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  InputProps={{
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
                  InputLabelProps={{
                    sx: { color: '#a0aec0' }
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Pestaña de Productos */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid #2d3748',
                    mb: 2
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <FormControl fullWidth>
                        <InputLabel id="producto-label" sx={{ color: '#a0aec0' }}>Producto</InputLabel>
                        <Select
                          labelId="producto-label"
                          name="producto_id"
                          value={newItem.producto_id}
                          onChange={handleNewItemChange}
                          sx={{
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
                            '& .MuiSvgIcon-root': {
                              color: 'white',
                            }
                          }}
                        >
                          <MenuItem value="" disabled>Seleccione un producto</MenuItem>
                          {productosEjemplo.map((producto) => (
                            <MenuItem key={producto.id} value={producto.id}>
                              {producto.nombre} - {formatPrice(producto.precio)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        name="cantidad"
                        label="Cantidad"
                        type="number"
                        value={newItem.cantidad}
                        onChange={handleNewItemChange}
                        fullWidth
                        InputProps={{
                          inputProps: { min: 1 },
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
                        InputLabelProps={{
                          sx: { color: '#a0aec0' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        name="precio_unitario"
                        label="Precio unitario"
                        type="number"
                        value={newItem.precio_unitario}
                        onChange={handleNewItemChange}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start">€</InputAdornment>,
                          inputProps: { min: 0, step: 0.01 },
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
                        InputLabelProps={{
                          sx: { color: '#a0aec0' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddItem}
                        disabled={!newItem.producto_id}
                        sx={{ height: '100%', minWidth: '100%' }}
                      >
                        <AddIcon />
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <TableContainer component={Paper} 
                  sx={{ 
                    backgroundColor: '#1e2a38',
                    border: '1px solid #2d3748',
                  }}
                  elevation={0}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                        <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748' }}>Producto</TableCell>
                        <TableCell align="right" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748' }}>Precio</TableCell>
                        <TableCell align="right" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748' }}>Cantidad</TableCell>
                        <TableCell align="right" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748' }}>Subtotal</TableCell>
                        <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748' }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                            No hay productos en el pedido
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.items.map((item, index) => {
                          const producto = productosEjemplo.find(p => p.id === item.producto_id) || item.producto;
                          return (
                            <TableRow key={index}>
                              <TableCell sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                                {producto?.nombre || 'Producto no encontrado'}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                                {formatPrice(item.precio_unitario)}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                                {item.cantidad}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'white', borderBottom: '1px solid #2d3748' }}>
                                {formatPrice(item.cantidad * item.precio_unitario)}
                              </TableCell>
                              <TableCell align="center" sx={{ borderBottom: '1px solid #2d3748' }}>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleRemoveItem(index)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid #2d3748',
                  mt: 2,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Total: {formatPrice(calcularTotal())}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Pestaña de Envío y Pago */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#a0aec0', display: 'flex', alignItems: 'center' }}>
                  <ShippingIcon sx={{ mr: 1 }} />
                  Información de Envío
                </Typography>
                <TextField
                  name="direccion_envio"
                  label="Dirección de envío"
                  value={formData.direccion_envio}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  InputProps={{
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
                  InputLabelProps={{
                    sx: { color: '#a0aec0' }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2, backgroundColor: '#2d3748' }} />
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#a0aec0', display: 'flex', alignItems: 'center' }}>
                  <PaymentIcon sx={{ mr: 1 }} />
                  Información de Pago
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="metodo-pago-label" sx={{ color: '#a0aec0' }}>Método de pago</InputLabel>
                  <Select
                    labelId="metodo-pago-label"
                    name="metodo_pago"
                    value={formData.metodo_pago}
                    onChange={handleChange}
                    required
                    sx={{
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
                      '& .MuiSvgIcon-root': {
                        color: 'white',
                      }
                    }}
                  >
                    <MenuItem value="" disabled>Seleccione un método de pago</MenuItem>
                    <MenuItem value="Tarjeta">Tarjeta de crédito/débito</MenuItem>
                    <MenuItem value="PayPal">PayPal</MenuItem>
                    <MenuItem value="Transferencia">Transferencia bancaria</MenuItem>
                    <MenuItem value="Contra reembolso">Contra reembolso</MenuItem>
                    <MenuItem value="Bizum">Bizum</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PedidoDialog;
