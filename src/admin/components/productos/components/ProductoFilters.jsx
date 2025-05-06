import React from 'react';
import {
  Paper,
  TextField,
  InputAdornment,
  Box
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

/**
 * Componente para filtrar productos
 * @param {Object} props - Propiedades del componente
 * @param {string} props.searchTerm - Término de búsqueda
 * @param {Function} props.setSearchTerm - Función para actualizar el término de búsqueda
 * @returns {JSX.Element} - Componente de filtros de productos
 */
const ProductoFilters = ({ searchTerm, setSearchTerm }) => {
  return (
    <Paper sx={{ mb: 3, p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre o código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Paper>
  );
};

export default ProductoFilters;
