import { apiClient } from './client';

export interface UserRolePermission {
  roleId: number;
  permissionId: number;
  permission: {
    id: number;
    name: string;
  };
}

export interface AuthUser {
  id: number;
  name: string | null;
  email: string;
  role: string;
  permissions?: UserRolePermission[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  message: string;
}

export interface RegisterDto {
  username?: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export const authApi = {
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', dto);
    return res.data;
  },

  register: async (dto: RegisterDto) => {
    const res = await apiClient.post<{ message: string }>('/auth/register', dto);
    return res.data;
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/refresh-token');
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post<{ message: string }>('/auth/logout');
    return res.data;
  },
};
