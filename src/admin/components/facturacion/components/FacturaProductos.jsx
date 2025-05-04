import React from 'react';
import {
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// Función para formatear precios
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

const FacturaProductos = ({ 
  formData, 
  newItem, 
  productos, 
  handleNewItemChange, 
  handleAddItem, 
  handleRemoveItem,
  calcularTotal 
}) => {
  return (
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
                  {productos.map((producto) => (
                    <MenuItem key={producto.id} value={producto.id}>
                      {producto.nombre} - {formatPrice(producto.precio)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
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
            <Grid item xs={12} sm={2}>
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
                    No hay productos en la factura
                  </TableCell>
                </TableRow>
              ) : (
                formData.items.map((item, index) => {
                  const producto = productos.find(p => p.id === item.producto_id) || item.producto;
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
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            Base imponible: {formatPrice(calcularTotal() / 1.21)}
          </Typography>
          <Typography variant="body1" sx={{ color: '#a0aec0' }}>
            IVA (21%): {formatPrice(calcularTotal() - (calcularTotal() / 1.21))}
          </Typography>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Total: {formatPrice(calcularTotal())}
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default FacturaProductos;
