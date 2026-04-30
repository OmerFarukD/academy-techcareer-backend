import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';
import { cartService } from '../services/cartService';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: async (product, quantity = 1) => {
        const existing = get().items.find((i) => i.productId === product.id);
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
          }));
        } else {
          set((state) => ({
            items: [...state.items, { productId: product.id, quantity, product }],
          }));
        }

        const { useAuthStore } = await import('./authStore');
        if (useAuthStore.getState().isAuthenticated) {
          cartService.addItem(product.id, quantity).catch(() => {
            // silent — local cart is source of truth for UI
          });
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    {
      name: 'cart-storage',
    },
  ),
);
