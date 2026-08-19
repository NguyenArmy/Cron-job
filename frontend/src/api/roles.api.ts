import { apiClient } from './client';

export interface PermissionItem {
  id: number;
  name: string;
}

export interface RolePermissionItem {
  permission: PermissionItem;
}

export interface RoleItem {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  permissions?: RolePermissionItem[];
  _count?: {
    users: number;
  };
}

export interface CreateRoleDto {
  name: string;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  permissions?: string[];
}

export const rolesApi = {
  findAll: async (): Promise<RoleItem[]> => {
    const res = await apiClient.get<RoleItem[]>('/roles');
    return res.data;
  },

  findOne: async (id: number): Promise<RoleItem> => {
    const res = await apiClient.get<RoleItem>(`/roles/${id}`);
    return res.data;
  },

  create: async (dto: CreateRoleDto): Promise<RoleItem> => {
    const res = await apiClient.post<RoleItem>('/roles', dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateRoleDto): Promise<RoleItem> => {
    const res = await apiClient.patch<RoleItem>(`/roles/${id}`, dto);
    return res.data;
  },

  remove: async (id: number): Promise<{ message: string; reassignedUserCount?: number }> => {
    const res = await apiClient.delete(`/roles/${id}`);
    return res.data;
  },
};

export const permissionsApi = {
  findAll: async (): Promise<PermissionItem[]> => {
    const res = await apiClient.get<PermissionItem[]>('/permissions');
    return res.data;
  },

  create: async (name: string): Promise<PermissionItem> => {
    const res = await apiClient.post<PermissionItem>('/permissions', { name });
    return res.data;
  },

  update: async (id: number, name: string): Promise<PermissionItem> => {
    const res = await apiClient.patch<PermissionItem>(`/permissions/${id}`, { name });
    return res.data;
  },

  remove: async (id: number): Promise<PermissionItem> => {
    const res = await apiClient.delete<PermissionItem>(`/permissions/${id}`);
    return res.data;
  },
};
