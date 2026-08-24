import { apiClient, USE_MOCK_API } from './apiClient';
import ocrMock from '../../../contracts/examples/ocr-response.json';

export const documentService = {
  uploadDocument: async (formData) => {
    if (USE_MOCK_API) {
      return {
        document_id: 42,
        filename: "Uploaded_RoR.pdf",
        ocr_status: "Possible Mismatch",
        has_discrepancy: true,
        flagged_issues: ["Extracted Plot Number '142' does not match official survey plot '142/A' (Sub-plot subdivision mismatch)."]
      };
    }
    const res = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getOcrResult: async (id) => {
    if (USE_MOCK_API) return ocrMock;
    try {
      const res = await apiClient.get(`/documents/${id}/ocr-result`);
      return res.data;
    } catch (err) {
      return ocrMock;
    }
  },

  verifyDocument: async (id, status, remarks = '') => {
    const res = await apiClient.put(`/documents/${id}/verify`, {
      status,
      officer_remarks: remarks
    });
    return res.data;
  }
};
