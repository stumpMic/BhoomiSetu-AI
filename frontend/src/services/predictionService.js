import { apiClient, USE_MOCK_API } from './apiClient';
import predMock from '../../../contracts/examples/prediction-response.json';

export const predictionService = {
  getLatestPrediction: async (caseId) => {
    if (USE_MOCK_API) return predMock;
    try {
      const res = await apiClient.get(`/predictions/case/${caseId}/latest`);
      return res.data;
    } catch (err) {
      return predMock;
    }
  },

  triggerPrediction: async (caseId) => {
    try {
      const res = await apiClient.post(`/predictions/case/${caseId}`);
      return res.data;
    } catch (err) {
      return predMock;
    }
  },

  getPredictionHistory: async (caseId) => {
    try {
      const res = await apiClient.get(`/predictions/case/${caseId}/history`);
      return res.data;
    } catch (err) {
      return {
        case_id: caseId,
        history: [
          {
            id: 1,
            delay_probability: 0.84,
            risk_level: "High",
            predicted_delay_days: 145,
            trigger_reason: "Initial Case Evaluation",
            prediction_time: "2026-08-22T14:30:00Z"
          },
          {
            id: 2,
            delay_probability: 0.72,
            risk_level: "High",
            predicted_delay_days: 110,
            trigger_reason: "Hearing Scheduled",
            prediction_time: "2026-08-22T15:00:00Z"
          }
        ]
      };
    }
  }
};
