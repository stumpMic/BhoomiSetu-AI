import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { caseService } from '../../services/caseService';
import { RiskBadge } from '../../components/common/RiskBadge';
import { ArrowLeft, FolderKanban, MapPin, CheckCircle2, ArrowRight, FileSpreadsheet } from 'lucide-react';

export const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [proj, cList] = await Promise.all([
        projectService.getProjectById(id),
        caseService.getCases({ project_id: id })
      ]);
      setProject(proj);
      setCases(cList);
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-govblue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {project.name}
              </h1>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {project.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Code: <strong className="text-slate-800">{project.code}</strong> • Districts: {project.districts}
            </p>
          </div>
        </div>

        <Link
          to={`/map?project=${project.id}`}
          className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>GIS Project Alignment</span>
        </Link>
      </div>

      {/* Linked Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Acquisition Cases under this Project ({cases.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {cases.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{c.case_number}</span>
                  <RiskBadge risk={c.risk_summary?.risk_level || 'Low'} />
                </div>
                <div className="text-slate-500">
                  Village: <strong className="text-slate-700">{c.village_name}</strong> • Stage: {c.current_stage}
                </div>
              </div>
              <button
                onClick={() => navigate(`/cases/${c.id}`)}
                className="bg-slate-100 hover:bg-govblue-50 text-slate-700 hover:text-govblue-700 font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                Inspect Case →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
