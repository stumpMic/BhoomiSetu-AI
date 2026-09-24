import { apiClient, USE_MOCK_API } from './apiClient';
import loginMock from '../../../contracts/examples/login-response.json';

const DEMO_USERS = {
  'officer.patra@bhoomisetu.gov.in': {
    id: 2,
    full_name: 'Shri Ashok Patra (OAS)',
    name: 'Shri Ashok Patra (OAS)',
    email: 'officer.patra@bhoomisetu.gov.in',
    role: 'land_acquisition_officer',
    role_display: 'Land Acquisition Officer (LAO)',
    department_id: 1,
    department_name: 'Revenue & Land Reforms Department',
    district: 'Khurda',
    phone: '+91 94370 12345'
  },
  'landowner.das@gmail.com': {
    id: 6,
    full_name: 'Bikram Keshari Das',
    name: 'Bikram Keshari Das',
    email: 'landowner.das@gmail.com',
    role: 'landowner',
    role_display: 'Landowner / Beneficiary',
    department_id: null,
    department_name: null,
    district: 'Khurda',
    phone: '+91 98610 99881'
  },
  'surveyor.mishra@bhoomisetu.gov.in': {
    id: 3,
    full_name: 'Smt. Sunita Mishra',
    name: 'Smt. Sunita Mishra',
    email: 'surveyor.mishra@bhoomisetu.gov.in',
    role: 'survey_officer',
    role_display: 'Survey & Cadastral Officer',
    department_id: 2,
    department_name: 'Survey & Cadastral Directorate',
    district: 'Khurda',
    phone: '+91 94370 23456'
  },
  'comp.jena@bhoomisetu.gov.in': {
    id: 4,
    full_name: 'Shri Debasis Jena',
    name: 'Shri Debasis Jena',
    email: 'comp.jena@bhoomisetu.gov.in',
    role: 'compensation_officer',
    role_display: 'Compensation Officer',
    department_id: 3,
    department_name: 'Compensation & Accounts Cell',
    district: 'Khurda',
    phone: '+91 94370 34567'
  },
  'admin@bhoomisetu.gov.in': {
    id: 1,
    full_name: 'Shri R. K. Mohapatra (IAS)',
    name: 'Shri R. K. Mohapatra (IAS)',
    email: 'admin@bhoomisetu.gov.in',
    role: 'admin',
    role_display: 'Administrator',
    department_id: 1,
    department_name: 'Revenue & Land Reforms Department',
    district: 'Bhubaneswar',
    phone: '+91 94370 00001'
  },
  'authority.nayak@bhoomisetu.gov.in': {
    id: 5,
    full_name: 'Dr. Bijay Nayak',
    name: 'Dr. Bijay Nayak',
    email: 'authority.nayak@bhoomisetu.gov.in',
    role: 'project_authority',
    role_display: 'Project Authority (Director)',
    department_id: 1,
    department_name: 'Revenue & Land Reforms Department',
    district: 'Odisha',
    phone: '+91 94370 45678'
  }
};

const getMockResponse = (email) => {
  const user = DEMO_USERS[email] || DEMO_USERS['officer.patra@bhoomisetu.gov.in'];
  return {
    access_token: `mock_jwt_token_bhoomisetu_2026_${user.role}`,
    token_type: 'bearer',
    user
  };
};

export const authService = {
  login: async (email, password) => {
    if (USE_MOCK_API) {
      return getMockResponse(email);
    }
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    } catch (err) {
      // Fallback for mock demo quick login if backend is offline
      if (DEMO_USERS[email] || email.includes('officer') || email.includes('landowner') || email.includes('surveyor') || email.includes('comp')) {
        return getMockResponse(email);
      }
      throw err;
    }
  },

  getCurrentUser: async () => {
    if (USE_MOCK_API) {
      const savedUserStr = localStorage.getItem('bhoomisetu_user');
      if (savedUserStr) {
        try { return JSON.parse(savedUserStr); } catch (e) { }
      }
      return loginMock.user;
    }
    try {
      const res = await apiClient.get('/auth/me');
      return res.data;
    } catch (err) {
      const savedUserStr = localStorage.getItem('bhoomisetu_user');
      if (savedUserStr) {
        try { return JSON.parse(savedUserStr); } catch (e) { }
      }
      return loginMock.user;
    }
  }
};
