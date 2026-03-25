import axios from 'axios';

const PAYMENT_SERVICE_URL = `${import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:8085'}/payment`;

const paymentClient = axios.create({
  baseURL: PAYMENT_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

paymentClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateRazorpayOrderResponse {
  razorpay_order_id: string;
  status: string;
}

export interface VerifyPaymentResponse {
  status: string;
  message: string;
}

export const createRazorpayOrder = async (
  orderId: number,
  userId: number,
  amount: number
): Promise<CreateRazorpayOrderResponse> => {
  const response = await paymentClient.post<CreateRazorpayOrderResponse>('/create-order', {
    orderId,
    userId,
    amount,
  });
  return response.data;
};

export const verifyPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<VerifyPaymentResponse> => {
  const response = await paymentClient.post<VerifyPaymentResponse>('/verify', {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return response.data;
};
