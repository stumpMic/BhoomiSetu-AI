import { apiClient, USE_MOCK_API } from './apiClient';

const mockNotices = [
  {
    id: 1,
    case_id: 4,
    case_number: "CASE-OD-2026-004",
    notice_number: "NOTICE-OD-2026-401",
    notice_type: "Section 4(1) Preliminary Notification",
    title: "Preliminary Notification of Intention to Acquire Land for Expressway",
    content_summary: "Notice issued under Section 4(1) of RFCTLARR Act 2013 declaring state intention to acquire 4.5 Acres in Mouza Pipili for Expressway ROW.",
    issuing_authority: "Land Acquisition Officer, Khurda",
    publish_date: "2026-08-15",
    status: "Published",
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
    issuing_authority: "Land Acquisition Officer, Khurda",
    publish_date: "2026-09-02",
    status: "Draft",
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

  createNotice: async (noticeData) => {
    try {
      const res = await apiClient.post('/notices', noticeData);
      return res.data;
    } catch (err) {
      const newNotice = {
        id: Date.now(),
        ...noticeData,
        status: 'Draft',
        recipients_count: 0,
        created_at: new Date().toISOString()
      };
      mockNotices.push(newNotice);
      return newNotice;
    }
  },

  publishNotice: async (id) => {
    try {
      const res = await apiClient.put(`/notices/${id}/publish`);
      return res.data;
    } catch (err) {
      const idx = mockNotices.findIndex(n => n.id === id);
      if (idx !== -1) {
        mockNotices[idx].status = 'Published';
        return mockNotices[idx];
      }
      return { id, status: 'Published' };
    }
  },

  sendNoticeToLandowners: async (id) => {
    try {
      const res = await apiClient.put(`/notices/${id}/send`);
      return res.data;
    } catch (err) {
      const idx = mockNotices.findIndex(n => n.id === id);
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
