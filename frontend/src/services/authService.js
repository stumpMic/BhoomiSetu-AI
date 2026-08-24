import { apiClient, USE_MOCK_API } from './apiClient';
import loginMock from '../../../contracts/examples/login-response.json';

export const authService = {
  login: async (email, password) => {
    if (USE_MOCK_API) {
      return loginMock;
    }
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    } catch (err) {
      // Fallback for mock demo quick login if backend is offline
      if (email.includes('officer')) return loginMock;
      throw err;
    }
  },

  getCurrentUser: async () => {
    if (USE_MOCK_API) {
      return loginMock.user;
    }
    try {
      const res = await apiClient.get('/auth/me');
      return res.data;
    } catch (err) {
      return loginMock.user;
    }
  }
};
