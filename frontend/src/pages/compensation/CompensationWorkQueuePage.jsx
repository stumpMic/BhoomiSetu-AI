import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { compensationService } from '../../services/compensationService';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { RiskBadge } from '../../components/common/RiskBadge';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Building2,
  UserCheck,
  Send,
  Filter,
  Search,
  RefreshCw,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
  CheckSquare,
  ShieldAlert,
  Edit3,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Banknote
} from 'lucide-react';

const STAGES = [
  'Land valuation pending',
  'Valuation completed',
  'Compensation calculated',
  'Approval pending',
  'Compensation approved',
  'Landowner consent pending',
  'Bank verification',
  'Payment initiated',
  'Payment completed'
];

export const CompensationWorkQueuePage = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');

  // Action Modals State
  const [actionModalItem, setActionModalItem] = useState(null);
  const [targetDept, setTargetDept] = useState('Survey & Cadastral Directorate');
  const [actionType, setActionType] = useState('Expedite Cadastral Joint Survey');
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Advance Stage Modal State
  const [stageModalItem, setStageModalItem] = useState(null);
  const [stageRemarks, setStageRemarks] = useState('');
  const [submittingStage, setSubmittingStage] = useState(false);

  // Assessment Edit Modal State
  const [assessmentModalItem, setAssessmentModalItem] = useState(null);
  const [baseValuation, setBaseValuation] = useState('');
  const [solatium, setSolatium] = useState('');
  const [assessmentRemarks, setAssessmentRemarks] = useState('');
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  const fetchWorkQueue = async () => {
    setLoading(true);
    try {
      const data = await compensationService.getWorkQueue();
      setQueueData(data);
    } catch (err) {
      showToast('Failed to load compensation work queue: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !['admin', 'compensation_officer'].includes(user.role)) {
      navigate('/unauthorized');
      return;
    }
    fetchWorkQueue();
  }, [user, navigate]);

  const handleRequestActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModalItem) return;
    setSubmittingAction(true);
    try {
      await compensationService.requestAction({
        case_id: actionModalItem.case_id,
        compensation_id: actionModalItem.id,
        parcel_id: actionModalItem.parcel_id,
        target_department: targetDept,
        action_type: actionType,
        notes: actionNotes || `Urgent prerequisite clearance requested by Compensation Officer for Plot #${actionModalItem.plot_number}`
      });
      showToast(`Action request forwarded to ${targetDept}. Notification dispatched.`, 'success');
      setActionModalItem(null);
      setActionNotes('');
      fetchWorkQueue();
    } catch (err) {
      showToast('Failed to forward action request: ' + err.message, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAdvanceStageSubmit = async (e) => {
    e.preventDefault();
    if (!stageModalItem) return;
    const currentIdx = stageModalItem.stage_index || 1;
    if (currentIdx >= STAGES.length) {
      showToast('Compensation is already at the final stage (Payment Completed).', 'info');
      return;
    }
    const nextStage = STAGES[currentIdx];
    setSubmittingStage(true);
    try {
      await compensationService.updateStage(
        stageModalItem.id,
        nextStage,
        stageRemarks || `Advanced to ${nextStage} by Compensation Officer`
      );
      showToast(`Compensation advanced to '${nextStage}'. Risk recalculated & audit logged.`, 'success');
      setStageModalItem(null);
      setStageRemarks('');
      fetchWorkQueue();
    } catch (err) {
      showToast('Failed to advance stage: ' + err.message, 'error');
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!assessmentModalItem) return;
    const base = parseFloat(baseValuation) || 0;
    const sol = parseFloat(solatium) || 0;
    const total = base + sol;
    setSubmittingAssessment(true);
    try {
      await compensationService.updateAssessment(assessmentModalItem.id, {
        base_land_value_inr: base,
        solatium_100pct_inr: sol,
        total_award_inr: total,
        landowner_share_inr: total,
        remarks: assessmentRemarks || 'Valuation assessment reviewed and updated under RFCTLARR Section 23/30'
      });
      showToast(`Award recalculated: ₹${(total / 100000).toFixed(2)} Lakhs. Logged to audit trail.`, 'success');
      setAssessmentModalItem(null);
      fetchWorkQueue();
    } catch (err) {
      showToast('Assessment update failed: ' + err.message, 'error');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const items = queueData?.items || [];

  const filteredItems = items.filter((item) => {
    // 1. Tab filter
    if (activeTab === 'Ready' && item.work_status !== 'Ready for Compensation') return false;
    if (activeTab === 'In Progress' && item.work_status !== 'In Progress') return false;
    if (activeTab === 'Blocked' && item.work_status !== 'Blocked') return false;
    if (activeTab === 'Completed' && item.work_status !== 'Completed') return false;

    // 2. Risk filter
    if (riskFilter !== 'All' && item.ai_risk.risk_level.toLowerCase() !== riskFilter.toLowerCase()) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCase = item.case_number?.toLowerCase().includes(q);
      const matchOwner = item.landowner_name?.toLowerCase().includes(q);
      const matchPlot = item.plot_number?.toLowerCase().includes(q);
      const matchVillage = item.village_name?.toLowerCase().includes(q);
      const matchProject = item.project_name?.toLowerCase().includes(q);
      if (!matchCase && !matchOwner && !matchPlot && !matchVillage && !matchProject) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ready for Compensation':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Ready for Compensation
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-govblue-100 text-govblue-900 border border-govblue-300">
            <Clock className="w-3.5 h-3.5 text-govblue-700 animate-spin" />
            In Progress
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Blocked by Prerequisites
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            Payment Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider">
              Compensation Cell
            </span>
            <span className="text-xs text-slate-400">• Role-Scoped Workflow</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <CreditCard className="w-6 h-6 text-govblue-700" />
            <span>My Compensation Work</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Dedicated queue for Section 23/30 valuations, approval reviews, prerequisite blocker coordination, and DBT disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchWorkQueue}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/compensation"
            className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Full 9-Stage Tracker</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Work Items</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{queueData?.total_items || items.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across active cases</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Ready for Action</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {queueData?.ready_count ?? items.filter((i) => i.work_status === 'Ready for Compensation').length}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">Prerequisites satisfied</div>
        </div>

        <div className="bg-govblue-50/70 p-4 rounded-xl border border-govblue-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-govblue-700">In Progress</div>
          <div className="text-2xl font-black text-govblue-900 mt-1">
            {queueData?.in_progress_count ?? items.filter((i) => i.work_status === 'In Progress').length}
          </div>
          <div className="text-[10px] text-govblue-700 mt-0.5 font-medium">Stage 2 to 8 active</div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Blocked Work</div>
          <div className="text-2xl font-black text-rose-900 mt-1">
            {queueData?.blocked_count ?? items.filter((i) => i.work_status === 'Blocked').length}
          </div>
          <div className="text-[10px] text-rose-700 mt-0.5 font-medium">Survey / Doc / Title pending</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed</div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {queueData?.completed_count ?? items.filter((i) => i.work_status === 'Completed').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Disbursements finalized</div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Total Award Pool</div>
          <div className="text-2xl font-black text-amber-950 mt-1">
            ₹{queueData?.total_award_crores || 3.23} Cr
          </div>
          <div className="text-[10px] text-amber-800 mt-0.5 font-medium">RFCTLARR Sec 23 + Solatium</div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {['All', 'Ready', 'In Progress', 'Blocked', 'Completed'].map((tab) => {
              const isActive = activeTab === tab;
              let count = 0;
              if (tab === 'All') count = items.length;
              if (tab === 'Ready') count = items.filter((i) => i.work_status === 'Ready for Compensation').length;
              if (tab === 'In Progress') count = items.filter((i) => i.work_status === 'In Progress').length;
              if (tab === 'Blocked') count = items.filter((i) => i.work_status === 'Blocked').length;
              if (tab === 'Completed') count = items.filter((i) => i.work_status === 'Completed').length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-govblue-900 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab === 'Ready' ? 'Ready for Compensation' : tab}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-govblue-100 text-govblue-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Risk Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case, plot, landowner..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 focus:outline-none"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Queue Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
          <p className="text-xs text-slate-500 font-medium mt-3">Evaluating compensation prerequisites & AI risks...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No items found in this view</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === 'Blocked'
              ? 'Great! There are no blocked compensation items requiring interdepartmental action.'
              : 'Try clearing your search query or switching to another filter tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isBlocked = item.work_status === 'Blocked';
            const isReady = item.work_status === 'Ready for Compensation';
            const isCompleted = item.work_status === 'Completed';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all overflow-hidden ${
                  isBlocked
                    ? 'border-rose-200 hover:border-rose-300'
                    : isReady
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Item Card Header */}
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/cases/${item.case_id}`}
                        className="text-sm font-black text-govblue-900 hover:underline flex items-center gap-1"
                      >
                        <span>{item.case_number}</span>
                        <ExternalLink className="w-3 h-3 text-govblue-600" />
                      </Link>
                      {getStatusBadge(item.work_status)}
                      <RiskBadge risk={item.ai_risk.risk_level} />
                      <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Pending {item.days_pending} days</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      Project: <strong className="text-slate-800">{item.project_name}</strong> • Mouza/Village: {item.village_name}
                    </div>
                  </div>

                  {/* Quick Action Buttons Header */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {isBlocked ? (
                      <button
                        onClick={() => {
                          setActionModalItem(item);
                          setActionNotes(`Prerequisite clearance required for Plot #${item.plot_number} (${item.landowner_name}): ${item.blockers.join(', ')}`);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Department Action</span>
                      </button>
                    ) : isCompleted ? (
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        PFMS: {item.mock_payment_ref || 'DISBURSED'}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setAssessmentModalItem(item);
                            setBaseValuation(item.base_valuation_inr || 3375000);
                            setSolatium(item.solatium_100pct_inr || 3375000);
                          }}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Review Valuation</span>
                        </button>

                        <button
                          onClick={() => {
                            setStageModalItem(item);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Advance Stage</span>
                        </button>
                      </>
                    )}

                    <Link
                      to={`/cases/${item.case_id}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all"
                    >
                      <span>Case Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Main Card Body */}
                <div className="p-5 grid md:grid-cols-3 gap-6">
                  {/* Left Column: Beneficiary & Land Details */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-govblue-700" />
                      <span>Landowner & Parcel Info</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Beneficiary:</span>
                        <span className="font-bold text-slate-900">{item.landowner_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plot / Khata:</span>
                        <span className="font-bold text-slate-900">
                          Plot #{item.plot_number} • Khata #{item.khata_number}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Acquired Area:</span>
                        <span className="font-bold text-slate-800">{item.land_area_acres} Acres</span>
                      </div>
                      {item.landowner_phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone:</span>
                          <span className="font-mono text-slate-700">{item.landowner_phone}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500">PFMS Bank Status:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.bank_details?.verification_status === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.bank_details?.verification_status || 'Pending'} ({item.bank_details?.account_number_masked})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Compensation Award Status */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Compensation Status (Stage {item.stage_index}/9)</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-govblue-900">{item.current_stage}</span>
                          <span className="text-slate-500 font-bold">{Math.round((item.stage_index / 9) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${(item.stage_index / 9) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Base Circle Rate:</span>
                          <span className="font-medium">₹{(item.base_valuation_inr / 100000).toFixed(2)} L</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>100% Solatium (Sec 30):</span>
                          <span className="font-medium text-emerald-700">+₹{(item.solatium_100pct_inr / 100000).toFixed(2)} L</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200/60">
                          <span>Total Final Award:</span>
                          <span className="text-govblue-900 text-sm">
                            ₹{(item.total_award_inr / 100000).toFixed(2)} Lakhs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Risk & Prerequisites State */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Live AI Risk & Delay Factors</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Delay Probability:</span>
                        <span className="font-bold text-slate-900">
                          {Math.round(item.ai_risk.delay_probability * 100)}% (+{item.ai_risk.predicted_delay_days} days)
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Compensation Delay Factors:
                        </div>
                        {item.ai_risk.compensation_factors?.slice(0, 2).map((factor, idx) => (
                          <div key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0"></span>
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200/60">
                        <div className="text-[10px] font-bold text-govblue-800 uppercase tracking-wider">
                          Recommended Action:
                        </div>
                        <p className="text-[11px] text-govblue-900 font-medium mt-0.5 leading-snug">
                          {item.ai_risk.recommendations?.[0] || 'Proceed with statutory processing.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Missing Prerequisites Alert Box (for Blocked Items) */}
                {isBlocked && (
                  <div className="mx-5 mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-extrabold text-rose-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>Work Blocked: Incomplete Interdepartmental Prerequisites</span>
                      </div>
                      <div className="space-y-0.5 pl-5">
                        {item.blockers.map((b, bIdx) => (
                          <div key={bIdx} className="text-rose-800 font-medium list-disc">
                            • {b}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActionModalItem(item);
                        setActionNotes(`Urgent prerequisite resolution requested: ${item.blockers.join('; ')}`);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 self-start sm:self-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Coordinate / Request Action</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: REQUEST INTERDEPARTMENTAL ACTION */}
      {actionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Send className="w-5 h-5 text-rose-600" />
                  <span>Request Interdepartmental Action</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send coordination notification to Survey, Revenue, or Legal without accessing their workflow.
                </p>
              </div>
              <button
                onClick={() => setActionModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestActionSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div>
                  Case: <strong className="text-slate-900">{actionModalItem.case_number}</strong> ({actionModalItem.project_name})
                </div>
                <div>
                  Plot #{actionModalItem.plot_number} • Beneficiary: {actionModalItem.landowner_name}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Department</label>
                <select
                  value={targetDept}
                  onChange={(e) => {
                    setTargetDept(e.target.value);
                    if (e.target.value.includes('Survey')) setActionType('Expedite Cadastral Joint Survey');
                    else if (e.target.value.includes('Revenue')) setActionType('Verify RoR Title Deed & Mutation');
                    else setActionType('Resolve Ownership Title Dispute');
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-govblue-500 focus:outline-none"
                >
                  <option value="Survey & Cadastral Directorate">Survey & Cadastral Directorate</option>
                  <option value="Revenue & Land Reforms Department">Revenue & Land Reforms Department (Tahsildar)</option>
                  <option value="Legal & Dispute Resolution Cell">Legal & Dispute Resolution Cell</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-govblue-500 focus:outline-none"
                >
                  <option value="Expedite Cadastral Joint Survey">Expedite Cadastral Joint Survey & Boundary Demarcation</option>
                  <option value="Verify RoR Title Deed & Mutation">Verify RoR Title Deed & Mutation Records</option>
                  <option value="Resolve Ownership Title Dispute">Resolve Ownership Title Dispute / Co-sharer Hearing</option>
                  <option value="PFMS Bank Account Re-verification">PFMS Bank Account Re-verification</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specific Officer Notes / Instructions</label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  required
                  placeholder="Detail the blocker and requested statutory step..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-govblue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingAction ? 'Forwarding...' : 'Dispatch Request & Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADVANCE STAGE MODAL */}
      {stageModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Advance Compensation Stage</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Plot #{stageModalItem.plot_number} • {stageModalItem.landowner_name}
                </p>
              </div>
              <button
                onClick={() => setStageModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdvanceStageSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Stage:</span>
                  <span className="font-bold text-slate-800">{stageModalItem.current_stage}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Next Pipeline Stage:</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {STAGES[stageModalItem.stage_index] || 'Final Stage'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Officer Remarks / Audit Reason</label>
                <textarea
                  rows={2}
                  value={stageRemarks}
                  onChange={(e) => setStageRemarks(e.target.value)}
                  placeholder="e.g. Valuation verified against benchmark circle rate..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-govblue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStageModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStage}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{submittingStage ? 'Advancing...' : 'Confirm & Log Audit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REVIEW / UPDATE ASSESSMENT */}
      {assessmentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-govblue-700" />
                  <span>Review & Update Valuation</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  RFCTLARR Act 2013 Valuation Formula (Sec 23 + Sec 30 100% Solatium)
                </p>
              </div>
              <button
                onClick={() => setAssessmentModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssessmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Base Land Value (INR)</label>
                <input
                  type="number"
                  value={baseValuation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBaseValuation(val);
                    setSolatium(val); // 100% solatium matches base
                  }}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-govblue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Statutory 100% Solatium (INR)</label>
                <input
                  type="number"
                  value={solatium}
                  onChange={(e) => setSolatium(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-govblue-500 focus:outline-none"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-950">Calculated Total Award:</span>
                <span className="font-black text-emerald-900 text-sm">
                  ₹{((parseFloat(baseValuation || 0) + parseFloat(solatium || 0)) / 100000).toFixed(2)} Lakhs
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Officer Justification / File Reference</label>
                <textarea
                  rows={2}
                  value={assessmentRemarks}
                  onChange={(e) => setAssessmentRemarks(e.target.value)}
                  placeholder="e.g. Revised based on District Valuation Committee notification..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-govblue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssessmentModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssessment}
                  className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{submittingAssessment ? 'Saving...' : 'Save & Recalculate Risk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
