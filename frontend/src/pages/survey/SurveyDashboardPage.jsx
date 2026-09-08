import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { surveyService } from '../../services/surveyService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Compass,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileCheck,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Building2,
  PlusCircle,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Map,
  X
} from 'lucide-react';

export const SurveyDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_assigned: 0,
    pending_surveys: 0,
    scheduled_surveys: 0,
    in_progress_surveys: 0,
    submitted_surveys: 0,
    completed_surveys: 0,
    resurvey_required: 0,
    returned_for_correction: 0,
    approaching_deadline_count: 0,
    overdue_count: 0,
    waiting_for_documents_count: 0,
    waiting_for_resurvey_count: 0,
    avg_survey_duration_days: 0.0,
    avg_delay_risk_pct: 0.0
  });

  const [surveys, setSurveys] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Survey Request Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    case_id: 1,
    parcel_id: 1,
    priority: 'Medium',
    purpose: 'Highway Widening Cadastral Demarcation',
    instructions: 'Verify all physical boundary pillars and record irrigation structures.'
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, surveysList] = await Promise.all([
        surveyService.getDashboardSummary(),
        surveyService.getSurveys({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
          district: districtFilter || undefined,
          search: searchQuery || undefined
        })
      ]);
      setSummary(sumData);
      setSurveys(surveysList);
    } catch (err) {
      showToast('Failed to load survey operations data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, districtFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateSurveyRequest = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    try {
      await surveyService.createSurveyRequest(newRequestData);
      showToast('New Survey Request created and assigned successfully!', 'success');
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create survey request', 'error');
    } finally {
      setSubmittingRequest(false);
    }
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

  const getPriorityBadge = (p) => {
    if (p === 'Urgent') return 'bg-rose-600 text-white font-black';
    if (p === 'High') return 'bg-amber-500 text-white font-bold';
    if (p === 'Medium') return 'bg-govblue-600 text-white font-medium';
    return 'bg-slate-200 text-slate-700 font-medium';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-govblue-900 via-slate-900 to-govblue-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                Survey Officer Operations Dashboard
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Cadastral Field Survey, DGPS Demarcation, Document Vetting & Structured Delay Analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {['admin', 'land_acquisition_officer', 'project_authority'].includes(user?.role) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Survey Request</span>
            </button>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Operational Status KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Assigned', val: summary.total_assigned, color: 'text-slate-900', bg: 'bg-white', icon: Compass },
          { label: 'Pending Accept', val: summary.pending_surveys, color: 'text-blue-700', bg: 'bg-blue-50/40', icon: Clock },
          { label: 'Scheduled', val: summary.scheduled_surveys, color: 'text-purple-700', bg: 'bg-purple-50/40', icon: Calendar },
          { label: 'In Progress', val: summary.in_progress_surveys, color: 'text-amber-700', bg: 'bg-amber-50/40', icon: MapPin },
          { label: 'Submitted', val: summary.submitted_surveys, color: 'text-teal-700', bg: 'bg-teal-50/40', icon: FileCheck },
          { label: 'Completed', val: summary.completed_surveys, color: 'text-emerald-700', bg: 'bg-emerald-50/40', icon: CheckCircle2 },
          { label: 'Resurvey', val: summary.resurvey_required, color: 'text-rose-700', bg: 'bg-rose-50/40', icon: RotateCcw },
          { label: 'Returned', val: summary.returned_for_correction, color: 'text-orange-700', bg: 'bg-orange-50/40', icon: AlertTriangle }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={`${item.bg} p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className={`text-2xl font-black mt-2 ${item.color}`}>
                {item.val}
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Delay Indicators & ML Risk Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ML Delay Prediction Card */}
        <div className="bg-gradient-to-br from-slate-900 via-govblue-950 to-slate-900 text-white p-5 rounded-2xl border border-govblue-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Survey Delay Risk (ML Model)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
              RandomForest Inference
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <div className="text-3xl font-black text-amber-400">{summary.avg_delay_risk_pct}%</div>
            <div className="text-xs text-slate-300">Average Acquisition Delay Probability</div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Derived from cadastral parcel features, document mismatch rate, ownership disputes, and historical survey resurvey bottlenecks.
          </p>
        </div>

        {/* Operational Bottlenecks Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Operational Delay Bottlenecks</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
              <div className="text-xs font-semibold text-rose-700">Overdue Surveys</div>
              <div className="text-xl font-black text-rose-900 mt-0.5">{summary.overdue_count}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <div className="text-xs font-semibold text-amber-700">Due in 7 Days</div>
              <div className="text-xl font-black text-amber-900 mt-0.5">{summary.approaching_deadline_count}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-xs font-semibold text-blue-700">Doc Issues</div>
              <div className="text-xl font-black text-blue-900 mt-0.5">{summary.waiting_for_documents_count}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100">
              <div className="text-xs font-semibold text-purple-700">Resurveys</div>
              <div className="text-xl font-black text-purple-900 mt-0.5">{summary.waiting_for_resurvey_count}</div>
            </div>
          </div>
        </div>

        {/* Velocity Metric Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Survey Velocity & Execution</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{summary.avg_survey_duration_days}</span>
              <span className="text-xs font-bold text-slate-500">Days Average Turnaround</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Standard turnaround SLA is 14 days per cadastral parcel from LAO assignment to digital report confirmation.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Cadastral Precision: <strong>DGPS / ETS</strong></span>
            <span className="text-emerald-700 font-bold">100% Geo-Tagged</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Survey Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
            >
              <option value="ALL">All Statuses ({summary.total_assigned})</option>
              <option value="ASSIGNED">Assigned ({summary.pending_surveys})</option>
              <option value="SCHEDULED">Scheduled ({summary.scheduled_surveys})</option>
              <option value="IN_PROGRESS">In Progress ({summary.in_progress_surveys})</option>
              <option value="SUBMITTED">Submitted ({summary.submitted_surveys})</option>
              <option value="COMPLETED">Completed ({summary.completed_surveys})</option>
              <option value="RESURVEY_REQUIRED">Resurvey Required ({summary.resurvey_required})</option>
              <option value="RETURNED">Returned ({summary.returned_for_correction})</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
            >
              <option value="">All Districts</option>
              <option value="Khurda">Khurda</option>
              <option value="Puri">Puri</option>
              <option value="Cuttack">Cuttack</option>
              <option value="Jagatsinghpur">Jagatsinghpur</option>
            </select>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Plot, Landowner..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500"
            />
          </form>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-govblue-600" />
              Loading survey requests...
            </div>
          ) : surveys.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Survey Requests Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Survey ID & Project</th>
                  <th className="py-3.5 px-4">Landowner & Parcel</th>
                  <th className="py-3.5 px-4">Jurisdiction & Area</th>
                  <th className="py-3.5 px-4">Key Dates & Deadline</th>
                  <th className="py-3.5 px-4 text-center">Priority</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveys.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* ID & Project */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono text-[11px]">{s.request_number}</div>
                      <div className="text-[11px] text-govblue-700 font-semibold truncate max-w-xs">{s.project_name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.purpose}</div>
                    </td>

                    {/* Landowner & Parcel */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.landowner_name}</div>
                      <div className="text-[11px] text-slate-600">
                        Plot: <strong className="text-slate-800">{s.plot_number}</strong> | Khata: <strong>{s.khata_number}</strong>
                      </div>
                    </td>

                    {/* Jurisdiction & Area */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">{s.village_name}, {s.district}</div>
                      <div className="text-[11px] text-slate-500">
                        Area: <strong className="text-slate-700">{s.recorded_area_acres} Acres</strong>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 text-[11px]">
                      <div className="text-slate-500">
                        Assigned: {s.assignment_date ? new Date(s.assignment_date).toLocaleDateString() : 'N/A'}
                      </div>
                      {s.scheduled_date && (
                        <div className="text-purple-700 font-semibold">
                          Scheduled: {s.scheduled_date}
                        </div>
                      )}
                      {s.deadline && (
                        <div className={`font-semibold ${s.is_overdue ? 'text-rose-700' : 'text-slate-500'}`}>
                          Due: {s.deadline} {s.is_overdue && '⚠️ Overdue'}
                        </div>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${getPriorityBadge(s.priority)}`}>
                        {s.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(s.status)}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/survey/execute/${s.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-govblue-700 hover:bg-govblue-800 text-white font-bold text-xs transition-all shadow-sm"
                      >
                        <span>Open Survey</span>
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

      {/* Create Survey Request Modal (For LAO/Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-govblue-100 text-govblue-700 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Survey Request</h3>
                  <p className="text-xs text-slate-500">Assign cadastral demarcation survey to Survey Officer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSurveyRequest} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Acquisition Case *</label>
                  <select
                    value={newRequestData.case_id}
                    onChange={(e) => setNewRequestData({ ...newRequestData, case_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                  >
                    <option value={1}>CASE-OD-2026-001 (NH-316 Khurda)</option>
                    <option value={2}>CASE-OD-2026-002 (Outer Ring Road)</option>
                    <option value={3}>CASE-OD-2026-003 (Puri Logistics Park)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Parcel / Plot *</label>
                  <select
                    value={newRequestData.parcel_id}
                    onChange={(e) => setNewRequestData({ ...newRequestData, parcel_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                  >
                    <option value={1}>Plot 101 - Pipili (4.50 Acres)</option>
                    <option value={2}>Plot 102 - Pipili (2.80 Acres)</option>
                    <option value={4}>Plot 142/A - Pipili (4.50 Acres)</option>
                    <option value={7}>Plot 110 - Balipatna (2.45 Acres)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Priority</label>
                <select
                  value={newRequestData.priority}
                  onChange={(e) => setNewRequestData({ ...newRequestData, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-govblue-500 bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Survey Purpose *</label>
                <input
                  type="text"
                  required
                  value={newRequestData.purpose}
                  onChange={(e) => setNewRequestData({ ...newRequestData, purpose: e.target.value })}
                  placeholder="e.g. NH-316 Highway Expansion - Cadastral Field Demarcation"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Special Instructions for SO</label>
                <textarea
                  rows={2}
                  value={newRequestData.instructions}
                  onChange={(e) => setNewRequestData({ ...newRequestData, instructions: e.target.value })}
                  placeholder="e.g. Verify boundary pegs, check for irrigation structures, and verify co-sharer interests."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="w-2/3 bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {submittingRequest ? 'Creating Request...' : 'Confirm & Assign Survey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
