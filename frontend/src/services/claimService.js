import { apiClient, USE_MOCK_API } from './apiClient';

const mockClaims = [
  {
    id: 1,
    case_id: 4,
    case_number: "CASE-OD-2026-004",
    parcel_id: 4,
    plot_number: "142",
    landowner_id: 1,
    landowner_name: "Bikram Keshari Das",
    claim_number: "CLAIM-2026-088",
    claim_type: "Valuation Objection & Boundary Demarcation",
    claimed_amount_inr: 4500000.0,
    description: "Objection filed regarding commercial tree valuation on plot 142/A and request for re-survey of adjacent sub-plots.",
    status: "Under Review",
    officer_decision_notes: null,
    reviewed_at: null,
    created_at: "2026-08-28T14:30:00"
  },
  {
    id: 2,
    case_id: 1,
    case_number: "CASE-OD-2026-001",
    parcel_id: 1,
    plot_number: "105",
    landowner_id: 2,
    landowner_name: "Ramesh Chandra Swain",
    claim_number: "CLAIM-2026-042",
    claim_type: "Solatium Claim (100% Addition)",
    claimed_amount_inr: 1850000.0,
    description: "Claim for additional structure valuation and R&R displacement assistance as per statutory 2013 Act Schedule II.",
    status: "Approved",
    officer_decision_notes: "Approved by LAO after verification of site survey logs.",
    reviewed_at: "2026-09-01T16:00:00",
    created_at: "2026-08-20T11:15:00"
  }
];

export const claimService = {
  getClaims: async (filters = {}) => {
    try {
      const res = await apiClient.get('/claims', { params: filters });
      return res.data;
    } catch (err) {
      if (filters.case_id) {
        return mockClaims.filter(c => c.case_id === Number(filters.case_id));
      }
      return mockClaims;
    }
  },

  submitClaim: async (claimData) => {
    try {
      const res = await apiClient.post('/claims', claimData);
      return res.data;
    } catch (err) {
      const newClaim = {
        id: Date.now(),
        ...claimData,
        status: 'Under Review',
        created_at: new Date().toISOString()
      };
      mockClaims.push(newClaim);
      return newClaim;
    }
  },

  submitDecision: async (id, decisionData) => {
    try {
      const res = await apiClient.put(`/claims/${id}/decision`, decisionData);
      return res.data;
    } catch (err) {
      const idx = mockClaims.findIndex(c => c.id === id);
      if (idx !== -1) {
        mockClaims[idx].status = decisionData.status;
        mockClaims[idx].officer_decision_notes = decisionData.officer_decision_notes;
        mockClaims[idx].reviewed_at = new Date().toISOString();
        return mockClaims[idx];
      }
      return { id, ...decisionData };
    }
  }
};
