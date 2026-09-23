import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { noticeService } from '../../services/noticeService';
import { useNotifications } from '../../context/NotificationContext';
import { CreateNoticeModal } from '../../components/modals/CreateNoticeModal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Power
} from 'lucide-react';

export const NoticeManagementPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [viewingNotice, setViewingNotice] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadNotices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await noticeService.getNotices();
      setNotices(data || []);
    } catch (err) {
      console.error('Failed to load notices:', err);
      setError('Unable to load statutory notices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handlePublish = async (id, noticeNumber) => {
    try {
      setActionLoadingId(id);
      await noticeService.publishNotice(id);
      showToast(`Notice ${noticeNumber} is now Published and live on the Public Home Page!`, 'success');
      loadNotices();
    } catch (err) {
      showToast('Failed to publish notice: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeactivate = async (id, noticeNumber) => {
    try {
      setActionLoadingId(id);
      await noticeService.deactivateNotice(id);
      showToast(`Notice ${noticeNumber} deactivated. It is no longer visible on the Public Home Page.`, 'info');
      loadNotices();
    } catch (err) {
      showToast('Failed to deactivate notice: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, noticeNumber) => {
    if (!window.confirm(`Are you sure you want to delete notice ${noticeNumber}? This action cannot be undone.`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      await noticeService.deleteNotice(id);
      showToast(`Notice ${noticeNumber} deleted successfully.`, 'success');
      loadNotices();
    } catch (err) {
      showToast('Failed to delete notice: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingNotice(null);
    setIsModalOpen(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setIsModalOpen(true);
  };

  // Filtered notices
  const filteredNotices = notices.filter(n => {
    if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && n.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = n.notice_number?.toLowerCase().includes(q);
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchType = n.notice_type?.toLowerCase().includes(q);
      const matchCase = n.case_number?.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchType && !matchCase) return false;
    }
    return true;
  });

  // KPI calculations
  const totalCount = notices.length;
  const publishedCount = notices.filter(n => n.status === 'Published').length;
  const draftCount = notices.filter(n => n.status === 'Draft').length;
  const urgentCount = notices.filter(n => n.priority === 'Urgent').length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-govblue-700" />
              <span>Statutory Notices Management</span>
            </h1>
            <span className="bg-govblue-100 text-govblue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              LAO Authorized
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Publish, edit, and monitor statutory notifications under RFCTLARR Act 2013 across public corridors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadNotices}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm"
            title="Refresh Notices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-govblue-600' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create Statutory Notice</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Notices</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
          <span className="text-[11px] text-slate-500">Across all projects</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Live on Public Portal</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{publishedCount}</div>
          <span className="text-[11px] text-slate-500">Publicly visible</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Draft Notices</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{draftCount}</div>
          <span className="text-[11px] text-slate-500">Pending review / approval</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Urgent Priority</span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">{urgentCount}</div>
          <span className="text-[11px] text-slate-500">Critical deadlines</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'Published', 'Draft', 'Deactivated'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-govblue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Notices' : st}
              </button>
            ))}
          </div>

          {/* Search & Priority Select */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notice number, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-govblue-500 outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent Only</option>
              <option value="Important">Important Only</option>
              <option value="Normal">Normal Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State with Retry Button */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-rose-900 text-sm">{error}</h3>
          <button
            onClick={loadNotices}
            className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && !error && (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
          <span className="text-xs font-semibold text-slate-500">Loading statutory notices...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredNotices.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Statutory Notices Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No notices match your current filters. Try changing or clearing filters.'
              : 'No statutory acquisition notices have been drafted yet. Click below to create your first notice.'}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create Notice</span>
          </button>
        </div>
      )}

      {/* Notices Table */}
      {!loading && !error && filteredNotices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Notice Ref & Section</th>
                  <th className="py-3 px-4">Notice Title</th>
                  <th className="py-3 px-3">Case Ref</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Publish Date / Deadline</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredNotices.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50 transition-all">
                    {/* Notice Ref */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-govblue-800 block text-xs">
                        {n.notice_number}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                        {n.notice_type}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 block truncate" title={n.title}>
                        {n.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                        {n.content_summary}
                      </span>
                    </td>

                    {/* Case Ref */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {n.case_number ? (
                        <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                          {n.case_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">General Public</span>
                      )}
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        n.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : n.priority === 'Important'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {n.priority || 'Normal'}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{n.publish_date}</span>
                      </div>
                      {n.deadline && (
                        <div className="flex items-center gap-1 text-rose-600 font-semibold mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Deadline: {n.deadline}</span>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                        n.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : n.status === 'Draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {n.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick View Details */}
                        <button
                          onClick={() => setViewingNotice(n)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Notice */}
                        <button
                          onClick={() => openEditModal(n)}
                          className="p-1.5 rounded-lg text-govblue-700 hover:bg-govblue-50 transition"
                          title="Edit Notice"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Publish / Deactivate Button */}
                        {n.status === 'Draft' && (
                          <button
                            onClick={() => handlePublish(n.id, n.notice_number)}
                            disabled={actionLoadingId === n.id}
                            className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition disabled:opacity-50"
                          >
                            Publish
                          </button>
                        )}

                        {n.status === 'Published' && (
                          <button
                            onClick={() => handleDeactivate(n.id, n.notice_number)}
                            disabled={actionLoadingId === n.id}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-1 rounded-lg text-[10px] transition disabled:opacity-50"
                            title="Deactivate from Public Board"
                          >
                            Deactivate
                          </button>
                        )}

                        {n.status === 'Deactivated' && (
                          <button
                            onClick={() => handlePublish(n.id, n.notice_number)}
                            disabled={actionLoadingId === n.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition disabled:opacity-50"
                          >
                            Re-Publish
                          </button>
                        )}

                        {/* Delete Notice */}
                        <button
                          onClick={() => handleDelete(n.id, n.notice_number)}
                          disabled={actionLoadingId === n.id}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Notice Detail Modal */}
      {viewingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-gradient-to-r from-govblue-900 to-govblue-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="font-mono font-bold text-xs">{viewingNotice.notice_number}</span>
              </div>
              <button onClick={() => setViewingNotice(null)} className="text-slate-300 hover:text-white p-1">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {viewingNotice.notice_type}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                  viewingNotice.priority === 'Urgent'
                    ? 'bg-rose-100 text-rose-800'
                    : viewingNotice.priority === 'Important'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {viewingNotice.priority} Priority
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 leading-snug">{viewingNotice.title}</h2>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Issuing Authority:</span>
                  <strong className="text-slate-900">{viewingNotice.issuing_authority}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Publication Date:</span>
                  <strong className="text-slate-900">{viewingNotice.publish_date}</strong>
                </div>
                {viewingNotice.deadline && (
                  <div className="flex justify-between text-rose-700">
                    <span>Response Deadline:</span>
                    <strong className="font-bold">{viewingNotice.deadline}</strong>
                  </div>
                )}
                {viewingNotice.case_number && (
                  <div className="flex justify-between text-slate-600">
                    <span>Acquisition Case:</span>
                    <strong className="font-mono text-slate-900">{viewingNotice.case_number}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Public Notice Text</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {viewingNotice.content_summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => {
                    const n = viewingNotice;
                    setViewingNotice(null);
                    openEditModal(n);
                  }}
                  className="bg-govblue-50 text-govblue-700 hover:bg-govblue-100 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                >
                  Edit Notice
                </button>
                <button
                  onClick={() => setViewingNotice(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-1.5 rounded-lg text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Notice Modal */}
      <CreateNoticeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        noticeToEdit={editingNotice}
        onNoticeSaved={() => loadNotices()}
      />
    </div>
  );
};
