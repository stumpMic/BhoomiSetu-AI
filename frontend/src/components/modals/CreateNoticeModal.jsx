import React, { useState, useEffect } from 'react';
import { X, FileText, Send, AlertTriangle, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { noticeService } from '../../services/noticeService';
import { caseService } from '../../services/caseService';
import { useNotifications } from '../../context/NotificationContext';

export const CreateNoticeModal = ({
  isOpen,
  onClose,
  caseId,
  caseNumber,
  noticeToEdit = null,
  onNoticeSaved,
  onNoticeCreated
}) => {
  const { showToast } = useNotifications();
  const [submitting, setSubmitting] = useState(false);
  const [casesList, setCasesList] = useState([]);

  const isEdit = Boolean(noticeToEdit);

  const [formData, setFormData] = useState({
    case_id: caseId || null,
    case_number: caseNumber || '',
    notice_number: `NOTICE-OD-2026-${Math.floor(100 + Math.random() * 900)}`,
    notice_type: 'Section 15 Objections Notice',
    title: '',
    content_summary: '',
    priority: 'Normal',
    deadline: '',
    issuing_authority: 'Land Acquisition Officer, Khurda District',
    publish_date: new Date().toISOString().split('T')[0],
    status: 'Draft'
  });

  useEffect(() => {
    // Load cases for optional selection
    caseService.getCases().then(res => {
      if (Array.isArray(res)) setCasesList(res);
      else if (res && res.cases) setCasesList(res.cases);
    }).catch(() => setCasesList([]));
  }, []);

  useEffect(() => {
    if (noticeToEdit) {
      setFormData({
        case_id: noticeToEdit.case_id || null,
        case_number: noticeToEdit.case_number || '',
        notice_number: noticeToEdit.notice_number || '',
        notice_type: noticeToEdit.notice_type || 'Section 15 Objections Notice',
        title: noticeToEdit.title || '',
        content_summary: noticeToEdit.content_summary || '',
        priority: noticeToEdit.priority || 'Normal',
        deadline: noticeToEdit.deadline ? noticeToEdit.deadline.split('T')[0] : '',
        issuing_authority: noticeToEdit.issuing_authority || 'Land Acquisition Officer, Khurda District',
        publish_date: noticeToEdit.publish_date ? noticeToEdit.publish_date.split('T')[0] : new Date().toISOString().split('T')[0],
        status: noticeToEdit.status || 'Draft'
      });
    } else {
      setFormData({
        case_id: caseId || null,
        case_number: caseNumber || (caseId ? `CASE-OD-2026-00${caseId}` : ''),
        notice_number: `NOTICE-OD-2026-${Math.floor(100 + Math.random() * 900)}`,
        notice_type: 'Section 15 Objections Notice',
        title: 'Notice Inviting Objections on Sub-Plot Demarcation & Title Claims',
        content_summary: 'Inviting recorded title holders of Mouza Pipili to submit written objections under Section 15 regarding sub-plot boundary demarcation within 60 days.',
        priority: 'Normal',
        deadline: '',
        issuing_authority: 'Land Acquisition Officer, Khurda District',
        publish_date: new Date().toISOString().split('T')[0],
        status: 'Draft'
      });
    }
  }, [noticeToEdit, caseId, caseNumber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e, forcePublish = false) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        case_id: formData.case_id ? Number(formData.case_id) : null,
        status: forcePublish ? 'Published' : formData.status,
        deadline: formData.deadline || null
      };

      let result;
      if (isEdit && noticeToEdit?.id) {
        result = await noticeService.updateNotice(noticeToEdit.id, payload);
        if (forcePublish && result.status !== 'Published') {
          result = await noticeService.publishNotice(noticeToEdit.id);
        }
        showToast(`Notice ${result.notice_number} updated successfully!`, 'success');
      } else {
        result = await noticeService.createNotice(payload);
        if (forcePublish) {
          result = await noticeService.publishNotice(result.id);
        }
        showToast(
          forcePublish
            ? `Notice ${result.notice_number} published directly to Home Page!`
            : `Notice ${result.notice_number} saved as Draft.`,
          'success'
        );
      }

      if (onNoticeSaved) onNoticeSaved(result);
      if (onNoticeCreated) onNoticeCreated(result);
      onClose();
    } catch (err) {
      showToast('Failed to save notice: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="p-5 bg-gradient-to-r from-govblue-900 to-govblue-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-base">
                {isEdit ? 'Edit Statutory Acquisition Notice' : 'Create Statutory Acquisition Notice'}
              </h2>
              <p className="text-[11px] text-slate-300">
                {isEdit ? 'Modify draft or published public notice specifications' : 'Publish notifications under RFCTLARR Act 2013'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-4 text-xs font-medium">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                Notice Number
              </label>
              <input
                type="text"
                required
                value={formData.notice_number}
                onChange={(e) => setFormData({ ...formData, notice_number: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                Notice Type / Section
              </label>
              <select
                value={formData.notice_type}
                onChange={(e) => setFormData({ ...formData, notice_type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none font-bold"
              >
                <option value="Section 4(1) Preliminary Notification">Section 4(1) Preliminary Notification</option>
                <option value="Section 11(1) Declaration">Section 11(1) Declaration</option>
                <option value="Section 15 Objections Notice">Section 15 Objections Notice</option>
                <option value="Section 19(1) Award Notice">Section 19(1) Award Notice</option>
                <option value="Section 21 Public Hearing Notice">Section 21 Public Hearing Notice</option>
                <option value="Survey & Joint Demarcation Notice">Survey & Joint Demarcation Notice</option>
                <option value="Official Gazette / Public Notice">Official Gazette / Public Notice</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
              Notice Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Preliminary Notification for Acquisition of Land in Mouza Pipili..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none font-bold ${
                  formData.priority === 'Urgent'
                    ? 'text-rose-700 bg-rose-50 border-rose-300'
                    : formData.priority === 'Important'
                    ? 'text-amber-700 bg-amber-50 border-amber-300'
                    : 'text-blue-700 bg-blue-50 border-blue-200'
                }`}
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                Target Case (Optional)
              </label>
              <select
                value={formData.case_id || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const c = casesList.find(x => x.id === Number(val));
                  setFormData({
                    ...formData,
                    case_id: val ? Number(val) : null,
                    case_number: c ? c.case_number : ''
                  });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none font-mono"
              >
                <option value="">General Public Notice (No Case)</option>
                {casesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} - {c.title || c.project_name || 'Project Case'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
              Full Notice Content & Summary Text
            </label>
            <textarea
              rows={4}
              required
              placeholder="Provide comprehensive details, affected survey plots, statutory grounds, and instructions for affected landowners..."
              value={formData.content_summary}
              onChange={(e) => setFormData({ ...formData, content_summary: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                Publication Date
              </label>
              <input
                type="date"
                required
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                Response Deadline (Optional)
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
              Issuing Authority
            </label>
            <input
              type="text"
              value={formData.issuing_authority}
              onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Draft</strong> notices are visible only to the Land Acquisition Officer. When published, they will immediately appear on the <strong>Public Notice Board</strong> on the BhoomiSetu Home Page.
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Save as Draft'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, true)}
                className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Publishing...' : 'Publish to Public Portal'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
