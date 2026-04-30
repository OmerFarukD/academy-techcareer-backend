import { apiClient } from '../lib/apiClient';

interface ServerCart {
  id: number;
  user_id: number;
  items: { id: number; product_id: number; quantity: number }[];
}

interface ServerCartItem {
  id: number;
  product_id: number;
  quantity: number;
}

export const cartService = {
  async getCart(): Promise<ServerCart> {
    const { data } = await apiClient.get<ServerCart>('/cart/');
    return data;
  },

  async addItem(product_id: number, quantity: number): Promise<ServerCartItem> {
    const { data } = await apiClient.post<ServerCartItem>('/cart/items', { product_id, quantity });
    return data;
  },
};
