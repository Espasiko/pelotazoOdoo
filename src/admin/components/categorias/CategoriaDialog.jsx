import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useCreate, useUpdate } from '@refinedev/core';

export const CategoriaDialog = ({ open, onClose, categoria }) => {
  const isEditing = !!categoria;
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    visible: true,
    imagen: null,
    imagen_file: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Hooks para crear y actualizar categorías
  const { mutate: createCategoria } = useCreate();
  const { mutate: updateCategoria } = useUpdate();

  // Inicializar formulario con datos de la categoría si estamos editando
  useEffect(() => {
    if (categoria) {
      setFormData({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || '',
        visible: categoria.visible !== undefined ? categoria.visible : true,
        imagen: categoria.imagen || null,
        imagen_file: null
      });

      // Configurar vista previa de imagen si existe
      if (categoria.imagen) {
        setImagePreview(`http://localhost:8092/api/files/categorias/${categoria.id}/${categoria.imagen}`);
      } else {
        setImagePreview(null);
      }
    } else {
      // Resetear formulario para nueva categoría
      setFormData({
        nombre: '',
        descripcion: '',
        visible: true,
        imagen: null,
        imagen_file: null
      });
      setImagePreview(null);
    }
  }, [categoria, open]);

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
      // Actualizar categoría existente
      updateCategoria({
        resource: 'categorias',
        id: categoria.id,
        values: formDataToSend,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      // Crear nueva categoría
      createCategoria({
        resource: 'categorias',
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
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        </DialogTitle>
        <DialogContent>
          <TextField
            name="nombre"
            label="Nombre de la Categoría"
            value={formData.nombre}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
          />
          
          <TextField
            name="descripcion"
            label="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            margin="normal"
            helperText="Descripción breve de la categoría"
          />
          
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
            sx={{ mt: 2 }}
          />
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Imagen de la Categoría
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
          </Box>
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

export default CategoriaDialog;
