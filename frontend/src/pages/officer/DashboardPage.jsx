import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { dashboardService } from '../../services/dashboardService';
import { noticeService } from '../../services/noticeService';
import { StatCard } from '../../components/common/StatCard';
import { RiskBadge } from '../../components/common/RiskBadge';
import { useTranslation } from 'react-i18next';
import {
  Plus, FolderKanban, FileSpreadsheet, MapPin, AlertTriangle, Clock,
  MessageSquareWarning, CreditCard, Building, CheckCircle2, TrendingUp,
  ArrowUpRight, Filter, FileText, Edit, Eye, Power
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { CreateCaseModal } from '../../components/modals/CreateCaseModal';
import { CreateNoticeModal } from '../../components/modals/CreateNoticeModal';
import { AssignTaskModal } from '../../components/modals/AssignTaskModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useTranslation();
  const { isRole } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  // Notice Management state for LAO & Admin
  const [notices, setNotices] = useState([]);
  const [isCreateNoticeOpen, setIsCreateNoticeOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const canManageNotices = user && ['admin', 'land_acquisition_officer'].includes(user.role);

  const loadNotices = async () => {
    try {
      const list = await noticeService.getNotices();
      setNotices(list || []);
    } catch (e) {
      console.warn('Could not load notices on dashboard:', e);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(false);
      const res = await dashboardService.getSummary();
      setData(res);
    };
    loadDashboard();
    if (canManageNotices) {
      loadNotices();
    }
  }, [canManageNotices]);

  const handlePublishNotice = async (id, noticeNum) => {
    try {
      await noticeService.publishNotice(id);
      showToast(`Notice ${noticeNum} is now Published and visible on the Public Home Page!`, 'success');
      loadNotices();
    } catch (e) {
      showToast('Failed to publish notice: ' + (e.response?.data?.detail || e.message), 'error');
    }
  };

  const handleDeactivateNotice = async (id, noticeNum) => {
    try {
      await noticeService.deactivateNotice(id);
      showToast(`Notice ${noticeNum} deactivated from Public Home Page.`, 'info');
      loadNotices();
    } catch (e) {
      showToast('Failed to deactivate notice: ' + (e.response?.data?.detail || e.message), 'error');
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-govblue-700"></div>
      </div>
    );
  }

  const kpis = data.kpis;
  const riskPieData = [
    { name: 'Low Risk (0-39%)', value: kpis.risk_breakdown.low_risk, color: '#10B981' },
    { name: 'Medium Risk (40-69%)', value: kpis.risk_breakdown.medium_risk, color: '#F59E0B' },
    { name: 'High Risk (70-100%)', value: kpis.risk_breakdown.high_risk, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Quick Action */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="font-extrabold text-slate-900 text-base">LAO Monitoring & Operations Hub</h2>
          <p className="text-xs text-slate-500">Live AI delay risk tracking, case creation, and multi-department statutory workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          {isRole(['land_acquisition_officer', 'admin']) && (
            <button
              onClick={() => setIsAssignTaskOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-200 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-govblue-700" />
              <span>Assign Task to Survey Officer</span>
            </button>
          )}
          {canManageNotices && (
            <button
              onClick={() => {
                setEditingNotice(null);
                setIsCreateNoticeOpen(true);
              }}
              className="bg-govblue-50 hover:bg-govblue-100 text-govblue-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-govblue-200 shadow-sm"
            >
              <FileText className="w-4 h-4 text-govblue-700" />
              <span>Create Notice</span>
            </button>
          )}
          {isRole(['land_acquisition_officer', 'admin']) && (
            <button
              onClick={() => setIsCreateCaseOpen(true)}
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create New Case</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Banner Alert for High Risk Demo */}
      <div className="bg-gradient-to-r from-rose-900 to-govblue-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-rose-800/50">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-rose-600/30 border border-rose-500/50 rounded-xl text-rose-300">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white">
                High Delay Risk Alert: CASE-OD-2026-004
              </span>
              <RiskBadge risk="High" />
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Bhubaneswar-Puri Expressway (Pipili): 84% delay probability (+145 estimated delay days) due to RoR title dispute & pending joint survey.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 flex-shrink-0">
          <button
            onClick={() => navigate('/cases/4')}
            className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            Investigate Case
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/map?search=142/A')}
            className="bg-govblue-800 hover:bg-govblue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-govblue-600"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            View on GIS Map
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.total_projects')}
          value={kpis.total_projects}
          subtitle="3 Active Infrastructure Corridors"
          icon={FolderKanban}
          color="blue"
          onClick={() => navigate('/projects')}
        />
        <StatCard
          title={t('dashboard.total_cases')}
          value={kpis.total_cases}
          subtitle={`${kpis.risk_breakdown.high_risk} High Risk Cases Flagged`}
          icon={FileSpreadsheet}
          color="purple"
          onClick={() => navigate('/cases')}
        />
        <StatCard
          title={t('dashboard.acquired_area')}
          value={`${kpis.acquired_percentage}%`}
          subtitle={`${kpis.acquired_area_acres} of ${kpis.total_land_area_acres} Acres`}
          icon={CheckCircle2}
          color="green"
          trend={{ positive: true, value: '8.4%', label: 'vs last month' }}
        />
        <StatCard
          title={t('dashboard.overdue_tasks')}
          value={kpis.overdue_tasks}
          subtitle={`${kpis.pending_surveys} Pending Surveys`}
          icon={Clock}
          color="rose"
          onClick={() => navigate('/tasks')}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Disputes: <strong className="text-slate-900">{kpis.ownership_disputes} Plots</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Pending Surveys: <strong className="text-slate-900">{kpis.pending_surveys} Plots</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Pending Comp: <strong className="text-slate-900">₹{kpis.pending_compensation_crores} Cr</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Open Grievances: <strong className="text-slate-900">{kpis.open_grievances} Cases</strong></span>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {t('dashboard.risk_distribution')}
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Total {kpis.total_cases} Cases</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Causes of Delay Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {t('dashboard.causes_of_delay')}
            </h3>
            <span className="text-[11px] font-bold text-slate-400">AI Risk Contribution</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.delay_causes}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" unit="%" />
                <YAxis dataKey="cause" type="category" width={110} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="percentage" fill="#1E3A8A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Acquisition Progress Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {t('dashboard.monthly_progress')}
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Target vs Achieved (Acres)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly_progress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis unit=" Ac" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="bottom" />
                <Line type="monotone" dataKey="target_acres" stroke="#94A3B8" strokeDasharray="5 5" name="Target (Acres)" />
                <Line type="monotone" dataKey="achieved_acres" stroke="#10B981" strokeWidth={3} name="Achieved (Acres)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Bottlenecks Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                {t('dashboard.department_bottlenecks')}
              </h3>
              <Link to="/tasks" className="text-xs text-govblue-700 font-bold hover:underline">
                View All Tasks →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-2 text-center">Pending</th>
                    <th className="py-2.5 px-2 text-center">Overdue</th>
                    <th className="py-2.5 px-3 text-right">Avg Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {data.department_bottlenecks.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{dept.department}</td>
                      <td className="py-2.5 px-2 text-center">{dept.pending_tasks}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          dept.overdue_tasks > 0 ? 'bg-rose-100 text-rose-700' : 'text-slate-400'
                        }`}>
                          {dept.overdue_tasks}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{dept.avg_response_days} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Data refreshed via BhoomiSetu AI live engine</span>
            <span className="font-bold text-govblue-700">Odisha Secretariat</span>
          </div>
        </div>
      </div>

      {/* Statutory Notice Board Management Section (LAO / Admin Only) */}
      {canManageNotices && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-govblue-50 rounded-xl text-govblue-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Statutory Notice Board & Publication Hub
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {notices.filter(n => n.status === 'Published').length} Live on Home Page
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Notices published here appear immediately on the public website notice board.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/notices"
                className="text-xs font-bold text-govblue-700 hover:text-govblue-800 hover:underline px-3 py-1.5 rounded-lg border border-govblue-200"
              >
                View Full Notice Registry ({notices.length}) →
              </Link>
              <button
                onClick={() => {
                  setEditingNotice(null);
                  setIsCreateNoticeOpen(true);
                }}
                className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Create Notice</span>
              </button>
            </div>
          </div>

          {notices.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No statutory notices created yet. Click "Create Notice" to draft or publish your first statutory notice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Notice Ref & Type</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-2">Priority</th>
                    <th className="py-2.5 px-2">Publish Date</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {notices.slice(0, 4).map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-govblue-800 block text-xs">{n.notice_number}</span>
                        <span className="text-[10px] text-slate-400 block">{n.notice_type}</span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <span className="font-bold text-slate-900 block truncate" title={n.title}>{n.title}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{n.content_summary}</span>
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          n.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : n.priority === 'Important'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {n.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap text-[11px] text-slate-600">
                        {n.publish_date}
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          n.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : n.status === 'Draft'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {n.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingNotice(n);
                              setIsCreateNoticeOpen(true);
                            }}
                            className="p-1 rounded-lg text-govblue-700 hover:bg-govblue-50 transition"
                            title="Edit Notice"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {n.status === 'Draft' && (
                            <button
                              onClick={() => handlePublishNotice(n.id, n.notice_number)}
                              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                            >
                              Publish
                            </button>
                          )}
                          {n.status === 'Published' && (
                            <button
                              onClick={() => handleDeactivateNotice(n.id, n.notice_number)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                              title="Deactivate from Public Board"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <CreateCaseModal
        isOpen={isCreateCaseOpen}
        onClose={() => setIsCreateCaseOpen(false)}
        onCaseCreated={() => navigate('/cases')}
      />

      <CreateNoticeModal
        isOpen={isCreateNoticeOpen}
        onClose={() => setIsCreateNoticeOpen(false)}
        noticeToEdit={editingNotice}
        onNoticeSaved={loadNotices}
      />

      <AssignTaskModal
        isOpen={isAssignTaskOpen}
        onClose={() => setIsAssignTaskOpen(false)}
      />
    </div>
  );
};
