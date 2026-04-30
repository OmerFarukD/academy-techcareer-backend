import { apiClient } from '../lib/apiClient';
import type { Order } from '../types';

export const orderService = {
  async createOrder(): Promise<Order> {
    const { data } = await apiClient.post<Order>('/orders/');
    return data;
  },

  async getOrders(): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>('/orders/');
    return data;
  },
};
