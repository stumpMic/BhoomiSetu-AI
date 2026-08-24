import { apiClient, USE_MOCK_API } from './apiClient';
import compMock from '../../../contracts/examples/compensation-response.json';

export const compensationService = {
  getCompensations: async (filters = {}) => {
    try {
      const res = await apiClient.get('/compensations', { params: filters });
      return res.data;
    } catch (err) {
      return [compMock];
    }
  },

  getCompensationById: async (id) => {
    if (USE_MOCK_API) return compMock;
    try {
      const res = await apiClient.get(`/compensations/${id}`);
      return res.data;
    } catch (err) {
      return compMock;
    }
  },

  updateStage: async (id, stageName, remarks = '') => {
    const res = await apiClient.put(`/compensations/${id}/stage`, {
      stage_name: stageName,
      remarks
    });
    return res.data;
  }
};
