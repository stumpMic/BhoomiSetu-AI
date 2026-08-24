import { apiClient, USE_MOCK_API } from './apiClient';

export const projectService = {
  getProjects: async (statusFilter = null) => {
    try {
      const params = statusFilter ? { status_filter: statusFilter } : {};
      const res = await apiClient.get('/projects', { params });
      return res.data;
    } catch (err) {
      return [
        {
          id: 1,
          code: 'PRJ-OD-EXP-001',
          name: 'Bhubaneswar-Puri Expressway Corridor',
          description: '6-lane Greenfield expressway connecting Capital City with Puri.',
          state: 'Odisha',
          districts: 'Khurda, Puri',
          status: 'Active',
          cases_count: 10,
          total_area_required_acres: 380.5,
          acquired_area_acres: 245.2,
          high_risk_cases_count: 2,
          estimated_budget_cr: 2450.0
        },
        {
          id: 2,
          code: 'PRJ-OD-CAN-002',
          name: 'Mahanadi Water Basin Canal Link',
          description: 'Inter-basin agricultural irrigation canal and flood alleviation corridor.',
          state: 'Odisha',
          districts: 'Cuttack, Khurda',
          status: 'Active',
          cases_count: 10,
          total_area_required_acres: 240.0,
          acquired_area_acres: 165.0,
          high_risk_cases_count: 2,
          estimated_budget_cr: 1120.0
        },
        {
          id: 3,
          code: 'PRJ-OD-RLY-003',
          name: 'Paradip Port Coastal Heavy-Haul Railway Expansion',
          description: 'Dedicated freight rail line to Paradip Deepwater Port.',
          state: 'Odisha',
          districts: 'Jagatsinghpur, Cuttack',
          status: 'Active',
          cases_count: 12,
          total_area_required_acres: 520.0,
          acquired_area_acres: 310.4,
          high_risk_cases_count: 1,
          estimated_budget_cr: 3180.0
        }
      ];
    }
  },

  getProjectById: async (id) => {
    try {
      const res = await apiClient.get(`/projects/${id}`);
      return res.data;
    } catch (err) {
      const list = await projectService.getProjects();
      return list.find(p => p.id === Number(id)) || list[0];
    }
  }
};
