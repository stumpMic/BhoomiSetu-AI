import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { surveyService } from '../../services/surveyService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Compass,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileCheck
} from 'lucide-react';

export const SurveyRequestsListPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await surveyService.getSurveys({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery || undefined
      });
      setSurveys(data);
    } catch (err) {
      showToast('Failed to load surveys list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const getStatusBadge = (st) => {
    const map = {
      ASSIGNED: 'bg-blue-50 text-blue-800 border-blue-200',
      ACCEPTED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      SCHEDULED: 'bg-purple-50 text-purple-800 border-purple-200',
      IN_PROGRESS: 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse',
      SUBMITTED: 'bg-teal-50 text-teal-800 border-teal-200',
      UNDER_REVIEW: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      COMPLETED: 'bg-emerald-100 text-emerald-900 border-emerald-400 font-black',
      RETURNED: 'bg-rose-50 text-rose-800 border-rose-300',
      RESURVEY_REQUIRED: 'bg-rose-100 text-rose-900 border-rose-400 font-black'
    };
    return map[st] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-govblue-700" />
            <span>Assigned Survey Requests</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete register of cadastral field surveys, assignments, and verification dossiers.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ASSIGNED', label: 'Assigned' },
              { id: 'SCHEDULED', label: 'Scheduled' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'SUBMITTED', label: 'Submitted' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'RESURVEY_REQUIRED', label: 'Resurvey' },
              { id: 'RETURNED', label: 'Returned' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === t.id
                    ? 'bg-govblue-700 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, plot, village..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-govblue-600" />
              Loading surveys...
            </div>
          ) : surveys.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Surveys Found</h3>
              <p className="text-xs text-slate-400 mt-1">No survey records match this category.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Survey ID & Project</th>
                  <th className="py-3.5 px-4">Landowner & Parcel</th>
                  <th className="py-3.5 px-4">Jurisdiction & Area</th>
                  <th className="py-3.5 px-4">Assigned / Scheduled</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveys.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono text-[11px]">{s.request_number}</div>
                      <div className="text-[11px] text-govblue-700 font-semibold">{s.project_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.landowner_name}</div>
                      <div className="text-[11px] text-slate-600">
                        Plot: <strong>{s.plot_number}</strong> | Khata: <strong>{s.khata_number}</strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">{s.village_name}, {s.district}</div>
                      <div className="text-[11px] text-slate-500">{s.recorded_area_acres} Acres</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      <div>Assigned: {s.assignment_date ? new Date(s.assignment_date).toLocaleDateString() : 'N/A'}</div>
                      {s.scheduled_date && (
                        <div className="text-purple-700 font-semibold">Scheduled: {s.scheduled_date}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(s.status)}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/survey/execute/${s.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-govblue-700 hover:bg-govblue-800 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <span>Execute Survey</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
