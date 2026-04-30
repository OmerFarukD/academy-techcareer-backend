import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL as string;

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const getImageUrl = (path: string) => `${BASE_URL}${path}`;
