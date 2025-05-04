import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TestPage = () => {
  return (
    <Box sx={{ padding: 2 }}>
      <Paper sx={{ padding: 3, backgroundColor: '#1E293B', color: '#fff' }}>
        <Typography variant="h4" gutterBottom>
          Página de Prueba
        </Typography>
        <Typography variant="body1">
          Esta es una página de prueba para verificar que las rutas funcionan correctamente.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TestPage;
