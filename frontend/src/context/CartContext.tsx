import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../services/inventoryService';
import { useAuth } from './AuthContext';

export interface CartItem extends Product {
  cartQuantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productCode: number) => void;
  updateQuantity: (productCode: number, newQuantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const extractUserId = (token: string | null): number => {
  if (!token) return 0; // 0 implies guest/logged out
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      const payload = JSON.parse(atob(pad ? b64 + '='.repeat(4 - pad) : b64));
      return Number(payload.id ?? payload.userId ?? 1);
  } catch {
    return 0;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const userId = extractUserId(token);
  const cartKey = `instabuy_cart_${userId}`;

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (userId === 0) return [];
    const savedCart = localStorage.getItem(cartKey);
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Re-sync state when user changes
  useEffect(() => {
    if (userId === 0) {
      setCart([]);
      return;
    }
    const savedCart = localStorage.getItem(cartKey);
    setCart(savedCart ? JSON.parse(savedCart) : []);
  }, [userId, cartKey]);

  // Save changes to exact user's key
  useEffect(() => {
    if (userId !== 0) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, userId, cartKey]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.productCode === product.productCode);
      if (existingItem) {
        if (existingItem.cartQuantity >= product.stock) {
          alert('Cannot add more than available stock!');
          return prevCart;
        }
        return prevCart.map(item =>
          item.productCode === product.productCode
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productCode: number) => {
    setCart((prevCart) => prevCart.filter(item => item.productCode !== productCode));
  };

  const updateQuantity = (productCode: number, newQuantity: number) => {
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.productCode === productCode) {
          if (newQuantity > item.stock) {
             alert('Not enough stock available!');
             return item;
          }
          if (newQuantity < 1) {
             return { ...item, cartQuantity: 1 };
          }
          return { ...item, cartQuantity: newQuantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((total, item) => total + item.cartQuantity, 0);
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
