import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

// Definición de tipos para los productos
interface Product {
  id: number;
  name: string;
  price: number;
  x_nombre_proveedor?: string;
  x_marca?: string;
  default_code?: string;
  description?: string;
  image_url?: string;
}

export const ProductShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Obtener token del localStorage
        const token = localStorage.getItem("auth");
        if (!token) {
          setError("No hay token de autenticación");
          setIsLoading(false);
          return;
        }

        const parsedToken = JSON.parse(token);
        
        // Realizar la petición a la API de Odoo
        const response = await axios.get(`http://localhost:8000/api/v1/products/${id}`, {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
        });

        // Actualizar el estado con los datos recibidos
        setProduct(response.data.data || null);
      } catch (error) {
        console.error("Error al cargar el producto:", error);
        setError("Error al cargar el producto");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Producto no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-4">ID: {product.id}</p>
            </div>
            <a
              href="/products"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Volver a la lista
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <img
                src={"https://via.placeholder.com/300x300?text=" + encodeURIComponent(product.name)}
                alt={product.name}
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>

            <div className="space-y-4">
              <div className="border-b pb-2">
                <h2 className="text-xl font-semibold mb-2">Información básica</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600">Precio:</div>
                  <div className="font-medium">{product.price} €</div>
                  
                  <div className="text-gray-600">Descripción:</div>
                  <div className="font-medium">{product.description || 'Sin descripción'}</div>
                </div>
              </div>

              <div className="border-b pb-2">
                <h2 className="text-xl font-semibold mb-2">Proveedor y marca</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600">Proveedor:</div>
                  <div className="font-medium">{product.x_nombre_proveedor}</div>
                  
                  <div className="text-gray-600">Marca:</div>
                  <div className="font-medium">{product.x_marca}</div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Información adicional</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600">ID en el sistema:</div>
                  <div className="font-medium">{product.id}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <a
              href="/products"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 mr-2"
            >
              Cancelar
            </a>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => alert('Funcionalidad de edición no implementada aún')}
            >
              Editar producto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductShow;
