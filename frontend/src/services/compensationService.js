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
  },

  getWorkQueue: async (filters = {}) => {
    try {
      const res = await apiClient.get('/compensations/work-queue', { params: filters });
      return res.data;
    } catch (err) {
      // Graceful fallback for offline/mock mode
      return {
        total_items: 4,
        ready_count: 1,
        in_progress_count: 2,
        blocked_count: 1,
        completed_count: 0,
        total_award_crores: 3.23,
        disbursed_crores: 0.0,
        items: [
          {
            id: 1,
            case_id: 4,
            case_number: 'CASE-OD-2026-004',
            project_name: 'Bhubaneswar-Puri Expressway Corridor',
            village_name: 'Pipili',
            parcel_id: 12,
            plot_number: '142/A',
            khata_number: '312',
            land_area_acres: 4.5,
            landowner_id: 12,
            landowner_name: 'Bikram Keshari Das',
            landowner_phone: '+91 98610 99881',
            landowner_share_amount_inr: 3500000.0,
            total_award_inr: 7000000.0,
            base_valuation_inr: 3375000.0,
            solatium_100pct_inr: 3375000.0,
            current_stage: 'Approval pending',
            stage_index: 4,
            work_status: 'In Progress',
            days_pending: 18,
            blockers: ['Sub-plot boundary partition contest pending Section 15 review'],
            prerequisites_status: {
              survey_completed: false,
              survey_pct: 40.0,
              docs_verified: false,
              missing_doc_pct: 35.0,
              disputes_resolved: false,
              ownership_disputes: 2,
              court_cases: 1
            },
            ai_risk: {
              delay_probability: 0.84,
              risk_level: 'High',
              urgency: 'High',
              predicted_delay_days: 145,
              compensation_factors: [
                'Joint survey demarcation delay (40%) impacting land boundary valuation',
                'Title contestation & RoR mutation discrepancy under Sec 15 review'
              ],
              recommendations: [
                'Submit finalized award determination for Section 30 sanction.',
                'Coordinate with Survey Directorate to expedite field sub-plot demarcation.'
              ]
            },
            bank_details: {
              account_number_masked: 'XXXX-XXXX-4982',
              ifsc_code: 'SBIN0001234',
              bank_name: 'State Bank of India',
              verification_status: 'Pending'
            },
            mock_payment_ref: 'MOCK-PFMS-OD-2026-994821',
            payment_disbursed_at: null
          },
          {
            id: 2,
            case_id: 4,
            case_number: 'CASE-OD-2026-004',
            project_name: 'Bhubaneswar-Puri Expressway Corridor',
            village_name: 'Pipili',
            parcel_id: 12,
            plot_number: '142/A',
            khata_number: '312',
            land_area_acres: 4.5,
            landowner_id: 13,
            landowner_name: 'Prasant Kumar Das',
            landowner_phone: '+91 98610 99882',
            landowner_share_amount_inr: 3500000.0,
            total_award_inr: 7000000.0,
            base_valuation_inr: 3375000.0,
            solatium_100pct_inr: 3375000.0,
            current_stage: 'Approval pending',
            stage_index: 4,
            work_status: 'In Progress',
            days_pending: 18,
            blockers: ['Co-sharer apportionment consent pending'],
            prerequisites_status: {
              survey_completed: false,
              survey_pct: 40.0,
              docs_verified: false,
              missing_doc_pct: 35.0,
              disputes_resolved: false,
              ownership_disputes: 2,
              court_cases: 1
            },
            ai_risk: {
              delay_probability: 0.84,
              risk_level: 'High',
              urgency: 'High',
              predicted_delay_days: 145,
              compensation_factors: [
                'Title contestation & RoR mutation discrepancy under Sec 15 review'
              ],
              recommendations: [
                'Submit finalized award determination for Section 30 sanction.'
              ]
            },
            bank_details: {
              account_number_masked: 'XXXX-XXXX-4983',
              ifsc_code: 'SBIN0001234',
              bank_name: 'State Bank of India',
              verification_status: 'Pending'
            },
            mock_payment_ref: 'MOCK-PFMS-OD-2026-994822',
            payment_disbursed_at: null
          },
          {
            id: 3,
            case_id: 4,
            case_number: 'CASE-OD-2026-004',
            project_name: 'Bhubaneswar-Puri Expressway Corridor',
            village_name: 'Pipili',
            parcel_id: 14,
            plot_number: '144',
            khata_number: '315',
            land_area_acres: 3.2,
            landowner_id: 14,
            landowner_name: 'Smt. Manorama Rout',
            landowner_phone: '+91 94371 44552',
            landowner_share_amount_inr: 9310000.0,
            total_award_inr: 9310000.0,
            base_valuation_inr: 4480000.0,
            solatium_100pct_inr: 4480000.0,
            current_stage: 'Bank verification',
            stage_index: 7,
            work_status: 'Ready for Compensation',
            days_pending: 12,
            blockers: [],
            prerequisites_status: {
              survey_completed: true,
              survey_pct: 100.0,
              docs_verified: true,
              missing_doc_pct: 0.0,
              disputes_resolved: true,
              ownership_disputes: 0,
              court_cases: 0
            },
            ai_risk: {
              delay_probability: 0.15,
              risk_level: 'Low',
              urgency: 'Normal',
              predicted_delay_days: 6,
              compensation_factors: [
                'Statutory processing timeline within permissible schedule'
              ],
              recommendations: [
                'Verify Aadhaar-seeded bank account for PFMS direct benefit transfer.'
              ]
            },
            bank_details: {
              account_number_masked: 'XXXX-XXXX-3321',
              ifsc_code: 'PUNB0023400',
              bank_name: 'Punjab National Bank',
              verification_status: 'Verified'
            },
            mock_payment_ref: 'MOCK-PFMS-OD-2026-994823',
            payment_disbursed_at: null
          },
          {
            id: 6,
            case_id: 1,
            case_number: 'CASE-OD-2026-001',
            project_name: 'Bhubaneswar-Puri Expressway Corridor',
            village_name: 'Pipili',
            parcel_id: 2,
            plot_number: '102',
            khata_number: '88',
            land_area_acres: 1.8,
            landowner_id: 2,
            landowner_name: 'Sarat Chandra Mohapatra',
            landowner_phone: '+91 94371 11002',
            landowner_share_amount_inr: 3840000.0,
            total_award_inr: 3840000.0,
            base_valuation_inr: 1860000.0,
            solatium_100pct_inr: 1860000.0,
            current_stage: 'Land valuation pending',
            stage_index: 1,
            work_status: 'Blocked',
            days_pending: 25,
            blockers: [
              'Cadastral survey incomplete (85% completed; min 90% required)',
              'Title / RoR document verification incomplete (10% missing/unverified)'
            ],
            prerequisites_status: {
              survey_completed: false,
              survey_pct: 85.0,
              docs_verified: false,
              missing_doc_pct: 10.0,
              disputes_resolved: true,
              ownership_disputes: 0,
              court_cases: 0
            },
            ai_risk: {
              delay_probability: 0.22,
              risk_level: 'Low',
              urgency: 'Normal',
              predicted_delay_days: 12,
              compensation_factors: [
                'Joint survey demarcation delay (85%) impacting land boundary valuation'
              ],
              recommendations: [
                'Coordinate with Survey Directorate to expedite field sub-plot demarcation.'
              ]
            },
            bank_details: {
              account_number_masked: 'XXXX-XXXX-1002',
              ifsc_code: 'PUNB0023400',
              bank_name: 'Punjab National Bank',
              verification_status: 'Verified'
            },
            mock_payment_ref: null,
            payment_disbursed_at: null
          }
        ]
      };
    }
  },

  requestAction: async (payload) => {
    const res = await apiClient.post('/compensations/request-action', payload);
    return res.data;
  },

  updateAssessment: async (id, payload) => {
    const res = await apiClient.put(`/compensations/${id}/assessment`, payload);
    return res.data;
  }
};
