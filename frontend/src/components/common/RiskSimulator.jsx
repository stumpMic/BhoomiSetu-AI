import React, { useState } from 'react';
import { Sliders, RefreshCw, CheckCircle, ArrowDown, Zap, AlertTriangle } from 'lucide-react';
import { RiskBadge } from './RiskBadge';

export const RiskSimulator = ({ initialMetrics, caseNumber }) => {
  const [surveyPct, setSurveyPct] = useState(initialMetrics?.survey_completed_pct ?? 50.0);
  const [missingDocPct, setMissingDocPct] = useState(initialMetrics?.missing_doc_pct ?? 25.0);
  const [disputes, setDisputes] = useState(initialMetrics?.ownership_disputes_count ?? 2);
  const [overdueTasks, setOverdueTasks] = useState(initialMetrics?.overdue_tasks_count ?? 3);
  const [compPct, setCompPct] = useState(initialMetrics?.compensation_progress_pct ?? 35.0);

  // Baseline calculation
  const calcRisk = (sPct, mPct, disp, ovTasks, cPct) => {
    let score = 0.12;
    score += (mPct / 100.0) * 0.25;
    score += ((100.0 - sPct) / 100.0) * 0.20;
    score += Math.min(disp * 0.15, 0.35);
    score += Math.min(ovTasks * 0.06, 0.18);
    score += ((100.0 - cPct) / 100.0) * 0.15;

    if (sPct >= 90.0) score -= 0.10;
    if (mPct === 0.0) score -= 0.08;
    if (cPct >= 70.0) score -= 0.10;

    const prob = Math.min(Math.max(score, 0.05), 0.95);
    const days = Math.max(0, Math.round(prob * 160 + ovTasks * 12 + disp * 25));
    let lvl = 'Low';
    if (prob >= 0.70) lvl = 'High';
    else if (prob >= 0.40) lvl = 'Medium';

    return { prob, days, lvl };
  };

  const baseline = calcRisk(
    initialMetrics?.survey_completed_pct ?? 50.0,
    initialMetrics?.missing_doc_pct ?? 25.0,
    initialMetrics?.ownership_disputes_count ?? 2,
    initialMetrics?.overdue_tasks_count ?? 3,
    initialMetrics?.compensation_progress_pct ?? 35.0
  );

  const current = calcRisk(surveyPct, missingDocPct, disputes, overdueTasks, compPct);
  const daysSaved = baseline.days - current.days;
  const probDrop = Math.round((baseline.prob - current.prob) * 100);

  const resetSliders = () => {
    setSurveyPct(initialMetrics?.survey_completed_pct ?? 50.0);
    setMissingDocPct(initialMetrics?.missing_doc_pct ?? 25.0);
    setDisputes(initialMetrics?.ownership_disputes_count ?? 2);
    setOverdueTasks(initialMetrics?.overdue_tasks_count ?? 3);
    setCompPct(initialMetrics?.compensation_progress_pct ?? 35.0);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-govblue-600/30 text-govblue-400 border border-govblue-500/30">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Interactive "What-If" Risk Simulator</h3>
            <p className="text-xs text-slate-400">Simulate mitigation steps to preview dynamic delay risk drop for {caseNumber || 'Case'}.</p>
          </div>
        </div>

        <button
          onClick={resetSliders}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Parameters</span>
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-center">
        {/* Sliders Input Panel */}
        <div className="md:col-span-7 space-y-4 text-xs">
          {/* Slider 1: Cadastral Survey */}
          <div className="space-y-1">
            <div className="flex justify-between font-medium text-slate-300">
              <span>Joint Cadastral Survey Completion:</span>
              <strong className="text-amber-400 font-mono">{surveyPct}%</strong>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={surveyPct}
              onChange={(e) => setSurveyPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-govblue-500"
            />
          </div>

          {/* Slider 2: Missing Documents */}
          <div className="space-y-1">
            <div className="flex justify-between font-medium text-slate-300">
              <span>Missing / Discrepant Title Deeds:</span>
              <strong className="text-amber-400 font-mono">{missingDocPct}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={missingDocPct}
              onChange={(e) => setMissingDocPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-govblue-500"
            />
          </div>

          {/* Slider 3: Ownership Disputes */}
          <div className="space-y-1">
            <div className="flex justify-between font-medium text-slate-300">
              <span>Active Title Disputes:</span>
              <strong className="text-amber-400 font-mono">{disputes} Dispute(s)</strong>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={disputes}
              onChange={(e) => setDisputes(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-govblue-500"
            />
          </div>

          {/* Slider 4: Overdue Tasks */}
          <div className="space-y-1">
            <div className="flex justify-between font-medium text-slate-300">
              <span>Overdue Departmental Tasks:</span>
              <strong className="text-amber-400 font-mono">{overdueTasks} Task(s)</strong>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={overdueTasks}
              onChange={(e) => setOverdueTasks(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-govblue-500"
            />
          </div>

          {/* Slider 5: Compensation Progress */}
          <div className="space-y-1">
            <div className="flex justify-between font-medium text-slate-300">
              <span>Compensation Disbursement:</span>
              <strong className="text-amber-400 font-mono">{compPct}%</strong>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={compPct}
              onChange={(e) => setCompPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-govblue-500"
            />
          </div>
        </div>

        {/* Live Simulation Output Card */}
        <div className="md:col-span-5 bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 space-y-4">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
            <span>Simulated Outcome</span>
            <RiskBadge risk={current.lvl} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Delay Probability:</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {Math.round(current.prob * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  current.prob >= 0.7 ? 'bg-rose-500' : current.prob >= 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.round(current.prob * 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <span className="text-xs text-slate-400">Est. Delayed Days:</span>
              <span className="text-lg font-extrabold text-white font-mono">
                +{current.days} Days
              </span>
            </div>
          </div>

          {daysSaved > 0 ? (
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ArrowDown className="w-4 h-4 text-emerald-400" />
                <span>Simulated Impact: -{daysSaved} Days Saved!</span>
              </div>
              <p className="text-[11px] text-emerald-400/80">
                Risk probability drops by <strong>{probDrop}%</strong> with selected field resolution actions.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 text-xs text-slate-400">
              Adjust sliders above to preview how field mitigations reduce project delay impact.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
