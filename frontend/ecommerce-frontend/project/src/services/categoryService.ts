import { apiClient } from '../lib/apiClient';
import type { Category } from '../types';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>('/categories/');
    return data;
  },
};
