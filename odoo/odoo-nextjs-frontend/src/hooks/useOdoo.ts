import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import odooService from '../services/odooService';

// Crear un cliente de consulta para React Query
export const queryClient = new QueryClient();

// Hook para obtener productos
export function useProducts(limit: number = 50, offset: number = 0, category?: string) {
  return useQuery({
    queryKey: ['products', limit, offset, category],
    queryFn: () => odooService.getProducts(limit, offset, category),
  });
}

// Hook para obtener un producto específico
export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => odooService.getProduct(id),
    enabled: !!id, // Solo ejecutar si hay un ID válido
  });
}

// Hook para crear un producto
export function useCreateProduct() {
  return useMutation({
    mutationFn: (productData: any) => odooService.createProduct(productData),
    onSuccess: () => {
      // Invalidar consultas para actualizar datos
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Hook para actualizar un producto
export function useUpdateProduct() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      odooService.updateProduct(id, data),
    onSuccess: (_, variables) => {
      // Invalidar consultas para actualizar datos
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}

// Hook para eliminar un producto
export function useDeleteProduct() {
  return useMutation({
    mutationFn: (id: number) => odooService.deleteProduct(id),
    onSuccess: () => {
      // Invalidar consultas para actualizar datos
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Hook para obtener clientes/partners
export function usePartners(limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: ['partners', limit, offset],
    queryFn: () => odooService.getPartners(limit, offset),
  });
}

// Hook para obtener órdenes de venta
export function useOrders(limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: ['orders', limit, offset],
    queryFn: () => odooService.getOrders(limit, offset),
  });
}
