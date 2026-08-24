import React, { useState, useEffect } from 'react';
import { alertService } from '../../services/alertService';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AlertsCenterPage = () => {
  const { t } = useTranslation();
  const { markAsRead } = useNotifications();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await alertService.getAlerts();
    setAlerts(Array.isArray(data) ? data : (data.alerts || []));
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkAllRead = async () => {
    await alertService.markAllRead();
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-govblue-700" />
            <span>{t('nav.alerts')}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Automated statutory alerts, risk escalation warnings, and SMS log audit.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {alerts.map((a) => (
          <div
            key={a.id}
            onClick={() => !a.is_read && markAsRead(a.id)}
            className={`p-5 flex items-start gap-4 transition-all cursor-pointer ${
              !a.is_read ? 'bg-govblue-50/40 hover:bg-govblue-50/70' : 'hover:bg-slate-50'
            }`}
          >
            <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
              a.severity === 'critical' || a.severity === 'warning'
                ? 'bg-rose-100 text-rose-600'
                : a.severity === 'success'
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-blue-100 text-blue-600'
            }`}>
              {a.severity === 'critical' || a.severity === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : a.severity === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Info className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-bold ${!a.is_read ? 'text-slate-950' : 'text-slate-700'}`}>
                  {a.title}
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{a.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
