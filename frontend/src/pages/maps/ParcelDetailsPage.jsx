import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parcelService } from '../../services/parcelService';
import { RiskBadge } from '../../components/common/RiskBadge';
import { ArrowLeft, MapPin, FileText, User, CreditCard, ShieldCheck } from 'lucide-react';

export const ParcelDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadParcel = async () => {
      setLoading(true);
      const data = await parcelService.getParcelById(id);
      setParcel(data);
      setLoading(false);
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
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Plot #{parcel.plot_number}
              </h1>
              <RiskBadge risk={parcel.risk_level} />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Khata #{parcel.khata_number} • {parcel.village_name}, {parcel.district}
            </p>
          </div>
        </div>

        <Link
          to={`/cases/${parcel.case_id || 4}`}
          className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
        >
          View Linked Case →
        </Link>
      </div>

      {/* Parcel Info Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Cadastral Properties
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Land Area:</span>
              <span className="font-bold text-slate-900">{parcel.area_acres} Acres</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Land Classification:</span>
              <span className="font-bold text-slate-900">{parcel.land_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Survey Completion:</span>
              <span className="font-bold text-emerald-600">DGPS Verified</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Acquisition Case:</span>
              <span className="font-bold text-govblue-700">{parcel.case_number}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Valuation & Compensation Award
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Total Award (RFCTLARR):</span>
              <span className="font-bold text-slate-900">₹{(parcel.compensation_amount / 100000).toFixed(2)} Lakhs</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Current Stage:</span>
              <span className="font-bold text-govblue-700">{parcel.compensation_stage}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Solatium (100%):</span>
              <span className="font-bold text-emerald-600">Applied</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
