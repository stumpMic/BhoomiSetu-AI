import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { caseService } from '../../services/caseService';
import { parcelService } from '../../services/parcelService';
import { documentService } from '../../services/documentService';
import { taskService } from '../../services/taskService';
import { compensationService } from '../../services/compensationService';
import { predictionService } from '../../services/predictionService';
import { hearingService } from '../../services/hearingService';
import { noticeService } from '../../services/noticeService';
import { claimService } from '../../services/claimService';
import { RiskBadge } from '../../components/common/RiskBadge';
import { RiskMeter } from '../../components/common/RiskMeter';
import { useNotifications } from '../../context/NotificationContext';
import { AssignTaskModal } from '../../components/modals/AssignTaskModal';
import { ScheduleHearingModal } from '../../components/modals/ScheduleHearingModal';
import { CreateNoticeModal } from '../../components/modals/CreateNoticeModal';
import {
  MapPin,
  FileSpreadsheet,
  FileCheck,
  CreditCard,
  CheckSquare,
  RefreshCw,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Send,
  Plus,
  Scale,
  Building,
  UserCheck
} from 'lucide-react';

export const CaseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [caseData, setCaseData] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [compensations, setCompensations] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [hearings, setHearings] = useState([]);
  const [notices, setNotices] = useState([]);
  const [claims, setClaims] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [activeTab, setActiveTab] = useState('parcels');
  const [recalculating, setRecalculating] = useState(false);

  // Modals state
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isScheduleHearingOpen, setIsScheduleHearingOpen] = useState(false);
  const [isCreateNoticeOpen, setIsCreateNoticeOpen] = useState(false);

  // Claim decision state
  const [claimRemarks, setClaimRemarks] = useState({});

  const loadAll = async () => {
    const c = await caseService.getCaseById(id);
    setCaseData(c);

    const [pList, tList, compList, pred, hList, nList, clList] = await Promise.all([
      parcelService.getParcels({ case_id: id }),
      taskService.getTasks({ case_id: id }),
      compensationService.getCompensations({ case_id: id }),
      predictionService.getLatestPrediction(id),
      hearingService.getHearings({ case_id: id }),
      noticeService.getNotices({ case_id: id }),
      claimService.getClaims({ case_id: id })
    ]);

    setParcels(pList);
    setTasks(tList);
    setCompensations(compList);
    setPrediction(pred);
    setHearings(hList);
    setNotices(nList);
    setClaims(clList);

    // Mock document info for live OCR demo
    setDocuments([
      {
        id: 1,
        filename: "Pipili_Plot142_RoR_Deed.pdf",
        document_type: "Record of Rights (RoR)",
        uploaded_at: "2026-08-25",
        verification_status: "Possible Mismatch",
        ocr_confidence: 0.94,
        has_discrepancy: true,
        discrepancy: "Extracted Plot #142 mismatches official survey sub-plot 142/A."
      },
      {
        id: 2,
        filename: "Aadhaar_Consent_BikramDas.pdf",
        document_type: "Aadhaar Consent & KYC",
        uploaded_at: "2026-08-26",
        verification_status: "Verified",
        ocr_confidence: 0.98,
        has_discrepancy: false,
        discrepancy: null
      }
    ]);
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleRecalculateRisk = async () => {
    setRecalculating(true);
    try {
      const updatedPred = await predictionService.triggerPrediction(id);
      setPrediction(updatedPred);
      showToast('Risk recalculation triggered successfully!', 'success');
      const freshCase = await caseService.getCaseById(id);
      setCaseData(freshCase);
    } catch (err) {
      showToast('Recalculation error: ' + err.message, 'error');
    } finally {
      setRecalculating(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await taskService.updateTask(taskId, { status: 'Completed', remarks: 'Completed by Officer during demo' });
      showToast('Task marked Completed. Recalculating case risk...', 'success');
      loadAll();
    } catch (err) {
      showToast('Failed updating task: ' + err.message, 'error');
    }
  };

  const handlePublishNotice = async (noticeId) => {
    try {
      await noticeService.publishNotice(noticeId);
      showToast('Notice published successfully! Ready for dispatch to landowners.', 'success');
      loadAll();
    } catch (err) {
      showToast('Error publishing notice: ' + err.message, 'error');
    }
  };

  const handleSendNoticeToLandowners = async (noticeId) => {
    try {
      const updated = await noticeService.sendNoticeToLandowners(noticeId);
      showToast(`Notice issued & sent to ${updated.recipients_count || 14} landowners via SMS & Speed Post!`, 'success');
      loadAll();
    } catch (err) {
      showToast('Error sending notice: ' + err.message, 'error');
    }
  };

  const handleClaimDecision = async (claimId, status) => {
    const notes = claimRemarks[claimId] || `Claim ${status} by Land Acquisition Officer.`;
    try {
      await claimService.submitDecision(claimId, { status, officer_decision_notes: notes });
      showToast(`Claim marked as '${status}'! Landowner notified.`, 'success');
      loadAll();
    } catch (err) {
      showToast('Failed updating claim: ' + err.message, 'error');
    }
  };

  const handleVerifyDocument = async (docId, status) => {
    try {
      await documentService.verifyDocument(docId, status, `Document marked as ${status} by LAO.`);
      showToast(`Document marked as '${status}'. Risk recalculated.`, 'success');
      loadAll();
    } catch (err) {
      showToast('Document verification failed: ' + err.message, 'error');
    }
  };

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
      </div>
    );
  }

  const prob = prediction ? prediction.delay_probability : (caseData.risk_summary?.delay_probability || 0.2);
  const riskLvl = prediction ? prediction.risk_level : (caseData.risk_summary?.risk_level || 'Low');
  const days = prediction ? prediction.predicted_delay_days : (caseData.risk_summary?.predicted_delay_days || 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/cases" className="hover:text-govblue-700">Cases</Link>
            <span>/</span>
            <span className="text-slate-900">{caseData.case_number}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {caseData.case_number}
            </h1>
            <RiskBadge risk={riskLvl} />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {caseData.project_name} • {caseData.village_name}, {caseData.district} (Section {caseData.notification_section})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/map?search=${encodeURIComponent(caseData.case_number)}`)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-govblue-700" />
            Show on GIS
          </button>
          <button
            onClick={handleRecalculateRisk}
            disabled={recalculating}
            className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Recalculating...' : 'Recalculate Risk'}
          </button>
        </div>
      </div>

      {/* AI Risk Prediction Spotlight Card */}
      <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
        riskLvl === 'High'
          ? 'bg-gradient-to-r from-rose-50 to-white border-rose-200'
          : riskLvl === 'Medium'
          ? 'bg-gradient-to-r from-amber-50 to-white border-amber-200'
          : 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200'
      }`}>
        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center gap-4">
            <RiskMeter probability={prob} days={days} />
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Assessment</div>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{riskLvl} Risk Case</h3>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                {prob >= 0.7 ? 'Severe delay expected without immediate multi-departmental intervention.' : 'Case progressing within manageable regulatory variance.'}
              </p>
            </div>
          </div>

          <div className="space-y-2 border-l border-slate-200/80 pl-6 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Identified Contributing Factors
            </div>
            {prediction?.contributing_factors?.slice(0, 3).map((f, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${f.direction === 'increases_risk' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                <div>
                  <strong className="text-slate-900">{f.factor}:</strong>{' '}
                  <span className="text-slate-600">{f.description}</span>
                </div>
              </div>
            )) || <div className="text-slate-500">No major blockers detected.</div>}
          </div>

          <div className="flex flex-col justify-center items-end border-l border-slate-200/80 pl-6">
            <button
              onClick={() => navigate(`/predictions/${id}`)}
              className="bg-govblue-900 hover:bg-govblue-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <span>Explainability Breakdown</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-slate-400 font-medium mt-2">
              SHAP attribution & rule engine
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('parcels')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'parcels'
              ? 'border-govblue-700 text-govblue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Parcels ({parcels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'tasks'
              ? 'border-govblue-700 text-govblue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Survey Tasks ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hearings')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'hearings'
              ? 'border-govblue-700 text-govblue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Hearings & Meetings ({hearings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'notices'
              ? 'border-govblue-700 text-govblue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notices & Orders ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'claims'
              ? 'border-govblue-700 text-govblue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Landowner Claims ({claims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'documents'
              ? 'border-govblue-700 text-govblue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Documents & OCR ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('compensation')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'compensation'
              ? 'border-govblue-700 text-govblue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Compensation ({compensations.length})</span>
        </button>
      </div>

      {/* TAB 1: PARCELS */}
      {activeTab === 'parcels' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Land Parcels & Title Holders
            </h3>
            <span className="text-xs text-slate-500">
              Total: <strong>{caseData.total_area_acres || 18.5} Acres</strong>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Plot / Khata</th>
                  <th className="py-2.5 px-4">Land Area</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Survey Status</th>
                  <th className="py-2.5 px-4">Landowners (Co-sharers)</th>
                  <th className="py-2.5 px-3 text-center">Risk Level</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {parcels.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      Plot #{p.plot_number}
                      <div className="text-[11px] text-slate-400 font-normal">Khata: {p.khata_number}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.area_acres} Acres</td>
                    <td className="py-3 px-4 text-slate-600">{p.land_type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.survey_status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.survey_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.owners && p.owners.length > 0 ? (
                        p.owners.map((o, idx) => (
                          <div key={idx} className="text-slate-800 font-medium">
                            {o.name} <span className="text-slate-400 font-mono">({o.share_pct}%)</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">Bikram Keshari Das</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <RiskBadge risk={p.risk_level} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/parcels/${p.id}`)}
                        className="text-govblue-700 hover:underline font-bold"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Survey & Departmental Tasks
            </h3>
            <button
              onClick={() => setIsAssignTaskOpen(true)}
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Task to Survey Officer</span>
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{t.title}</span>
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
                  <p className="text-xs text-slate-500">{t.description}</p>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Assigned Officer: <strong className="text-slate-800">{t.assigned_officer_name || 'Shri Rajesh Jena (Survey Officer)'}</strong> • Department: <strong className="text-slate-700">{t.assigned_department_name || 'Survey & Revenue'}</strong> • Deadline: {t.deadline}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {t.status}
                  </span>
                  {t.status !== 'Completed' && (
                    <button
                      onClick={() => handleCompleteTask(t.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HEARINGS & MEETINGS */}
      {activeTab === 'hearings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Statutory Hearings & Public Consultations
              </h3>
              <p className="text-[11px] text-slate-500">Section 15 objections, valuation consults, and R&R hearings.</p>
            </div>
            <button
              onClick={() => setIsScheduleHearingOpen(true)}
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Hearing / Meeting</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {hearings.map((h) => (
              <div key={h.id} className="p-5 space-y-3 hover:bg-slate-50 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{h.title}</span>
                    <span className="bg-govblue-100 text-govblue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {h.hearing_type}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold self-start sm:self-auto ${
                    h.status === 'Scheduled' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {h.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{h.purpose}</p>

                <div className="grid sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-govblue-700" />
                    <span>Date: <strong>{h.hearing_date}</strong> at {h.hearing_time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Venue: <strong>{h.venue_or_mode}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Participants: <strong>{h.participants || 'LAO & Landowners'}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NOTICES & ORDERS */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Statutory Notices & Acquisition Notifications
              </h3>
              <p className="text-[11px] text-slate-500">Draft, publish, and issue notices directly to recorded title holders.</p>
            </div>
            <button
              onClick={() => setIsCreateNoticeOpen(true)}
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Draft Notice</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {notices.map((n) => (
              <div key={n.id} className="p-5 space-y-3 hover:bg-slate-50 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded">
                      {n.notice_number}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {n.notice_type}
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold self-start sm:self-auto border ${
                    n.status === 'Sent/Issued'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : n.status === 'Published'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {n.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{n.content_summary}</p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                  <div className="text-slate-400 font-medium text-[11px]">
                    Authority: <strong className="text-slate-700">{n.issuing_authority}</strong> • Publication Date: {n.publish_date} {n.recipients_count > 0 && `• Sent to ${n.recipients_count} landowners`}
                  </div>

                  <div className="flex gap-2">
                    {n.status === 'Draft' && (
                      <button
                        onClick={() => handlePublishNotice(n.id)}
                        className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm"
                      >
                        Publish Notice
                      </button>
                    )}

                    {n.status === 'Published' && (
                      <button
                        onClick={() => handleSendNoticeToLandowners(n.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to Landowners (SMS & Post)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: LANDOWNER CLAIMS */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Landowner Acquisition Claims & Objections Review
            </h3>
            <p className="text-[11px] text-slate-500">Review statutory claims, objections, and issue human-authorized decisions.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {claims.map((c) => (
              <div key={c.id} className="p-5 space-y-3 hover:bg-slate-50 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {c.claim_number}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{c.landowner_name}</h4>
                      <span className="text-slate-500 text-xs">(Plot #{c.plot_number || '142'})</span>
                    </div>
                    <div className="text-xs font-bold text-govblue-700 mt-0.5">{c.claim_type}</div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold self-start sm:self-auto ${
                    c.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : c.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                  {c.description}
                </p>

                {c.claimed_amount_inr > 0 && (
                  <div className="text-xs font-bold text-slate-800">
                    Claimed Valuation Amount: <span className="text-emerald-700">₹{(c.claimed_amount_inr / 100000).toFixed(2)} Lakhs</span>
                  </div>
                )}

                {/* Officer Sanction / Decision Controls */}
                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">LAO Sanction Decision:</div>
                  <input
                    type="text"
                    placeholder="Enter officer notes/rationale for decision..."
                    value={claimRemarks[c.id] || ''}
                    onChange={(e) => setClaimRemarks({ ...claimRemarks, [c.id]: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
                  />

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handleClaimDecision(c.id, 'Approved')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Claim</span>
                    </button>

                    <button
                      onClick={() => handleClaimDecision(c.id, 'Rejected')}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Claim</span>
                    </button>

                    <button
                      onClick={() => handleClaimDecision(c.id, 'Revision Requested')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all"
                    >
                      Request Clarification / Revision
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DOCUMENTS & OCR VERIFICATION */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Case Document Verification & OCR Results</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated title cross-verification, discrepancy checks, and officer sanction.</p>
            </div>
            <button
              onClick={() => navigate('/documents')}
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              Full OCR Workbench
            </button>
          </div>

          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-govblue-700" />
                      <span className="font-bold text-slate-900 text-xs">{doc.filename}</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        OCR Confidence: {Math.round(doc.ocr_confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Type: <strong>{doc.document_type}</strong> • Uploaded: {doc.uploaded_at}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                    doc.verification_status === 'Verified'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {doc.verification_status}
                  </span>
                </div>

                {doc.has_discrepancy && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-950">OCR Mismatch Flagged:</strong> {doc.discrepancy}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleVerifyDocument(doc.id, 'Verified')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Verify</span>
                  </button>

                  <button
                    onClick={() => handleVerifyDocument(doc.id, 'Rejected')}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Document</span>
                  </button>

                  <button
                    onClick={() => handleVerifyDocument(doc.id, 'Manual Review Required')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Flag for Demarcation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: COMPENSATION */}
      {activeTab === 'compensation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Statutory 9-Stage Compensation Pipeline
            </h3>
          </div>
          <div className="p-4 divide-y divide-slate-100">
            {compensations.map((c) => (
              <div key={c.id} className="py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Plot #{c.plot_number} • {c.landowner_name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Current Stage: <strong className="text-govblue-700">{c.current_stage}</strong> (Stage {c.stage_index} of 9)
                  </p>
                  <div className="text-xs text-slate-700 font-bold mt-1">
                    Award Value: ₹{(c.total_award_inr / 100000).toFixed(2)} Lakhs (with 100% Solatium)
                  </div>
                </div>

                <Link
                  to="/compensation"
                  className="bg-slate-100 hover:bg-govblue-50 text-slate-700 hover:text-govblue-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                >
                  Manage 9-Stage Pipeline →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Modals */}
      <AssignTaskModal
        isOpen={isAssignTaskOpen}
        onClose={() => setIsAssignTaskOpen(false)}
        preselectedCaseId={Number(id)}
        preselectedCaseNumber={caseData.case_number}
        onTaskAssigned={loadAll}
      />

      <ScheduleHearingModal
        isOpen={isScheduleHearingOpen}
        onClose={() => setIsScheduleHearingOpen(false)}
        caseId={Number(id)}
        caseNumber={caseData.case_number}
        onHearingScheduled={loadAll}
      />

      <CreateNoticeModal
        isOpen={isCreateNoticeOpen}
        onClose={() => setIsCreateNoticeOpen(false)}
        caseId={Number(id)}
        caseNumber={caseData.case_number}
        onNoticeCreated={loadAll}
      />
    </div>
  );
};
