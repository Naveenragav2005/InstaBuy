import axios from 'axios';

const INVENTORY_SERVICE_URL = `${import.meta.env.VITE_INVENTORY_SERVICE_URL || 'http://localhost:8084'}`;

const inventoryClient = axios.create({
  baseURL: INVENTORY_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

inventoryClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Product {
  productCode: number;
  name: string;
  description: string;
  imageUrl: string;
  stock: number;
  price: number;
}

export type NewProduct = Omit<Product, 'productCode'>;

// Public (Authenticated)
export const getAllProducts = async (): Promise<Product[]> => {
  const response = await inventoryClient.get<Product[]>('/products');
  return response.data;
};

// Admin Methods
export const addProduct = async (product: NewProduct): Promise<Product> => {
  const response = await inventoryClient.post<Product>('/admin/add', product);
  return response.data;
};

export const updateProduct = async (productCode: number, product: Partial<Product>): Promise<Product> => {
  const response = await inventoryClient.put<Product>(`/admin/products/${productCode}`, product);
  return response.data;
};

export const deleteProduct = async (productCode: number): Promise<string> => {
  const response = await inventoryClient.delete(`/admin/delete/${productCode}`);
  return response.data; // Server returns a String
};

export const updateStock = async (productCode: number, stock: number): Promise<Product> => {
  const response = await inventoryClient.put<Product>(`/admin/products/${productCode}/stock`, null, {
    params: { stock }
  });
  return response.data;
};
