import axios from 'axios';

const ORDER_SERVICE_URL = `${import.meta.env.VITE_ORDER_SERVICE_URL || 'http://localhost:8082'}/orders`;

const orderClient = axios.create({
  baseURL: ORDER_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

orderClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface OrderResponse {
  orderId: number;
  productCode?: number;
  quantity?: number;
  status: string;
}

export const placeOrder = async (productCode: number, quantity: number): Promise<OrderResponse> => {
  const response = await orderClient.post<OrderResponse>('/place', { productCode, quantity });
  return response.data;
};

export const getOrderDetails = async (orderId: number): Promise<OrderResponse> => {
  const response = await orderClient.get<OrderResponse>(`/${orderId}`);
  return response.data;
};

export const trackOrderStatus = async (orderId: number): Promise<string> => {
  const response = await orderClient.get<string>(`/${orderId}/status`);
  return response.data;
};

export const cancelOrder = async (orderId: number): Promise<string> => {
  const response = await orderClient.put<string>(`/${orderId}/cancel`);
  return response.data;
};

// --- Admin Endpoints ---
const ADMIN_ORDER_URL = `${import.meta.env.VITE_ORDER_SERVICE_URL || 'http://localhost:8082'}/admin/orders`;

const adminOrderClient = axios.create({
  baseURL: ADMIN_ORDER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminOrderClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAllSystemOrders = async (): Promise<OrderResponse[]> => {
  const response = await adminOrderClient.get<OrderResponse[]>('');
  return response.data;
};

export const updateSystemOrderStatus = async (orderId: number, status: string): Promise<string> => {
  const response = await adminOrderClient.put<string>(`/${orderId}/status`, null, {
    params: { status }
  });
  return response.data;
};

