import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import DashboardStats from './DashboardStats';
import RecentSales from './RecentSales';
import SalesChart from './SalesChart';
import StockBajo from './StockBajo';

export const Dashboard = () => {
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'medium', mb: 0 }}>
          Dashboard
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ color: '#a0aec0', mb: 3 }}>
        Bienvenido al panel de administración de El Pelotazo
      </Typography>
      
      {/* Estadísticas principales */}
      <DashboardStats />
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Ventas recientes */}
        <Grid item xs={12} lg={7}>
          <RecentSales />
        </Grid>
        
        {/* Stock bajo */}
        <Grid item xs={12} lg={5}>
          <StockBajo />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
