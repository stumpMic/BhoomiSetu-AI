import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { caseService } from '../../services/caseService';
import { parcelService } from '../../services/parcelService';
import { documentService } from '../../services/documentService';
import { taskService } from '../../services/taskService';
import { compensationService } from '../../services/compensationService';
import { predictionService } from '../../services/predictionService';
import { RiskBadge } from '../../components/common/RiskBadge';
import { RiskMeter } from '../../components/common/RiskMeter';
import { useNotifications } from '../../context/NotificationContext';
import {
  MapPin,
  FileSpreadsheet,
  FileCheck,
  CreditCard,
  CheckSquare,
  MessageSquareWarning,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Clock,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  FileText,
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
  const [activeTab, setActiveTab] = useState('parcels');
  const [recalculating, setRecalculating] = useState(false);

  const loadAll = async () => {
    const c = await caseService.getCaseById(id);
    setCaseData(c);

    const [pList, tList, compList, pred] = await Promise.all([
      parcelService.getParcels({ case_id: id }),
      taskService.getTasks({ case_id: id }),
      compensationService.getCompensations({ case_id: id }),
      predictionService.getLatestPrediction(id)
    ]);

    setParcels(pList);
    setTasks(tList);
    setCompensations(compList);
    setPrediction(pred);
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
      // Reload case info
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
      {/* Breadcrumb & Title */}
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

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/map?search=${encodeURIComponent(caseData.case_number)}`)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-govblue-700" />
            Show on Map
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

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('parcels')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'parcels'
              ? 'border-govblue-700 text-govblue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Parcels ({parcels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'tasks'
              ? 'border-govblue-700 text-govblue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Departmental Tasks ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('compensation')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'compensation'
              ? 'border-govblue-700 text-govblue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Compensation ({compensations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'documents'
              ? 'border-govblue-700 text-govblue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Documents & OCR</span>
        </button>
      </div>

      {/* Tab 1: Parcels */}
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

      {/* Tab 2: Tasks */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Departmental Workflow Tasks
            </h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-govblue-700 font-bold hover:underline"
            >
              Task Management Board →
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
                    Department: <strong className="text-slate-700">{t.assigned_department_name || 'Revenue Department'}</strong> • Deadline: {t.deadline}
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
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Compensation */}
      {activeTab === 'compensation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Compensation Pipeline
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

      {/* Tab 4: Documents & OCR */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Document Verification & OCR Scans</h3>
              <p className="text-xs text-slate-500 mt-0.5">Review uploaded Record of Rights deeds and RapidFuzz mismatch reports.</p>
            </div>
            <button
              onClick={() => navigate('/documents')}
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              Open Verification Queue
            </button>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900">OCR Discrepancy Active on Demo Case:</div>
              <p className="mt-0.5">
                Uploaded RoR for Plot #142 contains sub-plot mismatch against official cadastral survey plot <strong>142/A</strong>. Officer manual verification is required before award sanction.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
