import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MarcasList from './MarcasList';

export const Marcas = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Marcas
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gestiona las marcas de productos disponibles en la tienda. Las marcas ayudan a los clientes a encontrar productos de fabricantes específicos.
      </Typography>

      <MarcasList />
    </Box>
  );
};

export default Marcas;
