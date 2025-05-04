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

  switch (status.toLowerCase()) {
    case 'completado':
      color = 'success';
      break;
    case 'pendiente':
      color = 'warning';
      break;
    case 'cancelado':
      color = 'error';
      break;
    case 'en proceso':
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
    />
  );
};

export const RecentSales = () => {
  // Datos de ejemplo, en una implementación real estos vendrían de la API
  const recentOrders = [
    {
      id: 'ORD-001',
      customer: 'Cliente 1',
      date: '2025-04-28',
      amount: 245.50,
      status: 'Completado',
      products: 3
    },
    {
      id: 'ORD-002',
      customer: 'Cliente 2',
      date: '2025-04-28',
      amount: 89.99,
      status: 'Pendiente',
      products: 1
    },
    {
      id: 'ORD-003',
      customer: 'Cliente 3',
      date: '2025-04-27',
      amount: 320.75,
      status: 'En Proceso',
      products: 4
    },
    {
      id: 'ORD-004',
      customer: 'Cliente 4',
      date: '2025-04-27',
      amount: 157.30,
      status: 'Completado',
      products: 2
    },
    {
      id: 'ORD-005',
      customer: 'Cliente 5',
      date: '2025-04-26',
      amount: 450.00,
      status: 'Cancelado',
      products: 5
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
          Ventas Recientes
        </Typography>
        <Typography variant="body2" sx={{ color: '#a0aec0', mt: 0.5 }}>
          Últimas 10 transacciones
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>ID</TableCell>
              <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Cliente</TableCell>
              <TableCell sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Productos</TableCell>
              <TableCell align="right" sx={{ color: '#a0aec0', borderBottom: '1px solid #2d3748', fontWeight: 'medium' }}>Importe</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentOrders.map((order) => (
              <TableRow 
                key={order.id} 
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
                  {order.id}
                </TableCell>
                <TableCell 
                  sx={{ 
                    color: 'white', 
                    borderBottom: '1px solid #2d3748'
                  }}
                >
                  {order.customer}
                </TableCell>
                <TableCell 
                  sx={{ 
                    color: 'white', 
                    borderBottom: '1px solid #2d3748'
                  }}
                >
                  {order.products}
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: 'white', 
                    borderBottom: '1px solid #2d3748'
                  }}
                >
                  {formatPrice(order.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default RecentSales;
