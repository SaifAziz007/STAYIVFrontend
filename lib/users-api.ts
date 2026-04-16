import apiClient from './api-client';

export type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  adminId: string | null;
  isActive: boolean;
  createdAt?: string;
  permissions: Record<string, boolean>;
};

export const usersApi = {
  async list(): Promise<ManagedUser[]> {
    const { data } = await apiClient.get('/auth/admin/users');
    return data;
  },

  async get(id: string): Promise<ManagedUser> {
    const { data } = await apiClient.get(`/auth/admin/users/${id}`);
    return data;
  },

  async create(body: { name: string; email: string; password: string }) {
    const { data } = await apiClient.post('/auth/admin/users', body);
    return data;
  },

  async updatePermissions(id: string, permissions: Record<string, boolean>) {
    const { data } = await apiClient.put(`/auth/admin/users/${id}/permissions`, {
      permissions,
    });
    return data;
  },

  async setStatus(id: string, isActive: boolean) {
    const { data } = await apiClient.patch(`/auth/admin/users/${id}/status`, {
      isActive,
    });
    return data;
  },

  async remove(id: string) {
    const { data } = await apiClient.delete(`/auth/admin/users/${id}`);
    return data;
  },
};
