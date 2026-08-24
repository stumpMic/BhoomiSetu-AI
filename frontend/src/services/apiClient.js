import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT token into headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bhoomisetu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      // localStorage.removeItem('bhoomisetu_token');
    }
    return Promise.reject(error);
  }
);
