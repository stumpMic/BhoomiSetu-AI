import React, { useState } from 'react';
import { X, FolderPlus, Calendar, MapPin, FileText } from 'lucide-react';
import { caseService } from '../../services/caseService';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const CreateCaseModal = ({ isOpen, onClose, onCaseCreated }) => {
  const { showToast } = useNotifications();
  const { isRole } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [plotError, setPlotError] = useState('');
  const [formData, setFormData] = useState({
    case_number: `CASE-OD-2026-${Math.floor(100 + Math.random() * 900)}`,
    plot_number: "142/A",
    project_id: 1,
    project_name: "Bhubaneswar-Puri Expressway Corridor",
    village_id: 1,
    village_name: "Pipili",
    district: "Khurda",
    notification_section: "4(1)",
    current_stage: "Joint Survey & Verification",
    target_deadline: "2026-11-30"
  });

  if (!isOpen || !isRole(['admin', 'land_acquisition_officer'])) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const plotRegex = /^[0-9A-Za-z/_\-]+$/;
    if (!formData.plot_number || !plotRegex.test(formData.plot_number.trim())) {
      setPlotError("Please enter a valid plot number (e.g. 142/A). Only letters, numbers, '/', '-', and '_' are allowed.");
      return;
    }
    setPlotError('');
    setSubmitting(true);
    try {
      const created = await caseService.createCase(formData);
      showToast(`Case ${created.case_number} created successfully with Plot #${created.plot_number || formData.plot_number}! Live risk model initialized.`, 'success');
      if (onCaseCreated) onCaseCreated(created);
      onClose();
    } catch (err) {
      showToast('Failed to create case: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 bg-gradient-to-r from-govblue-900 to-govblue-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">Create New Acquisition Case</h2>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Case Number *</label>
              <input
                type="text"
                required
                value={formData.case_number}
                onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Plot Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 142/A"
                value={formData.plot_number}
                onChange={(e) => {
                  setFormData({ ...formData, plot_number: e.target.value });
                  if (plotError) setPlotError('');
                }}
                className={`w-full p-2.5 rounded-xl border ${plotError ? 'border-rose-400 bg-rose-50/50 ring-1 ring-rose-400' : 'border-slate-200'} font-mono text-xs focus:ring-2 focus:ring-govblue-500 outline-none`}
              />
              {plotError && <p className="text-rose-600 text-[10px] mt-1 font-semibold">{plotError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Infrastructure Project</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              >
                <option value={1}>Bhubaneswar-Puri Expressway</option>
                <option value={2}>Khordha-Balangir Railway Line</option>
                <option value={3}>Mahanadi Basin Water Reservoir</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Village & District</label>
              <select
                value={formData.village_id}
                onChange={(e) => setFormData({ ...formData, village_id: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              >
                <option value={1}>Pipili, Khurda</option>
                <option value={2}>Delanga, Puri</option>
                <option value={3}>Jatni, Khurda</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Statutory Section</label>
              <select
                value={formData.notification_section}
                onChange={(e) => setFormData({ ...formData, notification_section: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              >
                <option value="4(1)">Sec 4(1) - Preliminary Notification</option>
                <option value="6(1)">Sec 6(1) - Declaration</option>
                <option value="11(1)">Sec 11(1) - Preliminary Notification</option>
                <option value="19(1)">Sec 19(1) - Declaration of Acquisition</option>
                <option value="Award">Sec 23 - Award Determination</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Target Deadline</label>
              <input
                type="date"
                required
                value={formData.target_deadline}
                onChange={(e) => setFormData({ ...formData, target_deadline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Initial Acquisition Stage</label>
            <select
              value={formData.current_stage}
              onChange={(e) => setFormData({ ...formData, current_stage: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            >
              <option value="Joint Survey & Verification">Joint Survey & Verification</option>
              <option value="Objections & Hearing (Sec 15)">Objections & Hearing (Sec 15)</option>
              <option value="Valuation & Award Determination">Valuation & Award Determination</option>
              <option value="Compensation Disbursement">Compensation Disbursement</option>
            </select>
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
              {submitting ? 'Creating Case...' : 'Create Acquisition Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
