import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, Product } from '../services/inventoryService';
import { useCart } from '../context/CartContext';
import CartSidebar from '../components/CartSidebar';

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-page">
      <nav className="dashboard-nav">
        <div className="nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
            <rect width="32" height="32" rx="8" fill="url(#nav-grad-shop)" />
            <path d="M10 13L16 9L22 13V19L16 25L10 19V13Z" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M16 9V25" stroke="white" strokeWidth="1.5" />
            <defs>
              <linearGradient id="nav-grad-shop" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span>InstaBuy Shop</span>
        </div>
        <div className="nav-actions">
          <button className="cart-toggle-btn" onClick={() => setIsCartOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            Dashboard
          </button>
        </div>
      </nav>

      <main className="shop-content">
        <div className="shop-header">
          <h1>Premium Collection</h1>
          <p>Discover our exclusive range of high-quality products.</p>
        </div>

        {loading ? (
          <div className="loading-screen">
             <div className="spinner"></div>
             <p>Loading inventory...</p>
          </div>
        ) : error ? (
          <div className="error-message mx-auto" style={{ maxWidth: '600px' }}>{error}</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <h3>No products available</h3>
            <p>Check back later for new arrivals!</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div key={product.productCode} className="product-card">
                <div className="product-card-img">
                  <img src={product.imageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="0" fill="%23233145"/><path d="M12 26l6-7 4 4 3-3 3 6H12z" fill="%23d5d9e2"/><circle cx="15" cy="15" r="3" fill="%23d5d9e2"/></svg>'} alt={product.name} />
                  {product.stock <= 0 && <span className="out-of-stock-badge">Out of Stock</span>}
                </div>
                <div className="product-card-body">
                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-desc-line">{product.description}</p>
                  <div className="product-footer">
                    <span className="product-price">₹{product.price.toFixed(2)}</span>
                    <button 
                      className="btn-primary btn-sm add-cart-btn"
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock <= 0 ? 'Unavailable' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Shop;
