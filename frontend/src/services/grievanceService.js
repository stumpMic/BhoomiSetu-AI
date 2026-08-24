import { apiClient, USE_MOCK_API } from './apiClient';
import grvMock from '../../../contracts/examples/grievance-response.json';

export const grievanceService = {
  getGrievances: async (filters = {}) => {
    try {
      const res = await apiClient.get('/grievances', { params: filters });
      return res.data;
    } catch (err) {
      return [grvMock];
    }
  },

  getGrievanceById: async (id) => {
    if (USE_MOCK_API) return grvMock;
    try {
      const res = await apiClient.get(`/grievances/${id}`);
      return res.data;
    } catch (err) {
      return grvMock;
    }
  },

  submitGrievance: async (data) => {
    const res = await apiClient.post('/grievances', data);
    return res.data;
  },

  updateStatus: async (id, status, remarks = '', deptId = null, officerId = null) => {
    const res = await apiClient.put(`/grievances/${id}/status`, {
      status,
      remarks,
      assigned_department_id: deptId,
      assigned_officer_id: officerId
    });
    return res.data;
  }
};
