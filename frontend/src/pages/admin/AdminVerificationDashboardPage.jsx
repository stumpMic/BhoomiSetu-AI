import React, { useState, useEffect } from 'react';
import { verificationService } from '../../services/verificationService';
import { useNotifications } from '../../context/NotificationContext';
import { 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  RefreshCw,
  Eye,
  AlertTriangle,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const AdminVerificationDashboardPage = () => {
  const { showToast } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending_officers: 0,
    pending_landowners: 0,
    total_approved: 0,
    total_rejected: 0,
    total_verified_users: 0
  });

  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('officers'); // 'officers' | 'landowners' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'APPROVE' | 'REJECT'
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, pendingData] = await Promise.all([
        verificationService.getVerificationStats(),
        verificationService.getPendingVerifications()
      ]);
      setStats(statsData);
      setPendingRequests(pendingData);
    } catch (err) {
      showToast('Failed to load verification requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRequests = pendingRequests.filter((req) => {
    if (activeTab === 'officers' && req.request_type !== 'OFFICER') return false;
    if (activeTab === 'landowners' && req.request_type !== 'LANDOWNER') return false;

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.full_name?.toLowerCase().includes(query) ||
      req.email?.toLowerCase().includes(query) ||
      req.officer_id?.toLowerCase().includes(query) ||
      req.department?.toLowerCase().includes(query) ||
      req.district?.toLowerCase().includes(query)
    );
  });

  const handleOpenReviewModal = (req, action) => {
    setSelectedRequest(req);
    setReviewAction(action);
    setRejectionReason(
      action === 'REJECT'
        ? 'Submitted identification document does not match departmental allocation.'
        : ''
    );
    setActionNotes('');
  };

  const handleExecuteReview = async () => {
    if (!selectedRequest || !reviewAction) return;
    setSubmittingReview(true);

    try {
      const res = await verificationService.reviewVerification(
        selectedRequest.id,
        reviewAction,
        rejectionReason,
        actionNotes
      );
      showToast(res.message, reviewAction === 'APPROVE' ? 'success' : 'info');
      setSelectedRequest(null);
      setReviewAction(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to execute review action', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-govblue-900 via-slate-900 to-govblue-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              User Registration & Role Verification Center
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Authorize government officer credentials and validate citizen landowner titles before granting access to privileged acquisition pipelines.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Officers
            </span>
            <div className="w-8 h-8 rounded-lg bg-govblue-50 text-govblue-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.pending_officers}</span>
            <span className="text-[11px] font-semibold text-amber-600">Requires Vetting</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Landowners
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.pending_landowners}</span>
            <span className="text-[11px] font-semibold text-emerald-600">RoR Manual Review</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Verified Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{stats.total_verified_users}</span>
            <span className="text-[11px] font-semibold text-slate-400">Active Accounts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rejected Requests
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{stats.total_rejected}</span>
            <span className="text-[11px] font-semibold text-slate-400">Blocked / Flagged</span>
          </div>
        </div>
      </div>

      {/* Main Verification Queue Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('officers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'officers'
                  ? 'bg-govblue-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Pending Officers ({stats.pending_officers})</span>
            </button>

            <button
              onClick={() => setActiveTab('landowners')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'landowners'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Pending Landowners ({stats.pending_landowners})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or district..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-govblue-600" />
              Loading pending verification queue...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-bold text-slate-700">Verification Queue Clear</h3>
              <p className="text-xs text-slate-400 mt-1">
                No pending registration requests in this category.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Applicant / Identity</th>
                  <th className="py-3.5 px-4">Role & Department</th>
                  <th className="py-3.5 px-4">Jurisdiction & Verification Details</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Applicant */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{req.full_name}</div>
                      <div className="text-[11px] text-slate-500">{req.email}</div>
                      <div className="text-[10px] text-slate-400">{req.phone}</div>
                    </td>

                    {/* Role & Dept */}
                    <td className="py-3.5 px-4">
                      {req.request_type === 'OFFICER' ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-govblue-50 text-govblue-800 text-[10px] font-bold">
                            {req.officer_id || 'OFFICER'}
                          </span>
                          <div className="font-semibold text-slate-700 mt-1">{req.designation || 'Government Officer'}</div>
                          <div className="text-[11px] text-slate-500">{req.department}</div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                            LANDOWNER
                          </span>
                          <div className="text-[11px] text-slate-600 mt-1">
                            Plot: <strong>{req.plot_number || 'N/A'}</strong> | Khata: <strong>{req.khata_number || 'N/A'}</strong>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Verification Details */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-[11px] text-slate-700">
                        <strong>District:</strong> {req.district || 'Khurda'}
                      </div>
                      {req.office_code && (
                        <div className="text-[11px] text-slate-500">
                          <strong>Office Code:</strong> {req.office_code} ({req.office_name})
                        </div>
                      )}
                      {req.notes && (
                        <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                          {req.notes}
                        </div>
                      )}
                      {req.document_path && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-govblue-600">
                            <FileText className="w-3 h-3" />
                            <span>Authorization Doc Attached</span>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(req.submitted_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                        {req.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(req, 'APPROVE')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(req, 'REJECT')}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Review Modal (Approve or Reject) */}
      {selectedRequest && reviewAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {reviewAction === 'APPROVE' ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {reviewAction === 'APPROVE' ? 'Approve Registration' : 'Reject Registration Request'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Applicant: {selectedRequest.full_name} ({selectedRequest.request_type})
                  </p>
                </div>
              </div>
            </div>

            {/* Application Summary Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <div><strong>Email:</strong> {selectedRequest.email}</div>
              <div><strong>Phone:</strong> {selectedRequest.phone}</div>
              {selectedRequest.request_type === 'OFFICER' && (
                <>
                  <div><strong>Officer ID:</strong> {selectedRequest.officer_id}</div>
                  <div><strong>Department:</strong> {selectedRequest.department}</div>
                  <div><strong>Office Code:</strong> {selectedRequest.office_code} ({selectedRequest.office_name})</div>
                </>
              )}
              {selectedRequest.notes && (
                <div className="pt-1 border-t border-slate-200/60 text-[11px] font-mono text-slate-500">
                  {selectedRequest.notes}
                </div>
              )}
            </div>

            {reviewAction === 'REJECT' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rejection Reason (Dispatched to Applicant) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the regulatory grounds for rejection..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Internal Administrative Remarks (Optional)
              </label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Verified against Departmental Order dated 03/09/2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewAction(null);
                }}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleExecuteReview}
                className={`w-2/3 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 ${
                  reviewAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submittingReview ? 'Processing...' : reviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
