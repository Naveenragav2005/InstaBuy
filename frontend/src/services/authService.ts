import axiosInstance from '../utils/axiosInstance';

interface AuthRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
}

export const login = async (data: AuthRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const register = async (data: AuthRequest): Promise<void> => {
  await axiosInstance.post('/auth/register', data);
};
