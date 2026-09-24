import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { caseService } from '../../services/caseService';
import { RiskBadge } from '../../components/common/RiskBadge';
import { Search, Filter, Eye, ArrowUpRight, Plus, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CreateCaseModal } from '../../components/modals/CreateCaseModal';

export const CasesListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    const data = await caseService.getCases();
    setCases(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleCaseCreated = (newCase) => {
    setCases(prev => [newCase, ...prev]);
  };

  const filtered = cases.filter((c) => {
    const matchSearch =
      !search ||
      c.case_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.village_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.project_name?.toLowerCase().includes(search.toLowerCase());
    const matchRisk = selectedRisk === 'ALL' || c.risk_summary?.risk_level?.toUpperCase() === selectedRisk;
    const matchStage = selectedStage === 'ALL' || c.current_stage === selectedStage;
    return matchSearch && matchRisk && matchStage;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('nav.cases')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Statutory land acquisition files, notification sections, and live AI delay risk predictions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsCreateCaseOpen(true)}
            className="bg-govblue-700 hover:bg-govblue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create New Case</span>
          </button>

          <Link
            to="/map"
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>GIS Spatial View</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-govblue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-govblue-500"
          >
            <option value="ALL">All Stages</option>
            <option value="Joint Survey & Verification">Joint Survey & Verification</option>
            <option value="Objections & Hearing (Sec 15)">Objections & Hearing</option>
            <option value="Valuation & Award Determination">Valuation & Award</option>
            <option value="Compensation Disbursement">Compensation</option>
            <option value="Possession Handover">Possession Handover</option>
          </select>
        </div>
      </div>

      {/* Cases Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Case Number</th>
                <th className="py-3 px-4">Project & Village</th>
                <th className="py-3 px-3 text-center">Stage</th>
                <th className="py-3 px-3 text-center">Delay Risk</th>
                <th className="py-3 px-3 text-center">Est. Delay</th>
                <th className="py-3 px-3 text-center">Plots</th>
                <th className="py-3 px-3 text-center">Survey %</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-all">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <Link to={`/cases/${c.id}`} className="hover:text-govblue-700">
                      {c.case_number}
                    </Link>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Section {c.notification_section}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{c.project_name}</div>
                    <div className="text-slate-500 text-[11px]">
                      {c.village_name}, {c.district}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                      {c.current_stage}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <RiskBadge risk={c.risk_summary?.risk_level || 'Low'} />
                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                      {Math.round((c.risk_summary?.delay_probability || 0) * 100)}% Prob
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">
                    {c.risk_summary?.predicted_delay_days > 0 ? (
                      <span className="text-rose-600 font-extrabold">
                        +{c.risk_summary.predicted_delay_days}d
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold">On Schedule</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-800">
                    {c.parcels_count || 3}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-govblue-700 h-1.5 rounded-full"
                          style={{ width: `${c.metrics?.survey_completed_pct || 50}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {Math.round(c.metrics?.survey_completed_pct || 50)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="bg-slate-100 hover:bg-govblue-50 text-slate-700 hover:text-govblue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCaseModal
        isOpen={isCreateCaseOpen}
        onClose={() => setIsCreateCaseOpen(false)}
        onCaseCreated={handleCaseCreated}
      />
    </div>
  );
};
