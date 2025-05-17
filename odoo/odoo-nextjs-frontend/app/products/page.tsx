'use client';

import { useState } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../src/hooks/useOdoo';

export default function ProductsPage() {
  const [newProduct, setNewProduct] = useState({
    name: '',
    list_price: 0,
    default_code: '',
  });

  // Obtener productos de Odoo
  const { data: products, isLoading, error } = useProducts(50, 0);

  // Mutaciones para crear, actualizar y eliminar productos
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: name === 'list_price' ? parseFloat(value) : value,
    });
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(newProduct, {
      onSuccess: () => {
        setNewProduct({ name: '', list_price: 0, default_code: '' });
      },
    });
  };

  // Manejar eliminación de producto
  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      deleteProduct.mutate(id);
    }
  };

  if (isLoading) return <div className="p-8">Cargando productos...</div>;
  if (error) return <div className="p-8">Error al cargar productos: {error.message}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Productos de Odoo</h1>
      
      {/* Formulario para crear nuevo producto */}
      <div className="bg-gray-100 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Crear nuevo producto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Nombre:</label>
            <input
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Precio:</label>
            <input
              type="number"
              name="list_price"
              value={newProduct.list_price}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Código:</label>
            <input
              type="text"
              name="default_code"
              value={newProduct.default_code}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={createProduct.isPending}
          >
            {createProduct.isPending ? 'Creando...' : 'Crear Producto'}
          </button>
        </form>
      </div>

      {/* Lista de productos */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products && products.map((product: any) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.list_price}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.default_code}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteProduct.isPending}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
