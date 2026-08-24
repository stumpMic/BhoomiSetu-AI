import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parcelService } from '../../services/parcelService';
import { RiskBadge } from '../../components/common/RiskBadge';
import { MapPin, Upload, MessageSquareWarning, CreditCard, FileText, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LandownerDashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await parcelService.getParcels({ village_id: 1 });
      setParcels(data.slice(0, 2)); // Demo landowner owns 2 plots (142/A, 142/B)
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Landowner Hero Greeting */}
      <div className="bg-gradient-to-r from-govblue-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            Citizen Beneficiary Portal
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            {t('landowner.welcome')}, {user?.full_name || 'Bikram Keshari Das'}
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Pipili Tahsil, Khurda District • Aadhaar: <span className="font-mono">XXXX-XXXX-8921</span>
          </p>
        </div>

        <div className="flex gap-2.5">
          <Link
            to="/landowner/upload"
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload RoR Deed</span>
          </Link>
          <Link
            to="/landowner/grievances"
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-white/20"
          >
            <MessageSquareWarning className="w-4 h-4 text-rose-300" />
            <span>File Objection</span>
          </Link>
        </div>
      </div>

      {/* Owned Parcels Card Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-govblue-700" />
          <span>{t('landowner.my_parcels')}</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {parcels.map((p, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    Plot #{p.plot_number || '142/A'}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Khata #{p.khata_number || '312'} • Village Pipili (4.5 Acres)
                  </span>
                </div>
                <RiskBadge risk={p.risk_level || 'High'} />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Project Corridor:</span>
                  <span className="font-bold text-slate-800">Bhubaneswar-Puri Expressway</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Compensation Status:</span>
                  <span className="font-bold text-govblue-700">{p.compensation_stage || 'Approval pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Award:</span>
                  <span className="font-bold text-emerald-700">₹70,00,000 (with Solatium)</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Link
                  to={`/landowner/parcel/${p.id || 12}`}
                  className="flex-1 bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <span>Track Detailed Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hearing Notices & Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-govblue-700" />
          <span>{t('landowner.hearing_dates')}</span>
        </h3>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start justify-between">
          <div>
            <span className="font-bold text-amber-950 block text-sm">
              Section 15 Hearing: Plot Boundary Mutation
            </span>
            <p className="mt-0.5 text-amber-800">
              Date: <strong>28th August 2026 at 11:00 AM</strong> • Venue: Tahsil Office Pipili, Court Room 2.
            </p>
          </div>
          <button className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-3 py-1.5 rounded-lg border border-amber-300 text-xs shadow-sm flex items-center gap-1 flex-shrink-0">
            <Download className="w-3.5 h-3.5" />
            Notice PDF
          </button>
        </div>
      </div>
    </div>
  );
};
