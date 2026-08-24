import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { FolderKanban, MapPin, Layers, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProjectsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
      setLoading(false);
    };
    loadProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('nav.projects')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Major infrastructure corridors requiring land acquisition in Odisha state.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {projects.map((p) => {
          const acquiredPct = Math.round((p.acquired_area_acres / p.total_area_required_acres) * 100);
          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold text-govblue-700 bg-govblue-50 border border-govblue-100 px-2.5 py-1 rounded-md uppercase">
                    {p.code}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {p.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-govblue-700 transition-all leading-snug">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Districts:</span>
                    <strong className="text-slate-900">{p.districts}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Acquisition Cases:</span>
                    <strong className="text-slate-900">{p.cases_count} Cases</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Estimated Outlay:</span>
                    <strong className="text-slate-900">₹{p.estimated_budget_cr} Cr</strong>
                  </div>

                  {/* Acquisition Progress Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Land Acquired</span>
                      <span>{acquiredPct}% ({p.acquired_area_acres} / {p.total_area_required_acres} Ac)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${acquiredPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{p.high_risk_cases_count} High Risk</span>
                </div>
                <Link
                  to={`/projects/${p.id}`}
                  className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all shadow-sm"
                >
                  <span>Project Detail</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
