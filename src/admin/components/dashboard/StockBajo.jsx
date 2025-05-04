import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box
} from '@mui/material';

// Componente para mostrar el estado del stock
const StockStatus = ({ status }) => {
  let color = 'default';
  let label = status;

  switch (status.toLowerCase()) {
    case 'crítico':
      color = 'error';
      break;
    case 'bajo':
      color = 'warning';
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
    />
  );
};

export const StockBajo = () => {
  // Datos de ejemplo, en una implementación real estos vendrían de la API
  const productosStockBajo = [
    {
      id: 1,
      nombre: 'Batidora KitchenAid',
      stock: 2,
      estado: 'Crítico'
    },
    {
      id: 2,
      nombre: 'Microondas Daewoo',
      stock: 3,
      estado: 'Bajo'
    },
    {
      id: 3,
      nombre: 'Horno Bosch Serie 4',
      stock: 1,
      estado: 'Crítico'
    },
    {
      id: 4,
      nombre: 'Cafetera Nespresso',
      stock: 4,
      estado: 'Bajo'
    },
    {
      id: 5,
      nombre: 'Tostadora Philips',
      stock: 2,
      estado: 'Crítico'
    }
  ];

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        backgroundColor: '#1e2a38',
        border: '1px solid #2d3748',
        height: '100%'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #2d3748' }}>
        <Typography variant="h6" component="h3" sx={{ color: 'white', fontWeight: 'medium' }}>
          Stock Bajo
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0', mt: 0.5 }}>
          Productos que necesitan reposición
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Producto</TableCell>
              <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Stock</TableCell>
              <TableCell align="center" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productosStockBajo.map((producto) => (
              <TableRow 
                key={producto.id} 
                hover
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 255, 255, 0.04)' 
                  },
                  '&:last-child td, &:last-child th': { 
                    borderBottom: 0 
                  }
                }}
              >
                <TableCell 
                  component="th" 
                  scope="row"
                  sx={{ 
                    color: 'white', 
                    borderBottom: '1px solid #2d3748'
                  }}
                >
                  {producto.nombre}
                </TableCell>
                <TableCell 
                  align="center"
                  sx={{ 
                    color: 'white', 
                    borderBottom: '1px solid #2d3748'
                  }}
                >
                  {producto.stock}
                </TableCell>
                <TableCell 
                  align="center"
                  sx={{ 
                    borderBottom: '1px solid #2d3748'
                  }}
                >
                  <StockStatus status={producto.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default StockBajo;
