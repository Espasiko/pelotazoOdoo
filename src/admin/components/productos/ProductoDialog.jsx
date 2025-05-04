import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  InputAdornment,
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useCreate, useUpdate, useList } from '@refinedev/core';

// Componente para mostrar pestañas
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`producto-tabpanel-${index}`}
      aria-labelledby={`producto-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

export const ProductoDialog = ({ open, onClose, producto }) => {
  const isEditing = !!producto;
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    descripcion_seo: '',
    precio: '',
    marca_id: '',
    categoria_id: '',
    stock: '',
    visible: true,
    destacado: false,
    codigo_barras: '',
    imagen: null,
    imagen_file: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Hooks para crear y actualizar productos
  const { mutate: createProducto } = useCreate();
  const { mutate: updateProducto } = useUpdate();

  // Obtener marcas
  const { data: marcasData } = useList({
    resource: 'marcas',
  });

  // Obtener categorías
  const { data: categoriasData } = useList({
    resource: 'categorias',
  });

  // Inicializar formulario con datos del producto si estamos editando
  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        descripcion_seo: producto.descripcion_seo || '',
        precio: producto.precio || '',
        marca_id: producto.marca_id || '',
        categoria_id: producto.categoria_id || '',
        stock: producto.stock || '',
        visible: producto.visible !== undefined ? producto.visible : true,
        destacado: producto.destacado || false,
        codigo_barras: producto.codigo_barras || '',
        imagen: producto.imagen || null,
        imagen_file: null
      });

      // Configurar vista previa de imagen si existe
      if (producto.imagen) {
        setImagePreview(`http://localhost:8092/api/files/productos/${producto.id}/${producto.imagen}`);
      } else {
        setImagePreview(null);
      }
    } else {
      // Resetear formulario para nuevo producto
      setFormData({
        nombre: '',
        descripcion: '',
        descripcion_seo: '',
        precio: '',
        marca_id: '',
        categoria_id: '',
        stock: '',
        visible: true,
        destacado: false,
        codigo_barras: '',
        imagen: null,
        imagen_file: null
      });
      setImagePreview(null);
    }
    setTabValue(0);
  }, [producto, open]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        imagen_file: file,
        imagen: file.name
      });

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Eliminar imagen
  const handleDeleteImage = () => {
    setFormData({
      ...formData,
      imagen: null,
      imagen_file: null
    });
    setImagePreview(null);
  };

  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    // Crear FormData para enviar archivos
    const formDataToSend = new FormData();
    
    // Añadir todos los campos al FormData
    Object.keys(formData).forEach(key => {
      if (key !== 'imagen_file' && key !== 'imagen' && formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Añadir imagen si existe
    if (formData.imagen_file) {
      formDataToSend.append('imagen', formData.imagen_file);
    }

    if (isEditing) {
      // Actualizar producto existente
      updateProducto({
        resource: 'productos',
        id: producto.id,
        values: formDataToSend,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      // Crear nuevo producto
      createProducto({
        resource: 'productos',
        values: formDataToSend,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>
        <DialogContent>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Información Básica" />
            <Tab label="Descripción" />
            <Tab label="SEO" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  name="nombre"
                  label="Nombre del Producto"
                  value={formData.nombre}
                  onChange={handleChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="codigo_barras"
                  label="Código de Barras"
                  value={formData.codigo_barras}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="marca-label">Marca</InputLabel>
                  <Select
                    labelId="marca-label"
                    name="marca_id"
                    value={formData.marca_id}
                    onChange={handleChange}
                    label="Marca"
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {marcasData?.data.map((marca) => (
                      <MenuItem key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="categoria-label">Categoría</InputLabel>
                  <Select
                    labelId="categoria-label"
                    name="categoria_id"
                    value={formData.categoria_id}
                    onChange={handleChange}
                    label="Categoría"
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {categoriasData?.data.map((categoria) => (
                      <MenuItem key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="precio"
                  label="Precio"
                  value={formData.precio}
                  onChange={handleChange}
                  fullWidth
                  required
                  margin="normal"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="stock"
                  label="Stock"
                  value={formData.stock}
                  onChange={handleChange}
                  fullWidth
                  required
                  margin="normal"
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.visible}
                      onChange={handleChange}
                      name="visible"
                      color="primary"
                    />
                  }
                  label="Visible en tienda"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.destacado}
                      onChange={handleChange}
                      name="destacado"
                      color="primary"
                    />
                  }
                  label="Producto destacado"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Imagen del Producto
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<PhotoCameraIcon />}
                  >
                    Subir Imagen
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  {imagePreview && (
                    <IconButton 
                      color="error" 
                      onClick={handleDeleteImage}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                {imagePreview && (
                  <Box 
                    sx={{ 
                      mt: 2, 
                      maxWidth: 200,
                      maxHeight: 200,
                      overflow: 'hidden',
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      p: 1
                    }}
                  >
                    <img 
                      src={imagePreview} 
                      alt="Vista previa" 
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain'
                      }} 
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TextField
              name="descripcion"
              label="Descripción del Producto"
              value={formData.descripcion}
              onChange={handleChange}
              fullWidth
              multiline
              rows={10}
              margin="normal"
              helperText="Descripción detallada del producto que se mostrará en la tienda"
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TextField
              name="descripcion_seo"
              label="Descripción SEO"
              value={formData.descripcion_seo}
              onChange={handleChange}
              fullWidth
              multiline
              rows={6}
              margin="normal"
              helperText="Descripción optimizada para motores de búsqueda (150-160 caracteres recomendados)"
            />
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductoDialog;
