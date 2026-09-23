import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  ShieldAlert,
  Cpu,
  FileCheck,
  ArrowRight,
  BarChart3,
  Users,
  CheckCircle2,
  LayoutDashboard,
  Calendar,
  Clock,
  FileText,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { noticeService } from '../services/noticeService';

export const LandingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const dashboardPath = user?.role === 'landowner' ? '/landowner' : '/dashboard';

  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [noticeFilter, setNoticeFilter] = useState('ALL');
  const [selectedNotice, setSelectedNotice] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/map?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoadingNotices(true);
        const data = await noticeService.getPublicNotices();
        setNotices(data || []);
      } catch (err) {
        console.error('Failed to load public notices:', err);
      } finally {
        setLoadingNotices(false);
      }
    };
    fetchNotices();
  }, []);

  useEffect(() => {
    if (window.location.hash === '#notice-board') {
      const timer = setTimeout(() => {
        const el = document.getElementById('notice-board');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loadingNotices]);

  const filteredNotices = notices.filter(n => {
    if (noticeFilter === 'ALL') return true;
    return n.priority === noticeFilter;
  });

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-500 animate-ping',
          card: 'border-l-4 border-l-rose-500 border-slate-200 hover:border-rose-300 bg-white'
        };
      case 'Important':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          card: 'border-l-4 border-l-amber-500 border-slate-200 hover:border-amber-300 bg-white'
        };
      default:
        return {
          badge: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          card: 'border-l-4 border-l-govblue-600 border-slate-200 hover:border-slate-300 bg-white'
        };
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-govblue-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:20px_20px] opacity-25"></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Smart India Hackathon Prototype 2026 • Government of Odisha
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Early Detection of <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">Land Acquisition Delays</span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            BhoomiSetu AI leverages Random Forest Machine Learning, SHAP explainability, Cadastral GIS mapping, and automated OCR discrepancy detection to eliminate bottlenecks in major infrastructure projects.
          </p>

          {user && (
            <div className="mt-6 inline-flex items-center gap-3 bg-white/10 border border-white/20 px-5 py-2.5 rounded-2xl backdrop-blur-md shadow-xl">
              <span className="text-xs text-slate-200 font-medium">
                Active Session: <strong className="text-white">{user.full_name}</strong> ({user.role_display || user.role})
              </span>
              <Link
                to={dashboardPath}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Quick Notice Board Link Banner in Hero */}
          <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
            <a
              href="#notice-board"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('notice-board');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-lg backdrop-blur-sm cursor-pointer group"
            >
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span>Official Public Notice Board</span>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1">
                {loadingNotices ? 'Loading...' : `${notices.length} Active Notices`}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-white/20">
            <Search className="w-5 h-5 text-slate-400 ml-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Plot Number, Khata, or Case # (e.g. 142/A)..."
              className="w-full px-3 py-2.5 text-slate-900 text-sm focus:outline-none font-medium placeholder-slate-400"
            />
            <button
              type="submit"
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md flex-shrink-0"
            >
              Track Plot
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 pt-8 border-t border-slate-800 text-left">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-black text-amber-400">3 Major</div>
              <div className="text-xs text-slate-400 mt-0.5">Corridor Projects</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400">84 Parcels</div>
              <div className="text-xs text-slate-400 mt-0.5">Cadastral Demarcation</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-black text-blue-400">92.8%</div>
              <div className="text-xs text-slate-400 mt-0.5">ML Delay Accuracy</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-black text-purple-400">9 Stages</div>
              <div className="text-xs text-slate-400 mt-0.5">Compensation Pipeline</div>
            </div>
          </div>
        </div>
      </section>

      {/* PUBLIC NOTICE BOARD SECTION */}
      <section id="notice-board" className="scroll-mt-20 py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-govblue-800 font-bold text-xs uppercase tracking-widest bg-govblue-50 border border-govblue-200/60 px-3 py-1 rounded-full mb-2">
              <span className="w-2 h-2 rounded-full bg-govblue-700"></span>
              Public Notice Board • Revenue & Disaster Management
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Important Notices & Official Announcements
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
              Statutory preliminary notifications, objection deadlines, joint demarcation schedules, and Direct Benefit Transfer (DBT) directives published by the Land Acquisition Officer.
            </p>
          </div>

          {/* Priority Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl text-xs font-bold self-start md:self-end">
            {['ALL', 'Urgent', 'Important', 'Normal'].map((tab) => (
              <button
                key={tab}
                onClick={() => setNoticeFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  noticeFilter === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Notices' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Notices Cards Grid */}
        {loadingNotices ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-govblue-700"></div>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No Notices Published in this Category</h4>
            <p className="text-xs text-slate-500 mt-1">Official announcements published by the LAO will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredNotices.map((n) => {
              const styles = getPriorityStyle(n.priority);
              return (
                <div
                  key={n.id}
                  className={`p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${styles.card}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border uppercase tracking-wider ${styles.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                          {n.priority}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 font-bold">
                          {n.notice_number}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {n.publish_date}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                        {n.title}
                      </h4>
                      <div className="text-[11px] text-govblue-700 font-semibold mt-1">
                        {n.notice_type}
                      </div>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                      {n.content_summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500 truncate">
                      {n.deadline ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          <Clock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Deadline: {n.deadline}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Auth: {n.issuing_authority}</span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedNotice(n)}
                      className="bg-govblue-50 hover:bg-govblue-100 text-govblue-800 hover:text-govblue-900 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 flex-shrink-0"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3 Core Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-govblue-700 uppercase tracking-widest">Multi-Tier Technology</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Built for Transparent Land Governance
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">Predictive Delay AI</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Random Forest models analyze 17 operational risk metrics to flag delay probabilities (0–100%) and estimate delay days before bottlenecks stall the project.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">Cadastral GIS Mapping</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Color-coded interactive Leaflet maps display high-risk red polygons, medium yellow plots, and verified green parcels with real-time case links.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">OCR Discrepancy Engine</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Automated document scanner parses RoR deeds, cross-references official land databases via RapidFuzz, and highlights plot or name mismatches for officer sanction.
            </p>
          </div>
        </div>
      </section>

      {/* VIEW NOTICE DETAILS MODAL */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-gradient-to-r from-govblue-900 to-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">
                    Official Gazette Announcement • {selectedNotice.notice_number}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base leading-snug">
                    {selectedNotice.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Notice Type</span>
                  <span className="font-semibold text-slate-800">{selectedNotice.notice_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Priority</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold mt-0.5 ${
                    selectedNotice.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' :
                    selectedNotice.priority === 'Important' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedNotice.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Published Date</span>
                  <span className="font-semibold text-slate-800">{selectedNotice.publish_date}</span>
                </div>
                {selectedNotice.deadline && (
                  <div>
                    <span className="text-rose-500 font-bold uppercase tracking-wider text-[10px] block">Action Deadline</span>
                    <span className="font-bold text-rose-700">{selectedNotice.deadline}</span>
                  </div>
                )}
                {selectedNotice.case_number && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Linked Case</span>
                    <span className="font-mono font-bold text-govblue-800">{selectedNotice.case_number}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Issuing Authority</span>
                  <span className="font-semibold text-slate-800">{selectedNotice.issuing_authority}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Official Notice Content & Instructions:</h5>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedNotice.content_summary}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                <strong>Public Advisory:</strong> Landowners and citizens affected by this statutory notification may submit their representations, title claims, or boundary queries online through the BhoomiSetu portal or in person at the Tahsil Camp Office.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedNotice(null)}
                className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-all"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

