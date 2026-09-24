import React, { useState, useEffect } from 'react';
import { X, CheckSquare, UserCheck, Calendar } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { useNotifications } from '../../context/NotificationContext';

export const AssignTaskModal = ({ isOpen, onClose, preselectedCaseId, preselectedCaseNumber, onTaskAssigned }) => {
  const { showToast } = useNotifications();
  const [submitting, setSubmitting] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [formData, setFormData] = useState({
    title: "Joint Survey & Cadastral Plot Boundary Demarcation",
    description: "Conduct physical joint boundary survey for Plot #142 and resolve sub-plot boundary discrepancy.",
    case_id: preselectedCaseId || 4,
    case_number: preselectedCaseNumber || "CASE-OD-2026-004",
    project_id: 1,
    assigned_department_id: 1,
    assigned_officer_id: 4,
    assigned_officer_name: "Shri Rajesh Jena",
    priority: "High",
    deadline: "2026-09-25",
    remarks: "Survey report with geotagged boundary coordinates to be uploaded directly upon field completion."
  });

  useEffect(() => {
    taskService.getSurveyOfficers().then(setOfficers);
  }, []);

  useEffect(() => {
    if (preselectedCaseId) {
      setFormData(prev => ({ ...prev, case_id: preselectedCaseId, case_number: preselectedCaseNumber }));
    }
  }, [preselectedCaseId, preselectedCaseNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await taskService.createTask(formData);
      showToast(`Task assigned to ${formData.assigned_officer_name}! Officer notified via system alert.`, 'success');
      if (onTaskAssigned) onTaskAssigned(created);
      onClose();
    } catch (err) {
      showToast('Failed to assign task: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 bg-gradient-to-r from-govblue-900 to-govblue-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">Assign Task to Survey Officer</h2>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Task Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Task Scope & Field Instructions</label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Assigned Survey Officer</label>
              <select
                value={formData.assigned_officer_id}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  const off = officers.find(o => o.id === selectedId);
                  setFormData({
                    ...formData,
                    assigned_officer_id: selectedId,
                    assigned_officer_name: off ? off.full_name : "Shri Rajesh Jena"
                  });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              >
                {officers.map(o => (
                  <option key={o.id} value={o.id}>{o.full_name} ({o.department})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Completion Deadline</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Associated Case</label>
              <input
                type="text"
                disabled
                value={formData.case_number}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-600 text-xs"
              />
            </div>
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
              {submitting ? 'Assigning...' : 'Assign Survey Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
