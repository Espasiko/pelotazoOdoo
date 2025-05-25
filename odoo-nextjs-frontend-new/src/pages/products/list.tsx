import React from "react";
import { useTable } from "@refinedev/core";

export const ProductList: React.FC = () => {
  const {
    tableQueryResult: { data, isLoading },
    current,
    setCurrent,
    pageCount,
  } = useTable({
    resource: "products",
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Nombre</th>
                <th className="py-2 px-4 border-b">Precio</th>
                <th className="py-2 px-4 border-b">Proveedor</th>
                <th className="py-2 px-4 border-b">Marca</th>
                <th className="py-2 px-4 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{product.id}</td>
                  <td className="py-2 px-4 border-b">{product.name}</td>
                  <td className="py-2 px-4 border-b">{product.price} €</td>
                  <td className="py-2 px-4 border-b">{product.x_nombre_proveedor || 'No especificado'}</td>
                  <td className="py-2 px-4 border-b">{product.x_marca || 'No especificada'}</td>
                  <td className="py-2 px-4 border-b">
                    <a 
                      href={`/products/${product.id}`} 
                      className="text-blue-500 hover:underline"
                    >
                      Ver detalles
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Paginación */}
      <div className="flex justify-center mt-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrent(current - 1)}
            disabled={current === 1}
            className={`px-3 py-1 rounded ${
              current === 1 
                ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Anterior
          </button>
          <span className="px-3 py-1 bg-gray-100 rounded">
            Página {current} de {pageCount}
          </span>
          <button
            onClick={() => setCurrent(current + 1)}
            disabled={current === pageCount}
            className={`px-3 py-1 rounded ${
              current === pageCount 
                ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
