import React, { useState, useEffect } from 'react';
import { grievanceService } from '../../services/grievanceService';
import { useNotifications } from '../../context/NotificationContext';
import { MessageSquareWarning, CheckCircle2, Clock, User, Filter, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const GrievanceManagementPage = () => {
  const { t } = useTranslation();
  const { showToast } = useNotifications();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [remarks, setRemarks] = useState('');

  const loadGrievances = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await grievanceService.getGrievances();
      setGrievances(data || []);
      if (data && data.length > 0) {
        setSelectedGrievance(data[0]);
      } else {
        setSelectedGrievance(null);
      }
    } catch (err) {
      console.error('Failed to load grievances:', err);
      setError('Unable to load grievance records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrievances();
  }, []);

  const handleUpdateStatus = async (status) => {
    if (!selectedGrievance) return;
    try {
      await grievanceService.updateStatus(selectedGrievance.id, status, remarks || `Status set to ${status}`);
      showToast(`Grievance status updated to '${status}'`, 'success');
      loadGrievances();
    } catch (err) {
      showToast('Status update failed: ' + err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
        <span className="text-xs font-semibold text-slate-500">Loading grievance records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600 border border-rose-100">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Unable to load grievance records</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {error || 'Unable to connect to grievance redressal services. Please try again.'}
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={loadGrievances}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!selectedGrievance) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <MessageSquareWarning className="w-12 h-12 text-slate-300 mx-auto" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">No Grievances Found</h2>
          <p className="text-xs text-slate-500 mt-1">There are currently no objections or grievances submitted.</p>
        </div>
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={loadGrievances}
            className="inline-flex items-center gap-2 px-4 py-2 bg-govblue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquareWarning className="w-6 h-6 text-govblue-700" />
          <span>{t('nav.grievances')}</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Public objections, compensation disputes, and redressal audit logs.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Grievance Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Objections Queue ({grievances.length})
            </span>
          </div>
          {grievances.map((g) => (
            <div
              key={g.id}
              onClick={() => setSelectedGrievance(g)}
              className={`p-4 cursor-pointer transition-all ${
                selectedGrievance.id === g.id ? 'bg-govblue-50/80 border-l-4 border-govblue-700' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-bold text-xs text-slate-900">{g.grievance_number}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  g.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {g.status}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{g.subject}</h4>
              <div className="text-[11px] text-slate-500 mt-1">
                By: {g.landowner_name} • Plot #{g.plot_number || '142/A'}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Redressal View */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {selectedGrievance.category}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedGrievance.subject}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Filed by <strong>{selectedGrievance.landowner_name}</strong> on {new Date(selectedGrievance.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              selectedGrievance.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {selectedGrievance.status}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Grievance Description
            </h4>
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed">
              {selectedGrievance.description}
            </div>
          </div>

          {/* Timeline Updates */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Chronological Audit Trail
            </h4>
            <div className="space-y-2">
              {selectedGrievance.updates?.map((u, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-govblue-600 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <div className="font-bold text-slate-900">{u.stage}</div>
                    <p className="text-slate-600 mt-0.5">{u.remarks}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {new Date(u.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Resolution Form */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hearing / Resolution Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Scheduled hearing with Tahsildar and co-sharer on 28th Aug. Consent obtained."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdateStatus('Resolved')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Resolved</span>
              </button>
              <button
                onClick={() => handleUpdateStatus('Under Hearing')}
                className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
              >
                Schedule Hearing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
