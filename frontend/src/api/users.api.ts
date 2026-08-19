import { apiClient } from './client';

export interface UserItem {
  id: number;
  name: string | null;
  roleId: number;
  createdAt: string;
  updatedAt: string;
  account?: {
    email: string;
  } | null;
  role?: {
    id: number;
    name: string;
  };
  _count?: {
    createdSchedules: number;
    assignedSchedules: number;
  };
}

export interface UpdateUserDto {
  name?: string;
  roleId?: number;
}

export const usersApi = {
  findAll: async (): Promise<UserItem[]> => {
    const res = await apiClient.get<UserItem[]>('/users');
    return res.data;
  },

  findOne: async (id: number): Promise<UserItem> => {
    const res = await apiClient.get<UserItem>(`/users/${id}`);
    return res.data;
  },

  update: async (id: number, dto: UpdateUserDto): Promise<UserItem & { sessionRevoked: boolean }> => {
    const res = await apiClient.patch(`/users/${id}`, dto);
    return res.data;
  },

  remove: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },
};
