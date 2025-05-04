import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, change, icon, color, iconColor }) => {
  const isPositive = change >= 0;
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        backgroundColor: '#1e2a38',
        color: 'white',
        border: '1px solid #2d3748'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'medium', color: '#a0aec0', fontSize: '0.9rem' }}>
            {title}
          </Typography>
          <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', my: 1, color: 'white' }}>
            {value}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isPositive ? (
              <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5, color: '#4caf50' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, mr: 0.5, color: '#f44336' }} />
            )}
            <Typography variant="body2" component="span" sx={{ 
              color: isPositive ? '#4caf50' : '#f44336',
              fontWeight: 'medium'
            }}>
              {isPositive ? '+' : ''}{change}% desde ayer
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: '12px',
            backgroundColor: iconColor || '#e53935',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
};

export const DashboardStats = () => {
  // Datos de ejemplo, en una implementación real estos vendrían de la API
  const stats = [
    {
      title: 'Ventas Hoy',
      value: '8',
      change: 12.5,
      icon: <ShoppingCartIcon sx={{ color: 'white' }} />,
      iconColor: '#e53935'
    },
    {
      title: 'Clientes Nuevos',
      value: '3',
      change: 50.0,
      icon: <PeopleIcon sx={{ color: 'white' }} />,
      iconColor: '#3f51b5'
    },
    {
      title: 'Productos',
      value: '124',
      change: 2.5,
      icon: <InventoryIcon sx={{ color: 'white' }} />,
      iconColor: '#9c27b0'
    },
    {
      title: 'Entregas',
      value: '5',
      change: -2.5,
      icon: <LocalShippingIcon sx={{ color: 'white' }} />,
      iconColor: '#ff9800'
    }
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardStats;
