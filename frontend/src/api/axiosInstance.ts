import axios from 'axios';
import type { AxiosInstance } from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || '';

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token && config.headers) {
      // headers can be a plain object in browser runtime
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized, redirecting to login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
