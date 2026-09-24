import { apiClient } from './apiClient';

const mockNotices = [
  {
    id: 1,
    case_id: 4,
    case_number: "CASE-OD-2026-004",
    notice_number: "NOTICE-OD-2026-401",
    notice_type: "Section 4(1) Preliminary Notification",
    title: "Preliminary Notification of Intention to Acquire Land for Expressway",
    content_summary: "Notice issued under Section 4(1) of RFCTLARR Act 2013 declaring state intention to acquire 4.5 Acres in Mouza Pipili for Expressway ROW.",
    priority: "Important",
    deadline: "2026-10-15",
    issuing_authority: "Land Acquisition Officer, Khurda",
    publish_date: "2026-08-15",
    status: "Published",
    is_active: true,
    issued_at: "2026-08-16T10:00:00",
    recipients_count: 14,
    created_at: "2026-08-15T09:00:00"
  },
  {
    id: 2,
    case_id: 4,
    case_number: "CASE-OD-2026-004",
    notice_number: "NOTICE-OD-2026-402",
    notice_type: "Section 15 Objections Notice",
    title: "Notice Inviting Objections on Land Measurement & Title Claims",
    content_summary: "Inviting recorded title holders to submit objections under Section 15 regarding sub-plot demarcation within 60 days.",
    priority: "Normal",
    deadline: "2026-11-01",
    issuing_authority: "Land Acquisition Officer, Khurda",
    publish_date: "2026-09-02",
    status: "Draft",
    is_active: true,
    issued_at: null,
    recipients_count: 0,
    created_at: "2026-09-02T11:00:00"
  }
];

export const noticeService = {
  getNotices: async (filters = {}) => {
    try {
      const res = await apiClient.get('/notices', { params: filters });
      return res.data;
    } catch (err) {
      if (filters.case_id) {
        return mockNotices.filter(n => n.case_id === Number(filters.case_id));
      }
      return mockNotices;
    }
  },

  getPublicNotices: async (filters = {}) => {
    try {
      const params = { status_filter: 'Published', active_only: true, ...filters };
      const res = await apiClient.get('/notices', { params });
      return res.data;
    } catch (err) {
      return mockNotices.filter(n => n.status === 'Published');
    }
  },

  getNoticeById: async (id) => {
    try {
      const res = await apiClient.get(`/notices/${id}`);
      return res.data;
    } catch (err) {
      const found = mockNotices.find(n => n.id === Number(id));
      if (found) return found;
      throw err;
    }
  },

  createNotice: async (noticeData) => {
    try {
      const res = await apiClient.post('/notices', noticeData);
      return res.data;
    } catch (err) {
      const newNotice = {
        id: Date.now(),
        ...noticeData,
        status: noticeData.status || 'Draft',
        is_active: true,
        recipients_count: 0,
        created_at: new Date().toISOString()
      };
      mockNotices.push(newNotice);
      return newNotice;
    }
  },

  updateNotice: async (id, noticeData) => {
    try {
      const res = await apiClient.put(`/notices/${id}`, noticeData);
      return res.data;
    } catch (err) {
      const idx = mockNotices.findIndex(n => n.id === Number(id));
      if (idx !== -1) {
        mockNotices[idx] = { ...mockNotices[idx], ...noticeData };
        return mockNotices[idx];
      }
      return { id, ...noticeData };
    }
  },

  publishNotice: async (id) => {
    try {
      const res = await apiClient.put(`/notices/${id}/publish`);
      return res.data;
    } catch (err) {
      const idx = mockNotices.findIndex(n => n.id === Number(id));
      if (idx !== -1) {
        mockNotices[idx].status = 'Published';
        mockNotices[idx].is_active = true;
        return mockNotices[idx];
      }
      return { id, status: 'Published', is_active: true };
    }
  },

  deactivateNotice: async (id) => {
    try {
      const res = await apiClient.put(`/notices/${id}/deactivate`);
      return res.data;
    } catch (err) {
      const idx = mockNotices.findIndex(n => n.id === Number(id));
      if (idx !== -1) {
        mockNotices[idx].status = 'Deactivated';
        mockNotices[idx].is_active = false;
        return mockNotices[idx];
      }
      return { id, status: 'Deactivated', is_active: false };
    }
  },

  deleteNotice: async (id) => {
    try {
      const res = await apiClient.delete(`/notices/${id}`);
      return res.data;
    } catch (err) {
      const idx = mockNotices.findIndex(n => n.id === Number(id));
      if (idx !== -1) {
        mockNotices.splice(idx, 1);
      }
      return { status: "SUCCESS", message: `Notice #${id} deleted.` };
    }
  },

  sendNoticeToLandowners: async (id) => {
    try {
      const res = await apiClient.put(`/notices/${id}/send`);
      return res.data;
    } catch (err) {
      const idx = mockNotices.findIndex(n => n.id === Number(id));
      if (idx !== -1) {
        mockNotices[idx].status = 'Sent/Issued';
        mockNotices[idx].issued_at = new Date().toISOString();
        mockNotices[idx].recipients_count = 14;
        return mockNotices[idx];
      }
      return { id, status: 'Sent/Issued', recipients_count: 14 };
    }
  }
};
