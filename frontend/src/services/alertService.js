import { apiClient, USE_MOCK_API } from './apiClient';
import alertMock from '../../../contracts/examples/alert-response.json';

export const alertService = {
  getAlerts: async (unreadOnly = false) => {
    try {
      const res = await apiClient.get('/alerts', { params: { unread_only: unreadOnly } });
      return res.data;
    } catch (err) {
      return alertMock.alerts || [];
    }
  },

  markRead: async (id) => {
    const res = await apiClient.put(`/alerts/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await apiClient.put('/alerts/read-all');
    return res.data;
  }
};
