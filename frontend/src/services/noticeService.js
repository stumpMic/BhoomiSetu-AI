import { apiClient } from './apiClient';

export const noticeService = {
  getNotices: async (filters = {}) => {
    const res = await apiClient.get('/notices', { params: filters });
    return res.data;
  },

  getPublicNotices: async (filters = {}) => {
    const params = { status_filter: 'Published', active_only: true, ...filters };
    const res = await apiClient.get('/notices', { params });
    return res.data;
  },

  getNoticeById: async (id) => {
    const res = await apiClient.get(`/notices/${id}`);
    return res.data;
  },

  createNotice: async (noticeData) => {
    const res = await apiClient.post('/notices', noticeData);
    return res.data;
  },

  updateNotice: async (id, noticeData) => {
    const res = await apiClient.put(`/notices/${id}`, noticeData);
    return res.data;
  },

  publishNotice: async (id) => {
    const res = await apiClient.put(`/notices/${id}/publish`);
    return res.data;
  },

  deactivateNotice: async (id) => {
    const res = await apiClient.put(`/notices/${id}/deactivate`);
    return res.data;
  },

  deleteNotice: async (id) => {
    const res = await apiClient.delete(`/notices/${id}`);
    return res.data;
  },

  sendNoticeToLandowners: async (id) => {
    const res = await apiClient.put(`/notices/${id}/send`);
    return res.data;
  }
};
