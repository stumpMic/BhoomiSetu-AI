import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FolderKanban,
  FileSpreadsheet,
  MapPin,
  FileCheck,
  CreditCard,
  CheckSquare,
  Bell,
  MessageSquareWarning,
  Users,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, roles: ['admin', 'project_authority', 'land_acquisition_officer', 'survey_officer', 'compensation_officer'] },
    { to: '/compensation/work-queue', label: 'My Compensation Work', icon: CreditCard, roles: ['admin', 'compensation_officer', 'land_acquisition_officer'] },
    { to: '/map', label: t('nav.map'), icon: MapPin, roles: ['admin', 'project_authority', 'land_acquisition_officer', 'survey_officer', 'compensation_officer', 'landowner'] },
    { to: '/cases', label: t('nav.cases'), icon: FileSpreadsheet, roles: ['admin', 'project_authority', 'land_acquisition_officer', 'survey_officer', 'compensation_officer'] },
    { to: '/projects', label: t('nav.projects'), icon: FolderKanban, roles: ['admin', 'project_authority', 'land_acquisition_officer'] },
    { to: '/documents', label: t('nav.documents'), icon: FileCheck, roles: ['admin', 'land_acquisition_officer', 'survey_officer'] },
    { to: '/compensation', label: t('nav.compensation'), icon: CreditCard, roles: ['admin', 'compensation_officer', 'land_acquisition_officer'] },
    { to: '/tasks', label: t('nav.tasks'), icon: CheckSquare, roles: ['admin', 'project_authority', 'land_acquisition_officer', 'survey_officer'] },
    { to: '/grievances', label: t('nav.grievances'), icon: MessageSquareWarning, roles: ['admin', 'land_acquisition_officer', 'survey_officer'] },
    { to: '/alerts', label: t('nav.alerts'), icon: Bell, roles: ['admin', 'project_authority', 'land_acquisition_officer', 'survey_officer', 'compensation_officer', 'landowner'] },
    { to: '/landowner', label: t('nav.landowner_portal'), icon: UserCheck, roles: ['landowner', 'admin'] },
    { to: '/admin/users', label: t('nav.admin'), icon: ShieldCheck, roles: ['admin'] },
  ];

  const filteredNav = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return item.roles.includes(user.role);
  });

  return (
    <aside className="w-64 bg-govblue-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-xl select-none">
      <div className="space-y-6">
        <div className="px-3 pt-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            {user?.role === 'landowner' ? 'Landowner Services' : 'Decision Portal'}
          </span>
        </div>

        <nav className="space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-govblue-700 text-white font-bold shadow-md'
                      : 'text-slate-300 hover:bg-govblue-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-slate-300" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-govblue-800/60 rounded-xl border border-govblue-700/50 text-[11px] text-slate-400">
        <div className="font-bold text-slate-200 mb-0.5">Decision-Support Mode</div>
        <p className="leading-relaxed">AI delay risk estimates require human officer verification.</p>
      </div>
    </aside>
  );
};
