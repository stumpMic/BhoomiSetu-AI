import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { LanguageSelector } from './LanguageSelector';
import { Bell, Shield, User, LogOut, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-govblue-900 to-govblue-700 flex items-center justify-center text-white font-black text-xl shadow-md">
              BS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-govblue-700 transition-all">
                  BhoomiSetu AI
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-300">
                  ODISHA PROTOTYPE
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Predictive Land Acquisition Delay Management
              </p>
            </div>
          </Link>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-4">
          <LanguageSelector />

          {user && (
            <Link
              to="/alerts"
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-slate-900">{user.full_name}</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {user.role_display || user.role}
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-govblue-700 hover:bg-govblue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
