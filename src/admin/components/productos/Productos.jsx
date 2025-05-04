import React from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import ProductosList from './ProductosList';

export const Productos = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Productos
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gestiona el catálogo de productos de la tienda. Puedes añadir, editar, eliminar y organizar productos.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Listado de Productos" />
          <Tab label="Importar Productos" disabled />
          <Tab label="Exportar Productos" disabled />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <ProductosList />
      )}
      {tabValue === 1 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">
            Importación de Productos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Esta funcionalidad estará disponible próximamente.
          </Typography>
        </Box>
      )}
      {tabValue === 2 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">
            Exportación de Productos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Esta funcionalidad estará disponible próximamente.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Productos;
