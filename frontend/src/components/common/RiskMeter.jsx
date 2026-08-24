import React from 'react';

export const RiskMeter = ({ probability = 0.0, days = 0, size = 'normal' }) => {
  const percentage = Math.round(probability * 100);
  
  const getColor = (pct) => {
    if (pct < 40) return { stroke: '#10B981', text: 'text-emerald-600', label: 'Low Risk' };
    if (pct < 70) return { stroke: '#F59E0B', text: 'text-amber-600', label: 'Medium Risk' };
    return { stroke: '#EF4444', text: 'text-rose-600', label: 'High Risk' };
  };

  const current = getColor(percentage);

  return (
    <div className="flex flex-col items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#E2E8F0"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={current.stroke}
            strokeWidth="10"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * percentage) / 100}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-3xl font-extrabold ${current.text}`}>
            {percentage}%
          </span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Delay Risk
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <div className={`font-bold text-sm ${current.text}`}>{current.label}</div>
        {days > 0 && (
          <div className="text-xs text-slate-600 font-medium mt-0.5">
            Est. Delay: <span className="font-bold text-slate-900">+{days} Days</span>
          </div>
        )}
      </div>
    </div>
  );
};
