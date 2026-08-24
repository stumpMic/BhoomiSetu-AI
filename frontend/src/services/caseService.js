import { apiClient, USE_MOCK_API } from './apiClient';
import caseMock from '../../../contracts/examples/case-response.json';

export const caseService = {
  getCases: async (filters = {}) => {
    try {
      const res = await apiClient.get('/cases', { params: filters });
      return res.data;
    } catch (err) {
      return [
        caseMock,
        {
          id: 1,
          case_number: "CASE-OD-2026-001",
          project_name: "Bhubaneswar-Puri Expressway Corridor",
          village_name: "Pipili",
          district: "Khurda",
          current_stage: "Joint Survey & Verification",
          status: "In Progress",
          assigned_officer_name: "Shri Ashok Patra",
          parcels_count: 4,
          total_area_acres: 12.4,
          total_compensation_cr: 18.6,
          risk_summary: {
            delay_probability: 0.22,
            risk_level: "Low",
            predicted_delay_days: 12
          },
          metrics: {
            missing_doc_pct: 10.0,
            survey_completed_pct: 85.0,
            ownership_disputes_count: 0,
            court_cases_count: 0,
            pending_approvals_count: 0,
            compensation_progress_pct: 15.0,
            bank_verification_pct: 30.0,
            environmental_clearance: true,
            rehabilitation_required: false
          }
        },
        {
          id: 3,
          case_number: "CASE-OD-2026-003",
          project_name: "Bhubaneswar-Puri Expressway Corridor",
          village_name: "Pipili",
          district: "Khurda",
          current_stage: "Valuation & Award Determination",
          status: "In Progress",
          assigned_officer_name: "Shri Ashok Patra",
          parcels_count: 3,
          total_area_acres: 11.3,
          total_compensation_cr: 16.9,
          risk_summary: {
            delay_probability: 0.48,
            risk_level: "Medium",
            predicted_delay_days: 52
          },
          metrics: {
            missing_doc_pct: 25.0,
            survey_completed_pct: 60.0,
            ownership_disputes_count: 1,
            court_cases_count: 0,
            pending_approvals_count: 2,
            compensation_progress_pct: 35.0,
            bank_verification_pct: 50.0,
            environmental_clearance: true,
            rehabilitation_required: false
          }
        }
      ];
    }
  },

  getCaseById: async (id) => {
    if (USE_MOCK_API) return caseMock;
    try {
      const res = await apiClient.get(`/cases/${id}`);
      return res.data;
    } catch (err) {
      return caseMock;
    }
  }
};
