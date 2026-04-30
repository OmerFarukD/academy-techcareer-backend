import { apiClient } from '../lib/apiClient';
import type { AuthToken, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthToken> {
    const params = new URLSearchParams({ username: email, password });
    const { data } = await apiClient.post<AuthToken>('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },

  async register(email: string, password: string): Promise<User> {
    const { data } = await apiClient.post<User>('/users/', { email, password });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/users/me');
    return data;
  },
};
