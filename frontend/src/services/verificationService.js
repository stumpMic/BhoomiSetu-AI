import { apiClient } from './apiClient';

export const verificationService = {
  // 1. Send OTP (Simulated SMS/Email)
  sendOtp: async (identifier, accountType = 'Landowner') => {
    const response = await apiClient.post('/auth/send-otp', {
      identifier,
      account_type: accountType
    });
    return response.data;
  },

  // 2. Verify OTP
  verifyOtp: async (identifier, otpCode) => {
    const response = await apiClient.post('/auth/verify-otp', {
      identifier,
      otp_code: otpCode
    });
    return response.data;
  },

  // 3. Register Landowner with optional document file
  registerLandowner: async (formData) => {
    const response = await apiClient.post('/auth/register/landowner', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 4. Register Officer with optional document file
  registerOfficer: async (formData) => {
    const response = await apiClient.post('/auth/register/officer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 5. Get Sample Verification Records for Demo Testing
  getSampleRecords: async () => {
    const response = await apiClient.get('/auth/verification-records/sample');
    return response.data;
  },

  // 6. Admin: Get Verification Stats
  getVerificationStats: async () => {
    const response = await apiClient.get('/admin/verifications/stats');
    return response.data;
  },

  // 7. Admin: Get Pending Verification Requests
  getPendingVerifications: async () => {
    const response = await apiClient.get('/admin/verifications/pending');
    return response.data;
  },

  // 8. Admin: Get All Verification Requests
  getAllVerifications: async (statusFilter = null) => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const response = await apiClient.get('/admin/verifications/all', { params });
    return response.data;
  },

  // 9. Admin: Review (Approve / Reject) Verification Request
  reviewVerification: async (requestId, action, rejectionReason = '', notes = '') => {
    const response = await apiClient.put(`/admin/verifications/${requestId}/review`, {
      action,
      rejection_reason: rejectionReason,
      notes
    });
    return response.data;
  }
};
