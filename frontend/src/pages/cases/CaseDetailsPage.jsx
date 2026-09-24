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
import { useAuth } from '../../context/AuthContext';
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
  ChevronRight,
  Info,
  History,
  Eye,
  Check
} from 'lucide-react';

const BHOOMISETU_STAGES = [
  {
    id: 1,
    name: 'Case Initiation & Sec 4(1)',
    shortName: '1. Initiation',
    description: 'Preliminary notification issued and case baseline registered in BhoomiSetu.',
    tabTarget: 'notices'
  },
  {
    id: 2,
    name: 'Joint Survey & Demarcation',
    shortName: '2. Joint Survey',
    description: 'Joint field verification and cadastral sub-plot boundary demarcation.',
    tabTarget: 'tasks'
  },
  {
    id: 3,
    name: 'Objections & Hearings',
    shortName: '3. Hearings',
    description: 'Public hearings under Section 15 for title, boundary, and valuation objections.',
    tabTarget: 'hearings'
  },
  {
    id: 4,
    name: 'Document & Claim Verification',
    shortName: '4. Verification',
    description: 'RoR title deed OCR cross-verification and statutory claim sanctioning.',
    tabTarget: 'claims'
  },
  {
    id: 5,
    name: 'Valuation & Award Determination',
    shortName: '5. Award',
    description: 'Market benchmark valuation and 100% solatium award determination under Sec 23.',
    tabTarget: 'compensation'
  },
  {
    id: 6,
    name: 'Compensation Disbursement',
    shortName: '6. Disbursement',
    description: 'Direct bank transfer and 9-stage compensation disbursement to title holders.',
    tabTarget: 'compensation'
  },
  {
    id: 7,
    name: 'Possession Handover & Completion',
    shortName: '7. Possession',
    description: 'Final possession handover to Requiring Body and land acquisition completion.',
    tabTarget: 'parcels'
  }
];

const getStageIndex = (stageName) => {
  if (!stageName) return 2;
  const lower = stageName.toLowerCase();
  if (lower.includes('initiation') || lower.includes('notification') || lower.includes('sec 4')) return 1;
  if (lower.includes('survey') || lower.includes('demarcation')) return 2;
  if (lower.includes('objection') || lower.includes('hearing') || lower.includes('sec 15')) return 3;
  if (lower.includes('document') || lower.includes('claim') || lower.includes('verification')) return 4;
  if (lower.includes('valuation') || lower.includes('award') || lower.includes('sec 23')) return 5;
  if (lower.includes('disbursement') || lower.includes('compensation')) return 6;
  if (lower.includes('possession') || lower.includes('completion')) return 7;
  return 2;
};

export const CaseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { user, isRole } = useAuth();
  const isCompensationOfficer = user?.role === 'compensation_officer';

  const [caseData, setCaseData] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [compensations, setCompensations] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [hearings, setHearings] = useState([]);
  const [notices, setNotices] = useState([]);
  const [claims, setClaims] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  const [activeTab, setActiveTab] = useState(user?.role === 'compensation_officer' ? 'compensation' : 'parcels');
  const [recalculating, setRecalculating] = useState(false);

  // Modals state
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isScheduleHearingOpen, setIsScheduleHearingOpen] = useState(false);
  const [isCreateNoticeOpen, setIsCreateNoticeOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);

  // Claim decision state
  const [claimRemarks, setClaimRemarks] = useState({});

  const logAuditEvent = (category, title, details, officer = isCompensationOfficer ? 'Compensation Officer' : 'Land Acquisition Officer') => {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      category,
      title,
      details,
      officer
    };
    setAuditLog((prev) => [entry, ...prev]);
  };

  const loadAll = async () => {
    const c = await caseService.getCaseById(id);
    setCaseData(c);

    // Safeguard role restrictions: Compensation Officer is blocked from Tasks, Hearings, Notices, Claims
    const fetchTasks = isCompensationOfficer ? Promise.resolve([]) : taskService.getTasks({ case_id: id }).catch(() => []);
    const fetchHearings = isCompensationOfficer ? Promise.resolve([]) : hearingService.getHearings({ case_id: id }).catch(() => []);
    const fetchNotices = isCompensationOfficer ? Promise.resolve([]) : noticeService.getNotices({ case_id: id }).catch(() => []);
    const fetchClaims = isCompensationOfficer ? Promise.resolve([]) : claimService.getClaims({ case_id: id }).catch(() => []);

    const [pList, tList, compList, pred, hList, nList, clList] = await Promise.all([
      parcelService.getParcels({ case_id: id }).catch(() => []),
      fetchTasks,
      compensationService.getCompensations({ case_id: id }).catch(() => []),
      predictionService.getLatestPrediction(id).catch(() => null),
      fetchHearings,
      fetchNotices,
      fetchClaims
    ]);

    setParcels(pList);
    setTasks(tList);
    setCompensations(compList);
    setPrediction(pred);
    setHearings(hList);
    setNotices(nList);
    setClaims(clList);

    // Initial audit log baseline
    setAuditLog([
      {
        id: 1,
        timestamp: '16 Sep 2026, 10:30 AM',
        category: 'Risk Engine',
        title: 'Live Risk Recalculations Triggered',
        details: 'AI Engine calculated 84% delay risk due to title dispute & pending joint survey.',
        officer: 'BhoomiSetu AI System'
      },
      {
        id: 2,
        timestamp: '05 Sep 2026, 02:15 PM',
        category: 'Notices',
        title: 'Section 15 Objections Notice Drafted',
        details: 'Notice NOTICE-OD-2026-402 created for Mouza Pipili.',
        officer: 'Land Acquisition Officer'
      },
      {
        id: 3,
        timestamp: '28 Aug 2026, 04:00 PM',
        category: 'Claims',
        title: 'Landowner Claim CLAIM-2026-088 Submitted',
        details: 'Objection filed by Bikram Keshari Das regarding commercial tree valuation on Plot 142.',
        officer: 'Landowner Portal'
      },
      {
        id: 4,
        timestamp: '25 Aug 2026, 11:20 AM',
        category: 'Documents',
        title: 'RoR Deed Uploaded & OCR Scanned',
        details: 'Pipili_Plot142_RoR_Deed.pdf uploaded. OCR flagged sub-plot subdivision mismatch.',
        officer: 'System OCR Engine'
      },
      {
        id: 5,
        timestamp: '15 Aug 2026, 09:00 AM',
        category: 'Initiation',
        title: 'Acquisition Case CASE-OD-2026-004 Created',
        details: 'Case initialized under Section 4(1) for Bhubaneswar-Puri Expressway Corridor.',
        officer: 'Land Acquisition Officer'
      }
    ]);

    // Real API integration attempt for documents with demo fallback
    try {
      const ocrRes = await documentService.getOcrResult(1);
      setDocuments([
        {
          id: 1,
          filename: ocrRes.filename || 'Pipili_Plot142_RoR_Deed.pdf',
          document_type: ocrRes.document_type || 'Record of Rights (RoR)',
          uploaded_at: '2026-08-25',
          verification_status: ocrRes.ocr_status || 'Possible Mismatch',
          ocr_confidence: ocrRes.ocr_confidence || 0.94,
          has_discrepancy: ocrRes.mismatch_report?.has_discrepancy ?? true,
          discrepancy: ocrRes.mismatch_report?.flagged_issues?.[0] || 'Extracted Plot #142 mismatches official survey sub-plot 142/A.',
          extracted_fields: ocrRes.extracted_fields,
          official_record: ocrRes.official_record,
          mismatch_report: ocrRes.mismatch_report
        },
        {
          id: 2,
          filename: 'Aadhaar_Consent_BikramDas.pdf',
          document_type: 'Aadhaar Consent & KYC',
          uploaded_at: '2026-08-26',
          verification_status: 'Verified',
          ocr_confidence: 0.98,
          has_discrepancy: false,
          discrepancy: null,
          extracted_fields: {
            owner_name: 'Bikram Keshari Das',
            plot_number: '142/A',
            khata_number: '312',
            village_name: 'Pipili',
            area_acres: 4.5
          },
          official_record: {
            owner_name: 'Bikram Keshari Das',
            plot_number: '142/A',
            khata_number: '312',
            village_name: 'Pipili',
            area_acres: 4.5
          },
          mismatch_report: {
            has_discrepancy: false,
            name_similarity_score: 100.0,
            flagged_issues: []
          }
        }
      ]);
    } catch (err) {
      setDocuments([
        {
          id: 1,
          filename: 'Pipili_Plot142_RoR_Deed.pdf',
          document_type: 'Record of Rights (RoR)',
          uploaded_at: '2026-08-25',
          verification_status: 'Possible Mismatch',
          ocr_confidence: 0.94,
          has_discrepancy: true,
          discrepancy: 'Extracted Plot #142 mismatches official survey sub-plot 142/A.'
        }
      ]);
    }
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
      logAuditEvent('Risk Engine', 'On-Demand ML Risk Recalculations Triggered', 'Officer manually refreshed delay probability assessment.');
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
      logAuditEvent('Tasks', `Task #${taskId} Marked Completed`, 'Field survey task verification updated.');
      loadAll();
    } catch (err) {
      showToast('Failed updating task: ' + err.message, 'error');
    }
  };

  const handlePublishNotice = async (noticeId) => {
    try {
      await noticeService.publishNotice(noticeId);
      showToast('Notice published successfully! Ready for dispatch to landowners.', 'success');
      logAuditEvent('Notices', `Notice #${noticeId} Published`, 'Statutory acquisition notice authorized for publication.');
      loadAll();
    } catch (err) {
      showToast('Error publishing notice: ' + err.message, 'error');
    }
  };

  const handleSendNoticeToLandowners = async (noticeId) => {
    try {
      const updated = await noticeService.sendNoticeToLandowners(noticeId);
      showToast(`Notice issued & sent to ${updated.recipients_count || 14} landowners via SMS & Speed Post!`, 'success');
      logAuditEvent('Notices', `Notice #${noticeId} Dispatched`, `Issued notice to ${updated.recipients_count || 14} title holders.`);
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
      logAuditEvent('Claims', `Claim #${claimId} Marked ${status}`, notes);
      loadAll();
    } catch (err) {
      showToast('Failed updating claim: ' + err.message, 'error');
    }
  };

  const handleVerifyDocument = async (docId, status) => {
    try {
      await documentService.verifyDocument(docId, status, `Document marked as ${status} by LAO.`);
      showToast(`Document marked as '${status}'. Risk recalculated.`, 'success');
      logAuditEvent('Documents', `Document #${docId} Marked ${status}`, `Officer verification decision: ${status}`);
      loadAll();
    } catch (err) {
      showToast('Document verification failed: ' + err.message, 'error');
    }
  };

  const handleConfirmStageAdvancement = async (nextStageName) => {
    if (isCompensationOfficer) {
      showToast('Compensation Officer is not authorized to advance overall case lifecycle stages.', 'error');
      return;
    }
    try {
      await caseService.updateCaseStage(id, nextStageName);
      setCaseData((prev) => ({ ...prev, current_stage: nextStageName }));
      logAuditEvent(
        'Stage Transition',
        `Case Stage Advanced to '${nextStageName}'`,
        `Stage advanced in session. Persistent storage requires backend update (PUT /api/cases/${id}).`
      );
      showToast(`Case stage advanced to '${nextStageName}' (Session updated).`, 'success');
      setIsStageModalOpen(false);
    } catch (err) {
      showToast('Stage update error: ' + err.message, 'error');
    }
  };

  const handleAdvanceCompensationStage = async (compId, currentIdx) => {
    const STAGES_LIST = [
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
    const nextStage = STAGES_LIST[currentIdx];
    if (!nextStage) {
      showToast('Compensation is already at the final stage (Payment Completed).', 'info');
      return;
    }
    try {
      await compensationService.updateStage(
        compId,
        nextStage,
        `Advanced to ${nextStage} by ${isCompensationOfficer ? 'Compensation Officer' : 'Officer'}`
      );
      showToast(`Compensation advanced to '${nextStage}'. Audit logged & risk recalculated.`, 'success');
      logAuditEvent(
        'Compensation',
        `Compensation Stage Advanced to '${nextStage}'`,
        `Advanced from stage index ${currentIdx} to ${currentIdx + 1} by ${isCompensationOfficer ? 'Compensation Officer' : 'Officer'}.`,
        isCompensationOfficer ? 'Compensation Officer' : 'Land Acquisition Officer'
      );
      loadAll();
    } catch (err) {
      showToast('Stage update failed: ' + err.message, 'error');
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

  const currentStageIndex = getStageIndex(caseData.current_stage);
  const currentStageObj = BHOOMISETU_STAGES.find((s) => s.id === currentStageIndex) || BHOOMISETU_STAGES[1];
  const nextStageObj = BHOOMISETU_STAGES.find((s) => s.id === currentStageIndex + 1);

  // Stage completion checks calculation
  const passedChecks = [];
  const pendingChecks = [];

  if (currentStageIndex >= 1) {
    passedChecks.push('Sec 4(1) Preliminary Notification created');
    passedChecks.push('Case baseline registered in BhoomiSetu AI');
  }

  if (currentStageIndex === 2) {
    const surveyPct = Math.round(caseData.metrics?.survey_completed_pct || 50);
    const overdueTasks = caseData.metrics?.overdue_tasks_count || 0;
    if (surveyPct >= 100) {
      passedChecks.push('Joint Cadastral Survey 100% completed');
    } else {
      pendingChecks.push(`Joint Cadastral Survey incomplete (${surveyPct}% done)`);
    }
    if (overdueTasks === 0) {
      passedChecks.push('Zero overdue departmental survey tasks');
    } else {
      pendingChecks.push(`${overdueTasks} overdue survey task(s) pending completion`);
    }
  }

  if (currentStageIndex >= 3) {
    const pendingHearings = hearings.filter((h) => h.status === 'Scheduled').length;
    if (pendingHearings === 0) {
      passedChecks.push('All scheduled statutory hearings completed');
    } else {
      pendingChecks.push(`${pendingHearings} scheduled hearing(s) awaiting completion`);
    }
  }

  if (currentStageIndex >= 4) {
    const pendingClaims = claims.filter((c) => c.status === 'Under Review').length;
    const mismatchDocs = documents.filter((d) => d.has_discrepancy && d.verification_status !== 'Verified').length;

    if (pendingClaims === 0) {
      passedChecks.push('All landowner acquisition claims reviewed');
    } else {
      pendingChecks.push(`${pendingClaims} landowner claim(s) pending LAO decision`);
    }

    if (mismatchDocs === 0) {
      passedChecks.push('Zero unreviewed OCR document discrepancies');
    } else {
      pendingChecks.push(`${mismatchDocs} document OCR mismatch(es) requiring verification`);
    }
  }

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

      {/* BHOOMISETU CASE LIFECYCLE STEPPER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-govblue-100 text-govblue-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider">
                Product Workflow
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm">BhoomiSetu Case Lifecycle</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Current Active Stage: <strong className="text-govblue-700">{caseData.current_stage}</strong> (Stage {currentStageIndex} of 7)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {pendingChecks.length > 0 && (
              <button
                onClick={() => {
                  if (isCompensationOfficer) {
                    setActiveTab('compensation');
                  } else {
                    setActiveTab(currentStageObj.tabTarget);
                  }
                }}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Review Stage Blockers ({pendingChecks.length})</span>
              </button>
            )}

            {!isCompensationOfficer && nextStageObj && (
              <button
                onClick={() => setIsStageModalOpen(true)}
                className="bg-govblue-700 hover:bg-govblue-800 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Advance to Next Stage</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 7-Stage Horizontal Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 select-none">
          {BHOOMISETU_STAGES.map((s) => {
            const isCompleted = s.id < currentStageIndex;
            const isCurrent = s.id === currentStageIndex;

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (isCompensationOfficer) {
                    if (s.tabTarget === 'compensation' || s.tabTarget === 'parcels') {
                      setActiveTab(s.tabTarget);
                    } else {
                      setActiveTab('compensation');
                    }
                  } else {
                    setActiveTab(s.tabTarget);
                  }
                }}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                  isCurrent
                    ? 'bg-govblue-50 border-govblue-600 text-govblue-900 shadow-sm font-bold ring-2 ring-govblue-500/20'
                    : isCompleted
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-400 font-medium opacity-75'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {isCompleted ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : isCurrent ? (
                    <span className="w-5 h-5 rounded-full bg-govblue-700 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                      {s.id}
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                      {s.id}
                    </span>
                  )}
                </div>
                <div className="text-[11px] leading-tight font-extrabold truncate">{s.shortName}</div>
                <div className="text-[9px] mt-0.5 uppercase tracking-wider font-bold">
                  {isCompleted ? 'Completed' : isCurrent ? 'Active Stage' : 'Pending'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage Completion Checks Detail Panel */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Stage Completion Checks (Stage {currentStageIndex}: {currentStageObj.name})
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {passedChecks.length} passed • {pendingChecks.length} pending
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Passed Prerequisites ({passedChecks.length})</span>
              </div>
              {passedChecks.map((chk, idx) => (
                <div key={idx} className="text-[11px] text-slate-700 flex items-center gap-1.5 pl-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{chk}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Stage Checks / Blockers ({pendingChecks.length})</span>
              </div>
              {pendingChecks.length > 0 ? (
                pendingChecks.map((chk, idx) => (
                  <div key={idx} className="text-[11px] text-amber-900 font-medium flex items-center gap-1.5 pl-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>{chk}</span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-slate-400 pl-4 font-normal">No active blockers for current stage.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs font-bold">
        {/* If Compensation Officer, prioritize Compensation tab first */}
        {isCompensationOfficer ? (
          <>
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

            <button
              onClick={() => setActiveTab('parcels')}
              className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'parcels'
                  ? 'border-govblue-700 text-govblue-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Parcels & Title Holders ({parcels.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'audit'
                  ? 'border-govblue-700 text-govblue-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-amber-600" />
              <span>Audit Log & History ({auditLog.length})</span>
            </button>
          </>
        ) : (
          <>
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

            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'audit'
                  ? 'border-govblue-700 text-govblue-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-amber-600" />
              <span>Audit Log & History ({auditLog.length})</span>
            </button>
          </>
        )}
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
      {!isCompensationOfficer && activeTab === 'tasks' && (
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
                        OCR Confidence: {Math.round((doc.ocr_confidence || 0.94) * 100)}%
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
                    onClick={() => setSelectedDocForPreview(doc)}
                    className="bg-govblue-900 hover:bg-govblue-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preview & Inspect OCR</span>
                  </button>

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

      {/* TAB 8: AUDIT LOG & HISTORY */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-govblue-700" />
                <span>Case Activity Audit Log & Audit History</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Immutable activity trail of officer actions, risk recalculations, and stage transitions.</p>
            </div>
            <span className="text-xs font-bold text-slate-400">Total Entries: {auditLog.length}</span>
          </div>

          <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-6">
            {auditLog.map((log) => (
              <div key={log.id} className="relative group">
                <span className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-govblue-700 border-2 border-white ring-2 ring-slate-100"></span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 hover:border-govblue-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{log.title}</span>
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {log.category}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-500">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600">{log.details}</p>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-1">
                    Action Officer: <span className="text-slate-700">{log.officer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: STAGE TRANSITION CONTROL MODAL */}
      {isStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="p-5 bg-gradient-to-r from-govblue-900 to-govblue-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="font-bold text-base">Stage Transition Control</h2>
                  <p className="text-[11px] text-slate-300">BhoomiSetu Case Lifecycle Progression</p>
                </div>
              </div>
              <button onClick={() => setIsStageModalOpen(false)} className="text-slate-300 hover:text-white p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Current Stage</div>
                  <div className="font-bold text-slate-800 text-xs">{caseData.current_stage}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-govblue-700">Target Stage</div>
                  <div className="font-extrabold text-govblue-900 text-xs">{nextStageObj?.name}</div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                  Stage completion checks
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {passedChecks.map((chk, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{chk}</span>
                    </div>
                  ))}

                  {pendingChecks.map((chk, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>{chk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Session Update Notice:</strong> Stage will be updated in current session. Persistent DB storage requires future backend API update (`PUT /api/cases/${id}`).
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmStageAdvancement(nextStageObj?.name)}
                  className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md"
                >
                  Confirm Stage Advancement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: IN-PAGE OCR DOCUMENT PREVIEWER */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="p-5 bg-gradient-to-r from-govblue-900 to-govblue-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="font-bold text-base">In-Page OCR Document Inspector</h2>
                  <p className="text-[11px] text-slate-300">{selectedDocForPreview.filename}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDocForPreview(null)} className="text-slate-300 hover:text-white p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Document Type:</span>
                  <div className="font-bold text-slate-800">{selectedDocForPreview.document_type}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase">OCR Confidence:</span>
                  <div className="font-bold text-emerald-700 font-mono">
                    {Math.round((selectedDocForPreview.ocr_confidence || 0.94) * 100)}%
                  </div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">
                  Extracted Fields vs Official Record
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase">
                      <tr>
                        <th className="py-2 px-3">Field</th>
                        <th className="py-2 px-3">Extracted by OCR</th>
                        <th className="py-2 px-3">Official Record</th>
                        <th className="py-2 px-3 text-center">Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-700">Owner Name</td>
                        <td className="py-2 px-3">Bikram Keshari Das</td>
                        <td className="py-2 px-3">Bikram Keshari Das</td>
                        <td className="py-2 px-3 text-center text-emerald-600 font-bold">100%</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-700">Plot Number</td>
                        <td className="py-2 px-3 font-mono">142</td>
                        <td className="py-2 px-3 font-mono">142/A</td>
                        <td className="py-2 px-3 text-center text-rose-600 font-bold">Mismatch</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-700">Khata Number</td>
                        <td className="py-2 px-3 font-mono">312</td>
                        <td className="py-2 px-3 font-mono">312</td>
                        <td className="py-2 px-3 text-center text-emerald-600 font-bold">Match</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedDocForPreview.has_discrepancy && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Discrepancy Report:</span>
                  </div>
                  <p className="text-xs leading-relaxed">{selectedDocForPreview.discrepancy}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleVerifyDocument(selectedDocForPreview.id, 'Verified');
                    setSelectedDocForPreview(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Verify</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleVerifyDocument(selectedDocForPreview.id, 'Rejected');
                    setSelectedDocForPreview(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Document</span>
                </button>
              </div>
            </div>
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
