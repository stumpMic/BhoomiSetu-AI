import { apiClient } from './apiClient';

export const surveyService = {
  // 1. Dashboard Summary & Operational Delay Indicators
  getDashboardSummary: async () => {
    const response = await apiClient.get('/surveys/dashboard/summary');
    return response.data;
  },

  // 2. List Surveys with Filters & Search
  getSurveys: async (params = {}) => {
    const response = await apiClient.get('/surveys', { params });
    return response.data;
  },

  // 3. Create Survey Request (LAO/Admin)
  createSurveyRequest: async (data) => {
    const response = await apiClient.post('/surveys/request', data);
    return response.data;
  },

  // 4. Get Detailed Survey Request Record
  getSurveyDetail: async (id) => {
    const response = await apiClient.get(`/surveys/${id}`);
    return response.data;
  },

  // 5. Accept Survey Assignment
  acceptSurvey: async (id) => {
    const response = await apiClient.put(`/surveys/${id}/accept`);
    return response.data;
  },

  // 6. Schedule Physical Field Survey
  scheduleSurvey: async (id, data) => {
    const response = await apiClient.put(`/surveys/${id}/schedule`, data);
    return response.data;
  },

  // 7. Start Survey
  startSurvey: async (id) => {
    const response = await apiClient.put(`/surveys/${id}/start`);
    return response.data;
  },

  // 8. Verify Documents
  verifyDocuments: async (id, data) => {
    const response = await apiClient.put(`/surveys/${id}/documents/verify`, data);
    return response.data;
  },

  // 9. Verify GPS / Location
  verifyGps: async (id, data) => {
    const response = await apiClient.post(`/surveys/${id}/gps/verify`, data);
    return response.data;
  },

  // 10. Update Field Observations
  updateObservations: async (id, data) => {
    const response = await apiClient.put(`/surveys/${id}/observations`, data);
    return response.data;
  },

  // 11. Upload Photo / Video Evidence
  uploadEvidence: async (id, data) => {
    const response = await apiClient.post(`/surveys/${id}/evidence`, data);
    return response.data;
  },

  // 12. Add Discrepancy
  addDiscrepancy: async (id, data) => {
    const response = await apiClient.post(`/surveys/${id}/discrepancies`, data);
    return response.data;
  },

  // 13. Request Resurvey
  requestResurvey: async (id, data) => {
    const response = await apiClient.post(`/surveys/${id}/resurvey`, data);
    return response.data;
  },

  // 14. Digitally Certify & Submit Survey Report
  submitSurveyReport: async (id, data) => {
    const response = await apiClient.post(`/surveys/${id}/submit`, data);
    return response.data;
  },

  // 15. Review Survey Report (LAO / CO)
  reviewSurveyReport: async (id, data) => {
    const response = await apiClient.put(`/surveys/${id}/review`, data);
    return response.data;
  }
};
