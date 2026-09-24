import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

export const GanttTimeline = ({ stages, currentStageIndex = 2, predictedDelayDays = 145, targetDeadline = '2026-12-31' }) => {
  const defaultStages = [
    { id: 1, name: 'Case Initiation & Sec 4(1)', baselineDays: 30, actualDays: 25, status: 'Completed' },
    { id: 2, name: 'Joint Cadastral Survey', baselineDays: 45, actualDays: 55, status: 'In Progress' },
    { id: 3, name: 'Section 15 Objections & Hearings', baselineDays: 35, actualDays: 40, status: 'Pending' },
    { id: 4, name: 'RoR Deed & Claim Verification', baselineDays: 30, actualDays: 30, status: 'Pending' },
    { id: 5, name: 'Valuation & Sec 23 Award', baselineDays: 40, actualDays: 45, status: 'Pending' },
    { id: 6, name: 'Compensation Disbursement', baselineDays: 60, actualDays: 75, status: 'Pending' },
    { id: 7, name: 'Possession Handover & Completion', baselineDays: 30, actualDays: 40, status: 'Pending' }
  ];

  const list = stages && stages.length > 0 ? stages : defaultStages;
  const totalBaseline = list.reduce((acc, s) => acc + (s.baselineDays || 40), 0);
  const totalAI = totalBaseline + predictedDelayDays;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-govblue-700" />
            <span>Schedule Timeline Analysis (Baseline vs. Actual vs. AI Forecast)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Milestone timeline tracking statutory RFCTLARR Act 2013 deadlines and AI-predicted schedule slippages.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-govblue-700"></span>
            <span className="text-slate-700">Baseline Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-700">Actual Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 animate-pulse"></span>
            <span className="text-slate-700">AI Forecasted Delay</span>
          </div>
        </div>
      </div>

      {/* Gantt Bars List */}
      <div className="space-y-4">
        {list.map((stg, idx) => {
          const isCompleted = idx + 1 < currentStageIndex;
          const isCurrent = idx + 1 === currentStageIndex;

          const baseWidthPct = Math.round(((stg.baselineDays || 40) / totalAI) * 100);
          const delayPortionDays = isCurrent ? Math.round(predictedDelayDays * 0.4) : (idx + 1 > currentStageIndex ? Math.round(predictedDelayDays * 0.15) : 0);

          return (
            <div key={stg.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCompleted ? 'bg-emerald-100 text-emerald-700' : isCurrent ? 'bg-govblue-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {stg.id}
                  </span>
                  <span>{stg.name}</span>
                  {isCurrent && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      Active Stage
                    </span>
                  )}
                </div>

                <div className="text-slate-500 text-[11px] font-mono">
                  Baseline: <strong>{stg.baselineDays || 40}d</strong> | AI Est: <strong className={delayPortionDays > 0 ? "text-rose-600 font-bold" : "text-slate-700"}>+{(stg.baselineDays || 40) + delayPortionDays}d</strong>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-slate-100 h-4 rounded-xl overflow-hidden flex relative border border-slate-200">
                {/* Baseline Bar */}
                <div
                  className={`h-full ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-govblue-600' : 'bg-slate-300'}`}
                  style={{ width: `${Math.max(baseWidthPct, 15)}%` }}
                ></div>

                {/* AI Forecasted Delay Bar */}
                {delayPortionDays > 0 && (
                  <div
                    className="h-full bg-rose-500/80 border-l border-rose-300 flex items-center justify-center text-[9px] font-extrabold text-white"
                    style={{ width: `${Math.min(delayPortionDays * 0.8, 35)}%` }}
                  >
                    +{delayPortionDays}d
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between font-medium">
        <span className="text-slate-600">
          Target Statutory Deadline: <strong className="text-slate-900 font-mono">{targetDeadline}</strong>
        </span>
        <div className="flex items-center gap-1.5 text-rose-700 font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>Cumulative AI Forecasted Delay: +{predictedDelayDays} Days</span>
        </div>
      </div>
    </div>
  );
};
