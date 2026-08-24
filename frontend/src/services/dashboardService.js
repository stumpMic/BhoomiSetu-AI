import { apiClient, USE_MOCK_API } from './apiClient';
import dashboardMock from '../../../contracts/examples/dashboard-response.json';

export const dashboardService = {
  getSummary: async () => {
    if (USE_MOCK_API) return dashboardMock;
    try {
      const res = await apiClient.get('/dashboard/summary');
      return res.data;
    } catch (err) {
      console.warn("Dashboard API fetch failed, using contract mock:", err);
      return dashboardMock;
    }
  }
};
