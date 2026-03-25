import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder, trackOrderStatus, cancelOrder } from '../services/orderService';
import { createRazorpayOrder, verifyPayment } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    description?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = async (): Promise<boolean> => {
  if (window.Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const extractUserIdFromToken = (token: string | null): number => {
  if (!token) {
    return 1;
  }

  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    const payload = JSON.parse(atob(pad ? b64 + '='.repeat(4 - pad) : b64));
    return Number(payload.id ?? payload.userId ?? 1);
  } catch {
    return 1;
  }
};

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { cart, totalPrice, totalItems, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [pendingRazorpayId, setPendingRazorpayId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  useEffect(() => {
    if (cart.length === 0 && status.type !== 'success') {
      navigate('/shop');
    }
  }, [cart.length, navigate, status.type]);

  const primaryItem = cart.length > 0 ? cart[0] : null;

  const handleCheckout = async () => {
    if (!primaryItem) return;
    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY;
      if (!razorpayKey) {
        throw new Error('Razorpay key is not configured in the frontend environment.');
      }

      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error('Razorpay checkout failed to load.');
      }

      let appOrderId = pendingOrderId;
      
      if (!appOrderId) {
        const orderResponse = await placeOrder(primaryItem.productCode, totalItems);
        appOrderId = orderResponse.orderId;

        if (!appOrderId) {
          throw new Error('Could not create database order.');
        }

        setPendingOrderId(appOrderId);
        setOrderStatus(orderResponse.status);
      } else {
        const latestOrderStatus = await trackOrderStatus(appOrderId);
        setOrderStatus(latestOrderStatus);
      }

      const userId = extractUserIdFromToken(token);
      let razorpayOrderId = pendingRazorpayId;

      if (!razorpayOrderId) {
        const razorpayOrder = await createRazorpayOrder(appOrderId, userId, totalPrice);

        if (!razorpayOrder.razorpay_order_id) {
          throw new Error('Could not initialize Razorpay order.');
        }

        razorpayOrderId = razorpayOrder.razorpay_order_id;
        setPendingRazorpayId(razorpayOrderId);
      }

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: Math.round(totalPrice * 100),
        currency: 'INR',
        name: 'InstaBuy',
        description: `Payment for Order #${appOrderId}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png',
        order_id: razorpayOrderId,
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            setLoading(true);

            const verifyResponse = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            const latestOrderStatus = await trackOrderStatus(appOrderId);
            setOrderStatus(latestOrderStatus);

            if (verifyResponse.status === 'SUCCESS') {
              clearCart();
              setStatus({
                type: 'success',
                message: `Payment verified. Order #${appOrderId} is now ${latestOrderStatus}.`,
              });
              return;
            }

            setStatus({
              type: 'error',
              message: verifyResponse.message || 'Payment verification failed.',
            });
          } catch (err: any) {
            setStatus({
              type: 'error',
              message: err.response?.data?.message || err.message || 'Error verifying payment.',
            });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: 'InstaBuy Customer',
          email: 'customer@instabuy.com',
          contact: '9999999999',
        },
        modal: {
          ondismiss: async () => {
             setLoading(true);
             try {
               await cancelOrder(appOrderId);
               const newStatus = await trackOrderStatus(appOrderId);
               setOrderStatus(newStatus);
               setStatus({ type: 'error', message: 'Checkout cancelled by user.' });
             } catch (e) {
               console.error('Failed to update canceled order status');
               setStatus({ type: 'error', message: 'Checkout cancelled by user (offline).' });
             } finally {
               setLoading(false);
             }
          }
        },
        theme: {
          color: '#6366f1',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', async (response: RazorpayFailureResponse) => {
        setLoading(true);
        try {
           await cancelOrder(appOrderId);
           const newStatus = await trackOrderStatus(appOrderId);
           setOrderStatus(newStatus);
        } catch (e) {
           console.error('Failed to notify backend of payment failure');
        }
        setStatus({
          type: 'error',
          message: response.error?.description || 'Payment failed before verification.',
        });
        setLoading(false);
      });

      setLoading(false);
      razorpay.open();
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Something went wrong during checkout.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <nav className="dashboard-nav">
        <div className="nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
            <rect width="32" height="32" rx="8" fill="url(#nav-grad-chk)" />
            <path d="M10 13L16 9L22 13V19L16 25L10 19V13Z" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M16 9V25" stroke="white" strokeWidth="1.5" />
            <defs>
              <linearGradient id="nav-grad-chk" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span>InstaBuy Checkout</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
        </button>
      </nav>

      <div className="checkout-content">
        <div className="checkout-card">
          <div className="product-image">
            <img src={primaryItem?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'} alt="Checkout Item" />
          </div>
          <div className="product-details">
            <h2>{cart.length === 1 ? primaryItem?.name : `Checkout (${totalItems} items)`}</h2>
            <p className="product-desc">
               {cart.length === 1 ? primaryItem?.description : `You are purchasing ${cart.length} unique items.`}
            </p>
            <div className="price-tag">
              <span className="currency">Rs</span>
              <span className="amount">{totalPrice.toFixed(2)}</span>
            </div>

            {status.type === 'error' && (
              <div className="error-message checkout-message">
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {status.message}
              </div>
            )}

            {status.type === 'success' && (
              <div className="success-message checkout-message">
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {status.message}
              </div>
            )}

            {orderStatus && (
              <p className="secure-badge" style={{ marginTop: '0.75rem' }}>
                Current order status: <strong>{orderStatus}</strong>
              </p>
            )}

            <button className="btn-primary checkout-btn" onClick={handleCheckout} disabled={loading || status.type === 'success'}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner-sm"></span> Processing Securely...
                </span>
              ) : status.type === 'success' ? (
                'Order Completed'
              ) : (
                'Buy Now with Razorpay'
              )}
            </button>
            <p className="secure-badge">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              100% Secure Checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
