import { apiClient, USE_MOCK_API } from './apiClient';

const mockHearings = [
  {
    id: 1,
    case_id: 4,
    case_number: "CASE-OD-2026-004",
    hearing_type: "Section 15 Objections Hearing",
    title: "Public Hearing on RoR Title Objections - Plot #142",
    hearing_date: "2026-09-18",
    hearing_time: "11:00 AM",
    venue_or_mode: "Collectorate Conference Hall, Khurda",
    participants: "Land Acquisition Officer, Tahsildar Pipili, Bikram Keshari Das & Co-sharers",
    purpose: "Hearing regarding sub-plot 142/A boundary demarcation and title ownership claims.",
    status: "Scheduled",
    minutes_summary: null,
    created_at: "2026-09-01T10:00:00"
  },
  {
    id: 2,
    case_id: 1,
    case_number: "CASE-OD-2026-001",
    hearing_type: "Land Valuation & Award Consultation",
    title: "Solatium & Basic Land Value Determination Meeting",
    hearing_date: "2026-09-22",
    hearing_time: "02:30 PM",
    venue_or_mode: "Tahsil Office Meeting Room, Pipili",
    participants: "LAO, Revenue Inspector, Affected Farmers Group",
    purpose: "Finalizing market benchmarks and 100% solatium calculation tables.",
    status: "Scheduled",
    minutes_summary: null,
    created_at: "2026-09-02T14:00:00"
  }
];

export const hearingService = {
  getHearings: async (filters = {}) => {
    try {
      const res = await apiClient.get('/hearings', { params: filters });
      return res.data;
    } catch (err) {
      if (filters.case_id) {
        return mockHearings.filter(h => h.case_id === Number(filters.case_id));
      }
      return mockHearings;
    }
  },

  scheduleHearing: async (hearingData) => {
    try {
      const res = await apiClient.post('/hearings', hearingData);
      return res.data;
    } catch (err) {
      const newHearing = {
        id: Date.now(),
        ...hearingData,
        status: hearingData.status || 'Scheduled',
        created_at: new Date().toISOString()
      };
      mockHearings.push(newHearing);
      return newHearing;
    }
  },

  updateHearing: async (id, payload) => {
    try {
      const res = await apiClient.put(`/hearings/${id}`, payload);
      return res.data;
    } catch (err) {
      const idx = mockHearings.findIndex(h => h.id === id);
      if (idx !== -1) {
        mockHearings[idx] = { ...mockHearings[idx], ...payload };
        return mockHearings[idx];
      }
      return { id, ...payload };
    }
  }
};
