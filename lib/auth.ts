import apiClient from './api-client';
import type { AppScreenKey } from './route-permissions';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  adminId: string | null;
  isActive: boolean;
  permissions: Record<string, boolean>;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export function canViewScreen(user: User | null, screen: AppScreenKey): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.permissions?.[screen] === true;
}

export const authApi = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  async me(): Promise<{ user: User }> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  saveAuth(authResponse: AuthResponse) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', authResponse.access_token);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
    }
  },

  updateStoredUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const u = JSON.parse(userStr) as User;
      if (!u.permissions || typeof u.permissions !== 'object') {
        u.permissions = {};
      }
      return u;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },
};
