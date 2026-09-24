import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import { useNotifications } from '../../context/NotificationContext';
import { Plus, CheckSquare, Clock, AlertTriangle, CheckCircle2, User, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { AssignTaskModal } from '../../components/modals/AssignTaskModal';

export const TasksManagementPage = () => {
  const { t } = useTranslation();
  const { isRole } = useAuth();
  const { showToast } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    const data = await taskService.getTasks();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus, remarks: `Status updated to ${newStatus}` });
      showToast(`Task updated to '${newStatus}'. Recalculating case risk...`, 'success');
      loadTasks();
    } catch (err) {
      showToast('Error updating task: ' + err.message, 'error');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'OVERDUE') return t.is_overdue;
    if (filter === 'COMPLETED') return t.status === 'Completed';
    if (filter === 'PENDING') return t.status !== 'Completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-govblue-700" />
            <span>{t('nav.tasks')}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Inter-departmental statutory tasks, joint demarcations, and deadline monitors.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isRole(['admin', 'land_acquisition_officer', 'project_authority']) && (
            <button
              onClick={() => setIsAssignOpen(true)}
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Assign Task to Survey Officer</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
            {['ALL', 'PENDING', 'OVERDUE', 'COMPLETED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === f ? 'bg-govblue-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filteredTasks.map((t) => (
          <div key={t.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-all">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{t.title}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  t.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {t.priority}
                </span>
                {t.is_overdue && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                    OVERDUE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium pt-1">
                <span>Department: <strong className="text-slate-700">{t.assigned_department_name || 'Revenue & Disaster'}</strong></span>
                <span>Case: <strong className="text-govblue-700">{t.case_number || 'CASE-OD-2026-004'}</strong></span>
                <span>Deadline: <strong className="text-slate-800 font-mono">{t.deadline}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {t.status}
              </span>

              {t.status !== 'Completed' && (
                <button
                  onClick={() => handleUpdateStatus(t.id, 'Completed')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Done</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <AssignTaskModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onTaskAssigned={loadTasks}
      />
    </div>
  );
};
