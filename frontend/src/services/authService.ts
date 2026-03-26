import axiosInstance from '../utils/axiosInstance';

interface AuthRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
}

export const login = async (data: AuthRequest): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/login', data);
  return response.data;
};

interface RegisterRequest extends AuthRequest {
  role?: string;
}

export const register = async (data: RegisterRequest): Promise<void> => {
  await axiosInstance.post('/register', data);
};
