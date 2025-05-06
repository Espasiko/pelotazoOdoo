import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { formatPrice } from '../utils/formatters';

/**
 * Componente para mostrar la tabla de productos
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.productos - Lista de productos a mostrar
 * @param {Function} props.onEdit - Función para editar un producto
 * @param {Function} props.onDelete - Función para eliminar un producto
 * @returns {JSX.Element} - Componente de tabla de productos
 */
const ProductoTable = ({ productos, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Imagen</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Marca</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell align="right">Precio</TableCell>
            <TableCell align="right">Stock</TableCell>
            <TableCell align="center">Estado</TableCell>
            <TableCell align="center">Destacado</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {productos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                No se encontraron productos.
              </TableCell>
            </TableRow>
          ) : (
            productos.map((producto) => (
              <TableRow key={producto.id} hover>
                <TableCell>
                  {producto.imagen ? (
                    <Box
                      component="img"
                      src={`http://localhost:8092/api/files/productos/${producto.id}/${producto.imagen}`}
                      alt={producto.nombre}
                      sx={{ width: 50, height: 50, objectFit: 'contain' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        backgroundColor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Sin imagen
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {producto.nombre}
                  </Typography>
                  {producto.codigo_barras && (
                    <Typography variant="caption" color="text.secondary">
                      Código: {producto.codigo_barras}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{producto.marca?.nombre || '-'}</TableCell>
                <TableCell>{producto.categoria?.nombre || '-'}</TableCell>
                <TableCell align="right">{formatPrice(producto.precio)}</TableCell>
                <TableCell align="right">{producto.stock}</TableCell>
                <TableCell align="center">
                  <Chip
                    icon={producto.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    label={producto.visible ? 'Visible' : 'Oculto'}
                    color={producto.visible ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {producto.destacado ? (
                    <Tooltip title="Producto destacado">
                      <StarIcon color="warning" />
                    </Tooltip>
                  ) : (
                    <Tooltip title="No destacado">
                      <StarBorderIcon color="disabled" />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Tooltip title="Editar">
                      <IconButton
                        color="primary"
                        onClick={() => onEdit(producto)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        color="error"
                        onClick={() => onDelete(producto)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductoTable;
