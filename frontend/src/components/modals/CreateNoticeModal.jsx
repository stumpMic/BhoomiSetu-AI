import React, { useState, useEffect } from 'react';
import { X, FileText, Send, AlertTriangle } from 'lucide-react';
import { noticeService } from '../../services/noticeService';
import { useNotifications } from '../../context/NotificationContext';

export const CreateNoticeModal = ({ isOpen, onClose, caseId, caseNumber, onNoticeCreated }) => {
  const { showToast } = useNotifications();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    case_id: caseId || 4,
    case_number: caseNumber || "CASE-OD-2026-004",
    notice_number: `NOTICE-OD-2026-${Math.floor(100 + Math.random() * 900)}`,
    notice_type: "Section 15 Objections Notice",
    title: "Notice Inviting Objections on Sub-Plot Demarcation & Title Claims",
    content_summary: "Inviting recorded title holders of Mouza Pipili to submit written objections under Section 15 regarding sub-plot boundary demarcation within 60 days.",
    issuing_authority: "Land Acquisition Officer, Khurda District",
    publish_date: "2026-09-05",
    status: "Draft"
  });

  useEffect(() => {
    if (caseId) {
      setFormData(prev => ({ ...prev, case_id: caseId, case_number: caseNumber }));
    }
  }, [caseId, caseNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await noticeService.createNotice(formData);
      showToast(`Notice ${created.notice_number} created as Draft! Review and publish when authorized.`, 'success');
      if (onNoticeCreated) onNoticeCreated(created);
      onClose();
    } catch (err) {
      showToast('Failed to create notice: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 bg-gradient-to-r from-govblue-900 to-govblue-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">Create Statutory Acquisition Notice</h2>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Notice Number</label>
              <input
                type="text"
                required
                value={formData.notice_number}
                onChange={(e) => setFormData({ ...formData, notice_number: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Notice Type / Section</label>
              <select
                value={formData.notice_type}
                onChange={(e) => setFormData({ ...formData, notice_type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none font-bold"
              >
                <option value="Section 4(1) Preliminary Notification">Section 4(1) Preliminary Notification</option>
                <option value="Section 15 Objections Notice">Section 15 Objections Notice</option>
                <option value="Section 11(1) Declaration">Section 11(1) Declaration</option>
                <option value="Section 19(1) Award Notice">Section 19(1) Award Notice</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Notice Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Official Summary & Public Notice Text</label>
            <textarea
              rows={3}
              required
              value={formData.content_summary}
              onChange={(e) => setFormData({ ...formData, content_summary: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Issuing Authority</label>
              <input
                type="text"
                value={formData.issuing_authority}
                onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Publication Date</label>
              <input
                type="date"
                required
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Notice will be saved as <strong>Draft</strong>. The LAO can review, edit, and click <strong>Publish Notice</strong> when ready.
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {submitting ? 'Creating Notice...' : 'Save Draft Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
