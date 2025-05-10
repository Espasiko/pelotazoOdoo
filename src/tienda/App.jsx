import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../theme';

// Componentes de la tienda (se implementarán más adelante)
const Header = () => (
  <header style={{ background: '#e53935', color: 'white', padding: '20px', textAlign: 'center' }}>
    <h1>El Pelotazo</h1>
    <p>Los mejores electrodomésticos al mejor precio</p>
  </header>
);

const Footer = () => (
  <footer style={{ background: '#1e2a38', color: 'white', padding: '20px', textAlign: 'center', marginTop: '20px' }}>
    <p>© {new Date().getFullYear()} El Pelotazo - Todos los derechos reservados</p>
    <p>Roquetas de Mar, España</p>
  </footer>
);

// Páginas de la tienda (se implementarán más adelante)
const HomePage = () => (
  <div style={{ padding: '20px' }}>
    <div style={{ background: '#e53935', color: 'white', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
      <h1>Los mejores electrodomésticos al mejor precio</h1>
      <p>Encuentra nuestro amplio catálogo de electrodomésticos y productos para el hogar.</p>
      <button style={{ background: 'white', color: '#e53935', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', marginTop: '10px' }}>
        Ver Catálogo
      </button>
    </div>
    
    <h2 style={{ textAlign: 'center', margin: '30px 0' }}>¿Por qué elegir El Pelotazo?</h2>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
      <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>Mejores precios</h3>
        <p>Ofrecemos los precios más competitivos del mercado.</p>
      </div>
      <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>Calidad garantizada</h3>
        <p>Todos nuestros productos cuentan con garantía oficial.</p>
      </div>
      <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>Envío gratuito</h3>
        <p>Envío e instalación gratis hasta 15km de Roquetas de Mar.</p>
      </div>
      <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>Financiación</h3>
        <p>Posibilidad de financiación con Santander y Pepper.</p>
      </div>
    </div>
    
    <h2 style={{ textAlign: 'center', margin: '30px 0' }}>Nuestras categorías</h2>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>Electrodomésticos</h3>
      </div>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>Televisores</h3>
      </div>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>Informática</h3>
      </div>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>Móviles</h3>
      </div>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>TV y Audio</h3>
      </div>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
        <h3>Cocina</h3>
      </div>
    </div>
    
    <h2 style={{ textAlign: 'center', margin: '30px 0' }}>Productos destacados</h2>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
      <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
        <h3>Frigorífico Smart KGBD</h3>
        <p>599,99 €</p>
        <button style={{ background: '#e53935', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold' }}>
          Reservar
        </button>
      </div>
      <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
        <h3>Televisor 4K Ultra HD 55"</h3>
        <p>499,99 €</p>
        <button style={{ background: '#e53935', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold' }}>
          Reservar
        </button>
      </div>
      <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
        <h3>Cafetera Automática</h3>
        <p>299,99 €</p>
        <button style={{ background: '#e53935', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold' }}>
          Reservar
        </button>
      </div>
    </div>
  </div>
);

const CatalogoPage = () => <div>Catálogo de Productos</div>;
const ProductoPage = () => <div>Detalle de Producto</div>;
const CarritoPage = () => <div>Carrito de Compra</div>;
const CheckoutPage = () => <div>Proceso de Reserva</div>;
const FinanciacionPage = () => <div>Opciones de Financiación</div>;

// Componente principal de la tienda
const TiendaApp = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/producto/:id" element={<ProductoPage />} />
            <Route path="/carrito" element={<CarritoPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/financiacion" element={<FinanciacionPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default TiendaApp;