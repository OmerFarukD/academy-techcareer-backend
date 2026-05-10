import { apiClient } from '../lib/apiClient';
import type { Product } from '../types';

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data } = await apiClient.get<Product[]>('/products/');
    return data;
  },

  async getById(id: number): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },

  async create(payload: { name: string; description: string; price: number; category_id: number }): Promise<Product> {
    const { data } = await apiClient.post<Product>('/products/', payload);
    return data;
  },

  async update(id: number, payload: Partial<{ name: string; description: string; price: number; category_id: number }>): Promise<Product> {
    const { data } = await apiClient.put<Product>(`/products/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async uploadImage(productId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(`/product-images/${productId}`, formData);
    return data;
  },
};
