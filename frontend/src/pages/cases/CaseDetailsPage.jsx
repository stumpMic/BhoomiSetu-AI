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
import { surveyService } from '../../services/surveyService';
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
  UserCheck,
  Compass,
  Gavel,
  ChevronRight,
  Award
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
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState(null); // { id, action }
  const [reviewRemarks, setReviewRemarks] = useState('');

  const [activeTab, setActiveTab] = useState('parcels');
  const [recalculating, setRecalculating] = useState(false);

  // Modals state
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isScheduleHearingOpen, setIsScheduleHearingOpen] = useState(false);
  const [isCreateNoticeOpen, setIsCreateNoticeOpen] = useState(false);

  // Claim decision state
  const [claimRemarks, setClaimRemarks] = useState({});

  const loadSurveyDetail = async (surveyId) => {
    try {
      setSurveyLoading(true);
      const detail = await surveyService.getSurveyDetail(surveyId);
      setSelectedSurvey(detail);
    } catch (err) {
      console.error('Failed to load survey detail:', err);
    } finally {
      setSurveyLoading(false);
    }
  };

  const handleReviewSurvey = async (surveyId, action) => {
    try {
      await surveyService.reviewSurveyReport(surveyId, {
        action: action,
        remarks: reviewRemarks || `Survey report ${action.toLowerCase()}d by LAO.`
      });
      showToast(`Survey Report ${action === 'APPROVE' ? 'Approved' : action} successfully!`, 'success');
      setReviewModal(null);
      setReviewRemarks('');
      loadAll();
      if (selectedSurvey?.id === surveyId) {
        loadSurveyDetail(surveyId);
      }
    } catch (err) {
      showToast('Failed to review survey report: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };
  const loadAll = async () => {
    const c = await caseService.getCaseById(id);
    setCaseData(c);

    const [pList, tList, compList, pred, hList, nList, clList, sList] = await Promise.all([
      parcelService.getParcels({ case_id: id }),
      taskService.getTasks({ case_id: id }),
      compensationService.getCompensations({ case_id: id }),
      predictionService.getLatestPrediction(id),
      hearingService.getHearings({ case_id: id }),
      noticeService.getNotices({ case_id: id }),
      claimService.getClaims({ case_id: id }),
      surveyService.getSurveys({ case_id: id }).catch(() => [])
    ]);

    setParcels(pList);
    setTasks(tList);
    setCompensations(compList);
    setPrediction(pred);
    setHearings(hList);
    setNotices(nList);
    setClaims(clList);
    setSurveys(sList || []);

    if (sList && sList.length > 0 && !selectedSurvey) {
      loadSurveyDetail(sList[0].id);
    }

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
          onClick={() => setActiveTab('surveys')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'surveys'
              ? 'border-govblue-700 text-govblue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Survey Reports ({surveys.length})</span>
          {surveys.some(s => s.status === 'SUBMITTED' || s.has_ownership_dispute || s.has_court_case) && (
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
          )}
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
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          const matching = surveys.find(s => s.parcel_id === p.id);
                          if (matching) {
                            loadSurveyDetail(matching.id);
                          }
                          setActiveTab('surveys');
                        }}
                        className="text-govblue-700 hover:text-govblue-900 hover:underline font-bold mr-3"
                      >
                        Survey Report →
                      </button>
                      <button
                        onClick={() => navigate(`/parcels/${p.id}`)}
                        className="text-slate-500 hover:text-slate-800 hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SURVEY REPORTS */}
      {activeTab === 'surveys' && (
        <div className="space-y-6">
          {/* Top Header & Survey Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-govblue-700 text-xs font-bold uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Cadastral Field Verification & Survey Reports</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Statutory Survey Findings & Legal Demarcation
                </h3>
                <p className="text-xs text-slate-500">
                  Reports submitted by Survey Officers for Case {caseData.case_number}. Review ownership dispute verifications, court cases, structural assets, and approve for Section 19 declaration.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  {surveys.length} {surveys.length === 1 ? 'Survey' : 'Surveys'} Registered
                </span>
              </div>
            </div>

            {/* Survey Cards List */}
            {surveys.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="font-bold">No Survey Reports Yet</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Field surveys for this case have not been initiated or assigned.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {surveys.map((s) => {
                  const isSelected = selectedSurvey?.id === s.id;
                  const isSubmitted = ['SUBMITTED', 'UNDER_REVIEW'].includes(s.status);
                  const isCompleted = ['COMPLETED', 'APPROVED'].includes(s.status);
                  return (
                    <div
                      key={s.id}
                      onClick={() => loadSurveyDetail(s.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-govblue-600 bg-blue-50/50 shadow-sm ring-2 ring-govblue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-govblue-800">{s.request_number}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                          isSubmitted ? 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse' :
                          'bg-amber-50 text-amber-700 border-amber-300'
                        }`}>
                          {s.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-sm">
                        Plot #{s.plot_number} • Khata #{s.khata_number}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>{s.village_name}</span>
                        <span className="font-semibold text-slate-700">{s.recorded_area_acres} Acres</span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Officer: <strong className="text-slate-600">{s.assigned_so_name || 'Assigned SO'}</strong></span>
                        <span className="text-govblue-700 font-bold flex items-center gap-0.5">
                          View Report <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Survey Report Detail View */}
          {selectedSurvey && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-govblue-700">{selectedSurvey.request_number}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">Assigned Survey Officer: <strong>{selectedSurvey.assigned_so_name || 'Smt. Sunita Mishra'}</strong></span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    Cadastral Survey Report: Plot #{selectedSurvey.plot_number} (Khata #{selectedSurvey.khata_number})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSurvey.village_name}, {selectedSurvey.district} District • Landowner: <strong className="text-slate-700">{selectedSurvey.landowner_name}</strong>
                  </p>
                </div>

                {/* LAO Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(selectedSurvey.status) && (
                    <>
                      <button
                        onClick={() => handleReviewSurvey(selectedSurvey.id, 'APPROVE')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve Survey Report
                      </button>
                      <button
                        onClick={() => setReviewModal({ id: selectedSurvey.id, action: 'RETURN' })}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <AlertTriangle className="w-4 h-4" /> Return with Remarks
                      </button>
                      <button
                        onClick={() => setReviewModal({ id: selectedSurvey.id, action: 'REQUEST_RESURVEY' })}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <RefreshCw className="w-4 h-4" /> Request Resurvey
                      </button>
                    </>
                  )}

                  <Link
                    to={`/survey/execution/${selectedSurvey.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    <span>Full Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-govblue-100 text-govblue-800 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-800 text-sm">
                      Official Survey Status: <span className="text-govblue-700">{selectedSurvey.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Recommendation: <strong>{selectedSurvey.report?.final_recommendation || 'Survey Completed'}</strong> • Digital Certification: <strong>{selectedSurvey.report?.is_digitally_confirmed ? 'Verified by Officer' : 'Recorded'}</strong>
                    </div>
                  </div>
                </div>

                {selectedSurvey.report?.submission_timestamp && (
                  <div className="text-right text-[11px] text-slate-400">
                    <span>Submitted on: {new Date(selectedSurvey.report.submission_timestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Comprehensive Review Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Area & Cadastral Demarcation */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-govblue-700" /> 1. Area & Cadastral Demarcation
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Boundary: {selectedSurvey.field_observation?.boundary_status || 'Boundary matches records'}
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Recorded Revenue Area</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedSurvey.recorded_area_acres} Acres</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Observed Ground Area</span>
                      <span className="font-bold text-govblue-900 text-sm">
                        {selectedSurvey.field_observation?.observed_area_acres || selectedSurvey.recorded_area_acres} Acres
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ground Land Use</span>
                      <span className="font-semibold text-slate-800">{selectedSurvey.field_observation?.land_use || 'Agricultural'}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Standing Trees Count</span>
                      <span className="font-semibold text-slate-800">{selectedSurvey.field_observation?.trees_count || 0} Trees</span>
                    </div>
                  </div>
                </div>

                {/* 2. Ownership Dispute Status */}
                <div className={`p-4 rounded-xl border space-y-3 ${selectedSurvey.field_observation?.has_ownership_dispute ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center justify-between border-b pb-2 border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-govblue-700" /> 2. Ownership Dispute Status
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      selectedSurvey.field_observation?.has_ownership_dispute ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {selectedSurvey.field_observation?.has_ownership_dispute ? 'DISPUTE DETECTED (YES)' : 'NO DISPUTES (NO)'}
                    </span>
                  </h4>

                  {selectedSurvey.field_observation?.has_ownership_dispute ? (
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div>
                        <strong className="text-rose-900">Nature:</strong> {selectedSurvey.field_observation?.dispute_nature}
                      </div>
                      <div>
                        <strong className="text-slate-800">Parties:</strong> {selectedSurvey.field_observation?.dispute_parties}
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed bg-white p-2 rounded-lg border border-rose-100">
                        {selectedSurvey.field_observation?.dispute_details}
                      </div>
                      {selectedSurvey.field_observation?.dispute_remarks && (
                        <div className="text-[11px] text-slate-500 italic">
                          Officer Remarks: {selectedSurvey.field_observation?.dispute_remarks}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800 flex items-center gap-2 pt-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>On-site field verification confirmed clean title with no competing ownership or boundary claims.</span>
                    </div>
                  )}
                </div>

                {/* 3. Court Case / Legal Dispute Status */}
                <div className={`p-4 rounded-xl border space-y-3 ${selectedSurvey.field_observation?.has_court_case ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center justify-between border-b pb-2 border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Gavel className="w-4 h-4 text-govblue-700" /> 3. Ongoing Court Case / Legal Dispute
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      selectedSurvey.field_observation?.has_court_case ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {selectedSurvey.field_observation?.has_court_case ? 'COURT CASE ACTIVE (YES)' : 'NO LITIGATION (NO)'}
                    </span>
                  </h4>

                  {selectedSurvey.field_observation?.has_court_case ? (
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <div><strong className="text-rose-900">Case #:</strong> {selectedSurvey.field_observation?.court_case_number}</div>
                        <div><strong className="text-slate-800">Status:</strong> <span className="text-rose-700 font-bold">{selectedSurvey.field_observation?.court_case_status}</span></div>
                      </div>
                      <div>
                        <strong className="text-slate-800">Court:</strong> {selectedSurvey.field_observation?.court_name}
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed bg-white p-2 rounded-lg border border-rose-100">
                        {selectedSurvey.field_observation?.court_case_description}
                      </div>
                      {selectedSurvey.field_observation?.court_case_remarks && (
                        <div className="text-[11px] text-slate-500 italic">
                          Officer Remarks: {selectedSurvey.field_observation?.court_case_remarks}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800 flex items-center gap-2 pt-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No pending civil suits, writ petitions, or stay orders registered against this land.</span>
                    </div>
                  )}
                </div>

                {/* 4. Existing Structure / Project on Land */}
                <div className={`p-4 rounded-xl border space-y-3 ${selectedSurvey.field_observation?.has_structure_or_project ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center justify-between border-b pb-2 border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-govblue-700" /> 4. Structure / Project on Land
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      selectedSurvey.field_observation?.has_structure_or_project ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                    }`}>
                      {selectedSurvey.field_observation?.has_structure_or_project ? 'STRUCTURE PRESENT (YES)' : 'VACANT LAND (NO)'}
                    </span>
                  </h4>

                  {selectedSurvey.field_observation?.has_structure_or_project ? (
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <div><strong className="text-govblue-900">Type:</strong> {selectedSurvey.field_observation?.structure_type}</div>
                        <div><strong className="text-slate-800">Location:</strong> {selectedSurvey.field_observation?.structure_location}</div>
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed bg-white p-2 rounded-lg border border-blue-100">
                        {selectedSurvey.field_observation?.structure_description}
                      </div>
                      {selectedSurvey.field_observation?.structure_remarks && (
                        <div className="text-[11px] text-slate-500 italic">
                          Valuation Impact: {selectedSurvey.field_observation?.structure_remarks}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 flex items-center gap-2 pt-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Parcel is vacant. No houses, wells, religious shrines, or permanent structures identified.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Document Verification Table */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <FileCheck className="w-4 h-4 text-govblue-700" /> 5. Statutory Document Verifications Checklist
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Document Title</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Verification Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(selectedSurvey.document_verifications && selectedSurvey.document_verifications.length > 0
                        ? selectedSurvey.document_verifications
                        : [
                            { doc_title: 'Record of Rights (Khatian / Patta)', doc_type: 'RoR', verification_status: 'VERIFIED', remarks: 'Matches District Revenue Record' },
                            { doc_title: 'Village Cadastral Sheet (1:4000)', doc_type: 'Map Sheet', verification_status: 'VERIFIED', remarks: 'Boundary pegs aligned' }
                          ]
                      ).map((doc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{doc.doc_title}</td>
                          <td className="py-2.5 px-3 text-slate-500">{doc.doc_type}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              doc.verification_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                              doc.verification_status === 'MISMATCHED' || doc.verification_status === 'MISMATCH' ? 'bg-rose-100 text-rose-800' :
                              doc.verification_status === 'MISSING' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {doc.verification_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{doc.remarks || doc.mismatch_details || 'Verified with district revenue record.'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. Officer Concluding Remarks */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <span className="font-extrabold text-slate-800 block">Survey Officer Final Observations & Synthesis:</span>
                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {selectedSurvey.report?.final_remarks || selectedSurvey.field_observation?.general_condition || 'Field survey completed. Boundary pegs demarcated and verified against cadastral revenue map. Ready for Section 19 declaration.'}
                </p>
              </div>
            </div>
          )}

          {/* Review Decision Modal */}
          {reviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <h3 className="text-base font-extrabold text-slate-900">
                  {reviewModal.action === 'RETURN' ? 'Return Survey Report for Correction' : 'Request Official Resurvey'}
                </h3>
                <p className="text-xs text-slate-500">
                  Provide specific directives or reasons for the Survey Officer to address.
                </p>

                <textarea
                  rows={4}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Enter remarks, demarcation issues, or missing documentation instructions..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-govblue-500"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => { setReviewModal(null); setReviewRemarks(''); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReviewSurvey(reviewModal.id, reviewModal.action)}
                    className="px-4 py-2 bg-govblue-800 hover:bg-govblue-900 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Submit Decision
                  </button>
                </div>
              </div>
            </div>
          )}
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
