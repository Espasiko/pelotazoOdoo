import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CategoriasList from './CategoriasList';

export const Categorias = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Categorías
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gestiona las categorías de productos para organizar el catálogo de la tienda. Las categorías ayudan a los clientes a encontrar productos relacionados.
      </Typography>

      <CategoriasList />
    </Box>
  );
};

export default Categorias;
