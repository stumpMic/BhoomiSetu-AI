import React from 'react';

export const RiskBadge = ({ risk, className = '' }) => {
  const normalized = (risk || 'low').toLowerCase();

  const config = {
    low: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Low Risk'
    },
    medium: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Medium Risk'
    },
    high: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500 animate-pulse',
      label: 'High Risk'
    },
    completed: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      label: 'Acquired'
    },
    insufficient: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      label: 'Insufficient'
    }
  }[normalized] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: risk
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
};
