import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';

/**
 * Diálogo de confirmación para eliminar productos
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.open - Estado de apertura del diálogo
 * @param {Function} props.onClose - Función para cerrar el diálogo
 * @param {Function} props.onConfirm - Función para confirmar la eliminación
 * @param {Object} props.producto - Producto a eliminar
 * @returns {JSX.Element} - Componente de diálogo de confirmación
 */
const DeleteConfirmDialog = ({ open, onClose, onConfirm, producto }) => {
  if (!producto) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Confirmar eliminación
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          ¿Estás seguro de que deseas eliminar el producto "{producto.nombre}"? Esta acción no se puede deshacer.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error" autoFocus>
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
