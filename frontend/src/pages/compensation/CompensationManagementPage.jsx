import React, { useState, useEffect } from 'react';
import { compensationService } from '../../services/compensationService';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Banknote,
  Building2,
  AlertTriangle,
  RefreshCw,
  Edit3,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STAGES = [
  "Land valuation pending",
  "Valuation completed",
  "Compensation calculated",
  "Approval pending",
  "Compensation approved",
  "Landowner consent pending",
  "Bank verification",
  "Payment initiated",
  "Payment completed"
];

export const CompensationManagementPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [compensations, setCompensations] = useState([]);
  const [selectedComp, setSelectedComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Role permissions: CO & Admin can edit; LAO & Landowner are strictly read-only
  const canEdit = user && ['admin', 'compensation_officer'].includes(user.role);
  const isLAO = user?.role === 'land_acquisition_officer';
  const isLandowner = user?.role === 'landowner';

  // CO Valuation Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [baseValuation, setBaseValuation] = useState('');
  const [solatiumVal, setSolatiumVal] = useState('');
  const [interestVal, setInterestVal] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  const loadCompensations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await compensationService.getCompensations();
      setCompensations(data || []);
      if (data && data.length > 0) {
        setSelectedComp((prev) => {
          if (prev) {
            const found = data.find((d) => d.id === prev.id);
            return found || data[0];
          }
          return data[0];
        });
      } else {
        setSelectedComp(null);
      }
    } catch (err) {
      console.error('Failed to load compensations:', err);
      setError('Unable to load compensation records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompensations();
  }, []);

  const openEditModal = () => {
    if (!selectedComp) return;
    setBaseValuation(selectedComp.base_valuation_inr?.toString() || '3500000');
    setSolatiumVal(selectedComp.solatium_100pct_inr?.toString() || '3500000');
    setInterestVal('0');
    setRemarks('');
    setIsEditModalOpen(true);
  };

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComp || !canEdit) return;

    const base = parseFloat(baseValuation) || 0;
    const sol = parseFloat(solatiumVal) || 0;
    const interest = parseFloat(interestVal) || 0;
    const total = base + sol + interest;

    setSubmittingAssessment(true);
    try {
      await compensationService.updateAssessment(selectedComp.id, {
        base_land_value_inr: base,
        solatium_100pct_inr: sol,
        additional_interest_inr: interest,
        total_award_inr: total,
        landowner_share_inr: total,
        remarks: remarks || 'Valuation award updated by Compensation Officer'
      });
      showToast('Compensation valuation updated successfully!', 'success');
      setIsEditModalOpen(false);
      loadCompensations();
    } catch (err) {
      showToast('Failed to update assessment: ' + err.message, 'error');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const handleAdvanceStage = async () => {
    if (!selectedComp || !canEdit) return;
    const currentIdx = selectedComp.stage_index || 1;
    if (currentIdx >= STAGES.length) {
      showToast('Compensation is already at the final stage (Payment Completed).', 'info');
      return;
    }
    const nextStage = STAGES[currentIdx]; // currentIdx is 1-based, so next is index currentIdx
    setUpdating(true);
    try {
      await compensationService.updateStage(selectedComp.id, nextStage, `Advanced to ${nextStage} by Compensation Officer`);
      showToast(`Compensation advanced to '${nextStage}'. Recalculating risk...`, 'success');
      loadCompensations();
    } catch (err) {
      showToast('Stage update failed: ' + err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
        <span className="text-xs font-semibold text-slate-500">Loading compensation records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600 border border-rose-100">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Unable to load compensation records</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {error || 'Unable to connect to compensation services. Please try again.'}
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={loadCompensations}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!selectedComp) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">No Compensation Records Found</h2>
          <p className="text-xs text-slate-500 mt-1">There are currently no active compensation award cases in the pipeline.</p>
        </div>
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={loadCompensations}
            className="inline-flex items-center gap-2 px-4 py-2 bg-govblue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Role Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-govblue-700" />
              <span>{t('nav.compensation')}</span>
            </h1>
            {canEdit && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                CO Full Access (Read + Write)
              </span>
            )}
            {isLAO && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
                LAO Monitoring Mode (Read-Only)
              </span>
            )}
            {isLandowner && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                Citizen Beneficiary (Read-Only)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            9-Stage statutory pipeline tracker, RFCTLARR 2013 valuation determination, and DBT disbursement.
          </p>
        </div>

        {/* Action Buttons based on Role Permissions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit ? (
            <>
              <button
                onClick={openEditModal}
                className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-200 shadow-sm"
              >
                <Edit3 className="w-4 h-4 text-govblue-700" />
                <span>Update Valuation</span>
              </button>

              <button
                onClick={handleAdvanceStage}
                disabled={updating || selectedComp.stage_index >= 9}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{updating ? 'Updating...' : 'Advance Stage'}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Read-Only Mode</span>
            </div>
          )}

          <button
            onClick={loadCompensations}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Record Selector (when multiple compensation awards exist) */}
      {compensations.length > 1 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-govblue-700" />
            <span>Select Compensation Award Record:</span>
          </div>
          <div className="flex-1 max-w-md">
            <select
              value={selectedComp.id}
              onChange={(e) => {
                const found = compensations.find((c) => c.id === Number(e.target.value));
                if (found) setSelectedComp(found);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-govblue-500"
            >
              {compensations.map((c) => (
                <option key={c.id} value={c.id}>
                  Plot #{c.plot_number} • {c.landowner_name} ({c.current_stage} — ₹{(c.total_award_inr / 100000).toFixed(2)}L)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Selected Award Context Banner */}
      <div className="bg-gradient-to-r from-govblue-900 via-slate-900 to-govblue-950 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            Plot Demarcation & Award Summary
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Plot #{selectedComp.plot_number || '142/A'} • Khata #{selectedComp.khata_number || '312'}
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Beneficiary: <strong className="text-white">{selectedComp.landowner_name}</strong> • Village: {selectedComp.village_name || 'Pipili'} • Area: {selectedComp.land_area_acres || 4.5} Acres
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-slate-700 sm:pl-6">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            Total Statutory Award
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-0.5">
            ₹{((selectedComp.total_award_inr || 7000000)).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-300">
            Share: ₹{((selectedComp.landowner_share_amount_inr || selectedComp.total_award_inr || 3500000)).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 9-Stage Progress Stepper Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Statutory 9-Stage Disbursement Pipeline
          </span>
          <span className="text-xs font-semibold text-govblue-700">
            Stage {selectedComp.stage_index || 1} of 9: <strong>{selectedComp.current_stage}</strong>
          </span>
        </div>

        <div className="flex items-center justify-between min-w-[750px] pt-2">
          {STAGES.map((s, idx) => {
            const isCompleted = idx + 1 < selectedComp.stage_index;
            const isCurrent = idx + 1 === selectedComp.stage_index;
            return (
              <div key={idx} className="flex flex-col items-center relative flex-1 text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all z-10 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-govblue-700 text-white ring-4 ring-govblue-100 animate-pulse'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-[10px] font-semibold mt-2 max-w-[85px] leading-tight ${
                    isCurrent
                      ? 'text-govblue-900 font-bold'
                      : isCompleted
                      ? 'text-emerald-700 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Valuation & Beneficiary Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* RFCTLARR 2013 Valuation Formula */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Banknote className="w-4 h-4 text-govblue-700" />
              <span>RFCTLARR 2013 Valuation Determination</span>
            </h3>
            {canEdit && (
              <button
                onClick={openEditModal}
                className="text-govblue-700 hover:text-govblue-900 text-xs font-bold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Base Land Market Value:</span>
              <span className="font-bold text-slate-800">
                ₹{((selectedComp.base_valuation_inr || 3500000)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Statutory 100% Solatium (Sec 30):</span>
              <span className="font-bold text-emerald-600">
                +₹{((selectedComp.solatium_100pct_inr || 3500000)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Area Multiplier & Intermediary Interest:</span>
              <span className="font-bold text-slate-800">Assessed & Vetted</span>
            </div>
            <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded-xl text-emerald-900 font-bold text-sm">
              <span>Total Final Award:</span>
              <span>₹{((selectedComp.total_award_inr || 7000000)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bank & DBT Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Direct Benefit Transfer (PFMS Gateway)</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Beneficiary Title Holder:</span>
              <span className="font-bold text-slate-800">{selectedComp.landowner_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-bold text-slate-800">
                {selectedComp.bank_details?.bank_name || 'State Bank of India'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Masked Account Number:</span>
              <span className="font-mono font-bold text-slate-800">
                {selectedComp.bank_details?.account_number_masked || 'XXXX-XXXX-4589'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">IFSC Code:</span>
              <span className="font-mono font-bold text-slate-800">
                {selectedComp.bank_details?.ifsc_code || 'SBIN0001234'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">PFMS Verification Status:</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                {selectedComp.bank_details?.verification_status || 'Verified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CO Valuation Edit Modal */}
      {isEditModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-gradient-to-r from-govblue-900 to-govblue-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Update Statutory Valuation Award</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssessmentSubmit} className="p-6 space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                  Base Land Market Value (₹) *
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={baseValuation}
                  onChange={(e) => setBaseValuation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                  Statutory 100% Solatium (Sec 30) (₹) *
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={solatiumVal}
                  onChange={(e) => setSolatiumVal(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                  Additional Statutory Interest (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={interestVal}
                  onChange={(e) => setInterestVal(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-950">Calculated Final Award:</span>
                <span className="font-black text-emerald-800 text-sm">
                  ₹{((parseFloat(baseValuation) || 0) + (parseFloat(solatiumVal) || 0) + (parseFloat(interestVal) || 0)).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                  Assessment Remarks / Legal Basis
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Revised circle rate applied under Section 26(1)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssessment}
                  className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl transition shadow-md disabled:opacity-50"
                >
                  {submittingAssessment ? 'Saving...' : 'Save Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
