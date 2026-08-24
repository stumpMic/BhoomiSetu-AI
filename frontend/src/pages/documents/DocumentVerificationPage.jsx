import React, { useState, useEffect } from 'react';
import { documentService } from '../../services/documentService';
import { useNotifications } from '../../context/NotificationContext';
import {
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  User,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DocumentVerificationPage = () => {
  const { t } = useTranslation();
  const { showToast } = useNotifications();
  const [ocrData, setOcrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);

  const loadDocument = async () => {
    setLoading(true);
    const data = await documentService.getOcrResult(1);
    setOcrData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDocument();
  }, []);

  const handleVerify = async (status) => {
    setVerifying(true);
    try {
      await documentService.verifyDocument(1, status, remarks || `Document ${status} by Land Acquisition Officer`);
      showToast(`Document marked as '${status}'. Case risk dynamically recalculated!`, 'success');
      loadDocument();
    } catch (err) {
      showToast('Verification failed: ' + err.message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  if (!ocrData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
      </div>
    );
  }

  const ext = ocrData.extracted_fields;
  const off = ocrData.official_record;
  const rep = ocrData.mismatch_report;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-govblue-700" />
            <span>{t('nav.documents')}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            OCR deed extraction, field cross-referencing, and discrepancy sanctions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Document Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
            ocrData.ocr_status === 'Verified'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : ocrData.ocr_status === 'Rejected'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
          }`}>
            {ocrData.ocr_status}
          </span>
        </div>
      </div>

      {/* Discrepancy Alert Banner if Mismatch exists */}
      {rep.has_discrepancy && ocrData.ocr_status !== 'Verified' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-sm flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-amber-950 text-sm">
              Critical Field Mismatch Detected by OCR Engine
            </h4>
            <p className="text-amber-800 font-medium">
              {rep.flagged_issues[0]}
            </p>
            <div className="pt-2 text-slate-700 font-medium">
              <strong>Recommendation:</strong> {rep.officer_recommendation}
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Matrix */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: OCR Extracted Values */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-govblue-700" />
              <h3 className="font-bold text-slate-900 text-sm">Extracted from Document (OCR)</h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Confidence: {Math.round(ocrData.ocr_confidence * 100)}%
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block mb-1">RECORDED OWNER NAME</span>
              <span className="text-slate-900 font-bold text-sm">{ext.owner_name}</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              rep.plot_match ? 'bg-slate-50 border-transparent' : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400 font-bold">PLOT NUMBER</span>
                {!rep.plot_match && (
                  <span className="text-[10px] font-extrabold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                    MISMATCH
                  </span>
                )}
              </div>
              <span className="text-slate-900 font-bold text-sm font-mono">{ext.plot_number}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block mb-1">KHATA NUMBER</span>
              <span className="text-slate-900 font-bold text-sm font-mono">{ext.khata_number}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block mb-1">EXTRACTED AREA</span>
              <span className="text-slate-900 font-bold text-sm">{ext.area_acres} Acres</span>
            </div>
          </div>
        </div>

        {/* Right: Official Survey Database Record */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Official Land Survey Record</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500">Source: Tahsil Database</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block mb-1">REGISTERED OWNER</span>
              <span className="text-slate-900 font-bold text-sm">{off.owner_name}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block mb-1">SURVEY PLOT NUMBER</span>
              <span className="text-slate-900 font-bold text-sm font-mono">{off.plot_number}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block mb-1">KHATA NUMBER</span>
              <span className="text-slate-900 font-bold text-sm font-mono">{off.khata_number}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 font-bold block mb-1">SURVEYED AREA</span>
              <span className="text-slate-900 font-bold text-sm">{off.area_acres} Acres</span>
            </div>
          </div>
        </div>
      </div>

      {/* Officer Decision & Verification Action Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          Officer Sanction & Verification Decision
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Officer Sanction Remarks
          </label>
          <textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Verified sub-plot 142/A with physical village survey mutation map. Discrepancy resolved."
            className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => handleVerify('Verified')}
            disabled={verifying}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept & Verify Document</span>
          </button>

          <button
            onClick={() => handleVerify('Rejected')}
            disabled={verifying}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Document</span>
          </button>

          <button
            onClick={() => handleVerify('Manual Review Required')}
            disabled={verifying}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
          >
            Flag for Joint Field Demarcation
          </button>
        </div>
      </div>
    </div>
  );
};
