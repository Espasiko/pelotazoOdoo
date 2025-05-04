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

export const MarcaDialog = ({ open, onClose, marca }) => {
  const isEditing = !!marca;
  const [formData, setFormData] = useState({
    nombre: '',
    visible: true,
    logo: null,
    logo_file: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Hooks para crear y actualizar marcas
  const { mutate: createMarca } = useCreate();
  const { mutate: updateMarca } = useUpdate();

  // Inicializar formulario con datos de la marca si estamos editando
  useEffect(() => {
    if (marca) {
      setFormData({
        nombre: marca.nombre || '',
        visible: marca.visible !== undefined ? marca.visible : true,
        logo: marca.logo || null,
        logo_file: null
      });

      // Configurar vista previa de imagen si existe
      if (marca.logo) {
        setImagePreview(`http://localhost:8092/api/files/marcas/${marca.id}/${marca.logo}`);
      } else {
        setImagePreview(null);
      }
    } else {
      // Resetear formulario para nueva marca
      setFormData({
        nombre: '',
        visible: true,
        logo: null,
        logo_file: null
      });
      setImagePreview(null);
    }
  }, [marca, open]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Manejar cambio de logo
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        logo_file: file,
        logo: file.name
      });

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Eliminar logo
  const handleDeleteImage = () => {
    setFormData({
      ...formData,
      logo: null,
      logo_file: null
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
      if (key !== 'logo_file' && key !== 'logo' && formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Añadir logo si existe
    if (formData.logo_file) {
      formDataToSend.append('logo', formData.logo_file);
    }

    if (isEditing) {
      // Actualizar marca existente
      updateMarca({
        resource: 'marcas',
        id: marca.id,
        values: formDataToSend,
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      // Crear nueva marca
      createMarca({
        resource: 'marcas',
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
          {isEditing ? 'Editar Marca' : 'Nueva Marca'}
        </DialogTitle>
        <DialogContent>
          <TextField
            name="nombre"
            label="Nombre de la Marca"
            value={formData.nombre}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
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
              Logo de la Marca
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<PhotoCameraIcon />}
              >
                Subir Logo
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
                  maxHeight: 100,
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  p: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <img 
                  src={imagePreview} 
                  alt="Vista previa" 
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '100%',
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

export default MarcaDialog;
