import React, { useState, useEffect } from 'react';
import { compensationService } from '../../services/compensationService';
import { useNotifications } from '../../context/NotificationContext';
import { CreditCard, CheckCircle, Clock, ArrowRight, ShieldCheck, Banknote, Building2, AlertTriangle, RefreshCw } from 'lucide-react';
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
  const { showToast } = useNotifications();
  const [compensations, setCompensations] = useState([]);
  const [selectedComp, setSelectedComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadCompensations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await compensationService.getCompensations();
      setCompensations(data || []);
      if (data && data.length > 0) {
        setSelectedComp(data[0]);
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

  const handleAdvanceStage = async () => {
    if (!selectedComp) return;
    const currentIdx = selectedComp.stage_index || 1;
    if (currentIdx >= STAGES.length) {
      showToast('Compensation is already at the final stage (Payment Completed).', 'info');
      return;
    }
    const nextStage = STAGES[currentIdx]; // currentIdx is 1-based, so next is index currentIdx
    setUpdating(true);
    try {
      await compensationService.updateStage(selectedComp.id, nextStage, `Advanced to ${nextStage} by Officer`);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-govblue-700" />
            <span>{t('nav.compensation')}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            9-Stage statutory pipeline tracker & Direct Benefit Transfer (DBT) verification.
          </p>
        </div>

        <button
          onClick={handleAdvanceStage}
          disabled={updating || selectedComp.stage_index >= 9}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Advance to Next Stage</span>
        </button>
      </div>

      {/* 9-Stage Progress Stepper Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[750px]">
          {STAGES.map((s, idx) => {
            const isCompleted = idx + 1 < selectedComp.stage_index;
            const isCurrent = idx + 1 === selectedComp.stage_index;
            return (
              <div key={idx} className="flex flex-col items-center relative flex-1 text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all z-10 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-govblue-700 text-white ring-4 ring-govblue-100 animate-pulse'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-[10px] font-semibold mt-2 max-w-[85px] leading-tight ${
                  isCurrent ? 'text-govblue-900 font-bold' : isCompleted ? 'text-emerald-700 font-medium' : 'text-slate-400'
                }`}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Valuation & Beneficiary Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Valuation Formula */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-govblue-700" />
            <span>RFCTLARR 2013 Valuation Formula</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Base Circle Rate (Per Acre):</span>
              <span className="font-bold text-slate-800">₹35,00,000</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Market Value Multiplier (Rural 1.25x):</span>
              <span className="font-bold text-slate-800">₹{((selectedComp.base_valuation_inr || 3500000)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Statutory 100% Solatium (Sec 30):</span>
              <span className="font-bold text-emerald-600">+₹{((selectedComp.solatium_100pct_inr || 3500000)).toLocaleString()}</span>
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
            <span>Direct Benefit Transfer (PFMS Integration)</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Landowner / Beneficiary:</span>
              <span className="font-bold text-slate-800">{selectedComp.landowner_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-bold text-slate-800">{selectedComp.bank_details?.bank_name || 'State Bank of India'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Masked Account Number:</span>
              <span className="font-mono font-bold text-slate-800">{selectedComp.bank_details?.account_number_masked || 'XXXX-XXXX-4589'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">IFSC Code:</span>
              <span className="font-mono font-bold text-slate-800">{selectedComp.bank_details?.ifsc_code || 'SBIN0001234'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">PFMS Status:</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                {selectedComp.bank_details?.verification_status || 'Verified'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
