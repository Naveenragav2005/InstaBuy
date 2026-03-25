import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllProducts, addProduct, updateProduct, deleteProduct, Product } from '../services/inventoryService';
import { getAllSystemOrders, updateSystemOrderStatus, OrderResponse } from '../services/orderService';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  
  // Inventory State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);

  // Orders State
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchProducts();
    } else {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const data = await getAllSystemOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingCode(product.productCode);
      setName(product.name || '');
      setDescription(product.description || '');
      setImageUrl(product.imageUrl || '');
      setPrice(product.price || 0);
      setStock(product.stock || 0);
    } else {
      setEditingCode(null);
      setName('');
      setDescription('');
      setImageUrl('');
      setPrice(0);
      setStock(0);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCode) {
        await updateProduct(editingCode, { name, description, imageUrl, price, stock });
      } else {
        await addProduct({ name, description, imageUrl, price, stock });
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert('Failed to save product');
    }
  };

  const handleDelete = async (code: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(code);
        fetchProducts();
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await updateSystemOrderStatus(orderId, status);
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
            <rect width="32" height="32" rx="8" fill="url(#nav-grad-admin)" />
            <path d="M16 8L24 14V24H8V14L16 8Z" stroke="white" strokeWidth="1.5" fill="none" />
            <defs>
              <linearGradient id="nav-grad-admin" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#f43f5e" />
                <stop offset="1" stopColor="#e11d48" />
              </linearGradient>
            </defs>
          </svg>
          <span>InstaBuy Admin</span>
        </div>
        <div className="nav-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
             Back
          </button>
          <button onClick={logout} className="btn-logout">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-content" style={{ maxWidth: '1200px' }}>
        
        {/* TAB NAVIGATION */}
        <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => setActiveTab('inventory')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'inventory' ? '#f43f5e' : '#cbd5e1', 
              fontSize: '1.2rem', fontWeight: activeTab === 'inventory' ? 600 : 400, cursor: 'pointer',
              borderBottom: activeTab === 'inventory' ? '2px solid #f43f5e' : 'none'
            }}
          >
            Inventory Management
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'orders' ? '#f43f5e' : '#cbd5e1', 
              fontSize: '1.2rem', fontWeight: activeTab === 'orders' ? 600 : 400, cursor: 'pointer',
              borderBottom: activeTab === 'orders' ? '2px solid #f43f5e' : 'none'
            }}
          >
            Order Management
          </button>
        </div>

        {activeTab === 'inventory' ? (
          <>
            <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="welcome-text">
                <h1>Manage <span className="highlight">Products</span></h1>
                <p>Add, edit, or remove products across your entire architecture.</p>
              </div>
              <button className="btn-primary" onClick={() => handleOpenModal()} style={{ padding: '0.75rem 1.5rem', width: 'auto' }}>
                + Assign New Product
              </button>
            </div>

            <div className="table-container">
              {loading ? (
                <div className="loading-screen" style={{ minHeight: '300px' }}>
                  <div className="spinner"></div>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td>
                      </tr>
                    ) : (
                      products.map(p => (
                        <tr key={p.productCode}>
                          <td>#{p.productCode}</td>
                          <td>
                            <img src={p.imageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%23233145"/><path d="M12 26l6-7 4 4 3-3 3 6H12z" fill="%23d5d9e2"/><circle cx="15" cy="15" r="3" fill="%23d5d9e2"/></svg>'} alt={p.name} className="table-img" />
                          </td>
                          <td style={{ fontWeight: 500, color: 'white' }}>{p.name}</td>
                          <td>₹{p.price?.toFixed(2)}</td>
                          <td>
                            <span className={`stock-badge ${p.stock <= 0 ? 'out' : p.stock < 10 ? 'low' : 'good'}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button onClick={() => handleOpenModal(p)} className="btn-edit">Edit</button>
                              <button onClick={() => handleDelete(p.productCode)} className="btn-delete">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="welcome-text">
                <h1>Manage <span className="highlight" style={{ color: '#3b82f6' }}>Orders</span></h1>
                <p>View and manage all customer orders in the system.</p>
              </div>
              <button className="btn-secondary" onClick={() => fetchOrders()} style={{ padding: '0.75rem 1.5rem', width: 'auto' }}>
                Refresh Data
              </button>
            </div>

            <div className="table-container">
              {ordersLoading ? (
                <div className="loading-screen" style={{ minHeight: '300px' }}>
                  <div className="spinner"></div>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Product Code</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td>
                      </tr>
                    ) : (
                      orders.map(o => (
                        <tr key={o.orderId}>
                          <td style={{ fontWeight: 'bold' }}>#{o.orderId}</td>
                          <td>{o.productCode}</td>
                          <td>{o.quantity}</td>
                          <td>
                            <span style={{ 
                              padding: '0.3rem 0.6rem', 
                              borderRadius: '4px',
                              background: o.status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : o.status === 'CANCELLED' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: o.status === 'PAID' ? '#34d399' : o.status === 'CANCELLED' ? '#fb7185' : '#fbbf24',
                            }}>
                              {o.status}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                              {o.status !== 'CANCELLED' && (
                                <button className="btn-delete" onClick={() => handleUpdateOrderStatus(o.orderId, 'CANCELLED')} style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}>Cancel</button>
                              )}
                              {o.status !== 'PAID' && (
                                <button className="btn-primary" onClick={() => handleUpdateOrderStatus(o.orderId, 'PAID')} style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', minHeight: 'auto', background: '#10b981' }}>Mark Paid</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>

      {/* Basic Admin Modal (Only active for Inventory Tab, rendering on top level) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingCode ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Product Name</label>
                <div className="input-wrapper">
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wireless Mouse" />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <div className="input-wrapper">
                  <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed description..." />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <div className="input-wrapper">
                  <input required value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <div className="input-wrapper">
                    <input type="number" required min="0" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Initial Stock</label>
                  <div className="input-wrapper">
                    <input type="number" required min="0" value={stock} onChange={e => setStock(Number(e.target.value))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" style={{ padding: '0.75rem 1rem', width: 'auto' }} onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', width: 'auto', margin: 0 }}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
