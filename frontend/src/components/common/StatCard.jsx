import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend = null, onClick = null }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1.5">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-slate-600">
          <span className={trend.positive ? 'text-emerald-600 font-bold mr-1' : 'text-rose-600 font-bold mr-1'}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
};
