import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authService } from '../services/authService';
import { cartService } from '../services/cartService';

interface AuthStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      token: null,

      login: async (email, password) => {
        const { access_token } = await authService.login(email, password);
        localStorage.setItem('auth_token', access_token);
        const user = await authService.getMe();
        set({ currentUser: user, isAuthenticated: true, token: access_token });

        // sync local cart items to server cart
        const { useCartStore } = await import('./cartStore');
        const localItems = useCartStore.getState().items;
        await Promise.allSettled(
          localItems.map((item) => cartService.addItem(item.productId, item.quantity)),
        );

        return user;
      },

      register: async (email, password) => {
        await authService.register(email, password);
        return get().login(email, password);
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ currentUser: null, isAuthenticated: false, token: null });
        import('./cartStore').then(({ useCartStore }) => {
          useCartStore.getState().clearCart();
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('auth_token', state.token);
        }
      },
    },
  ),
);
