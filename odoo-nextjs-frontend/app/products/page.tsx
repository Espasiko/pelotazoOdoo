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
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Productos de Odoo</h1>
      
      {/* Formulario para crear nuevo producto */}
      <div className="bg-white p-6 rounded-lg mb-8 shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Crear nuevo producto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Nombre:</label>
            <input
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Precio:</label>
            <input
              type="number"
              name="list_price"
              value={newProduct.list_price}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Código:</label>
            <input
              type="text"
              name="default_code"
              value={newProduct.default_code}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium shadow-sm"
            disabled={createProduct.isPending}
          >
            {createProduct.isPending ? 'Creando...' : 'Crear Producto'}
          </button>
        </form>
      </div>

      {/* Lista de productos */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products && products.map((product: any, index: number) => (
              <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.list_price} €</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.default_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded font-medium"
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
