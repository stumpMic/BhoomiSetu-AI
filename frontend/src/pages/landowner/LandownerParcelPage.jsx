import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parcelService } from '../../services/parcelService';
import { RiskBadge } from '../../components/common/RiskBadge';
import { ArrowLeft, MapPin, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LandownerParcelPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [parcel, setParcel] = useState(null);

  useEffect(() => {
    const loadParcel = async () => {
      const p = await parcelService.getParcelById(id);
      setParcel(p);
    };
    loadParcel();
  }, [id]);

  if (!parcel) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/landowner')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Plot #{parcel.plot_number || '142/A'}
              </h1>
              <RiskBadge risk={parcel.risk_level || 'High'} />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Khata #{parcel.khata_number || '312'} • Village Pipili (4.5 Acres)
            </p>
          </div>
        </div>

        <Link
          to="/landowner/upload"
          className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
        >
          Upload RoR Documents →
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Land Demarcation & Ownership
          </h3>
          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Ownership Share:</span>
              <span className="font-bold text-slate-900">50.0% (Co-sharer: Rashmi Das)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Acquired Area:</span>
              <span className="font-bold text-slate-900">4.5 Acres</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Survey Demarcation:</span>
              <span className="font-bold text-emerald-600">DGPS Boundary Verified</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Compensation Breakdown
          </h3>
          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Award Amount:</span>
              <span className="font-bold text-slate-900">₹70,00,000</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Your 50% Share:</span>
              <span className="font-bold text-emerald-600">₹35,00,000</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Bank Verification:</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
