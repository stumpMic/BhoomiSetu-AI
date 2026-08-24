import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { predictionService } from '../../services/predictionService';
import { RiskBadge } from '../../components/common/RiskBadge';
import { RiskMeter } from '../../components/common/RiskMeter';
import {
  Cpu,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Clock,
  ShieldCheck,
  Building,
  Info
} from 'lucide-react';

export const PredictionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrediction = async () => {
      setLoading(true);
      const [pred, hist] = await Promise.all([
        predictionService.getLatestPrediction(id),
        predictionService.getPredictionHistory(id)
      ]);
      setData(pred);
      setHistory(hist.history || []);
      setLoading(false);
    };
    loadPrediction();
  }, [id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
      </div>
    );
  }

  const positiveFactors = (data.contributing_factors || []).filter(f => f.direction === 'increases_risk');
  const negativeFactors = (data.contributing_factors || []).filter(f => f.direction === 'decreases_risk');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/cases/${id}`)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                AI Delay Explainability & Mitigations
              </h1>
              <RiskBadge risk={data.risk_level} />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Case Ref: <strong className="text-slate-800">{data.case_number}</strong> • Model Version: <span className="font-mono text-slate-600">{data.model_version || 'v1.4.0-rf-ensemble'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/cases/${id}`)}
          className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
        >
          Return to Case Overview
        </button>
      </div>

      {/* Model Overview Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid md:grid-cols-3 gap-6 items-center">
        <div className="flex items-center gap-4">
          <RiskMeter probability={data.delay_probability} days={data.predicted_delay_days} />
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classification</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{data.risk_level} Delay Risk</h3>
            <div className="text-xs text-slate-600 font-medium mt-1">
              Estimated Delay Impact: <strong className="text-rose-600 font-bold">+{data.predicted_delay_days} Days</strong>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 border-l border-slate-100 pl-6 space-y-2 text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
            Machine Learning Inference Context
          </div>
          <p className="text-slate-600 leading-relaxed">
            The BhoomiSetu AI ensemble model evaluated 17 operational parameters for <strong>{data.case_number}</strong>. Title co-sharer disputes and pending field demarcations heavily elevate the risk probability above normal thresholds.
          </p>
          <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 font-medium text-[11px] flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Resolving the active OCR sub-plot discrepancy and completing the joint survey will dynamically reduce risk by up to 39%.</span>
          </div>
        </div>
      </div>

      {/* SHAP Factor Waterfall Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk Increasing Factors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Risk Escalating Factors (+Impact)</span>
            </div>
            <span className="text-xs font-bold text-rose-600">{positiveFactors.length} Blockers</span>
          </div>

          <div className="space-y-3">
            {positiveFactors.map((f, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{f.factor}</span>
                  <span className="text-rose-600 font-mono">+{Math.round(f.impact * 100)}%</span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Mitigating Factors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Risk Mitigating Factors (-Impact)</span>
            </div>
            <span className="text-xs font-bold text-emerald-600">{negativeFactors.length} Assets</span>
          </div>

          <div className="space-y-3">
            {negativeFactors.map((f, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{f.factor}</span>
                  <span className="text-emerald-600 font-mono">{Math.round(f.impact * 100)}%</span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Departmental Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Automated Regulatory Recommendations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Prescribed departmental steps under RFCTLARR Act 2013.</p>
          </div>
          <span className="bg-govblue-50 text-govblue-700 text-xs font-bold px-3 py-1 rounded-full border border-govblue-100">
            {data.recommended_actions?.length || 0} Prescriptions
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {data.recommended_actions?.map((act, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-govblue-100 text-govblue-700 font-bold text-xs flex-shrink-0">
                #{idx + 1}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{act.action}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    act.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {act.priority}
                  </span>
                </div>
                <div className="text-slate-600 font-medium">
                  Responsible: <strong className="text-slate-800">{act.department}</strong>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Target: <strong>Within {act.timeline_days} Days</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Legal Disclaimer */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-slate-800">Statutory Legal Disclaimer</div>
          <p className="mt-0.5 leading-relaxed">
            {data.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};
