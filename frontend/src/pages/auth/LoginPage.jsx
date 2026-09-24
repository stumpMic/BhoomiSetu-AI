import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Shield, 
  Lock, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  UserPlus, 
  HelpCircle,
  X
} from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.full_name}!`, 'success');
      if (user.role === 'landowner') {
        navigate('/landowner');
      } else if (user.role === 'survey_officer') {
        navigate('/survey/dashboard');
      } else if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate(from === '/login' ? '/dashboard' : from);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Invalid email or password';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('DemoPass123!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-govblue-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-govblue-500 mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl">
          BS
        </div>
        <h2 className="mt-4 text-3xl font-black text-white tracking-tight">
          BhoomiSetu AI Portal
        </h2>
        <p className="mt-1.5 text-sm text-slate-400 font-medium">
          Predictive Analytics & Land Acquisition Decision Support
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          
          {/* Error Banner */}
          {error && (
            <div className={`mb-5 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
              error.includes('awaiting verification')
                ? 'bg-amber-50 border border-amber-200 text-amber-900'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {error.includes('awaiting verification') ? (
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <strong className="block mb-0.5">
                  {error.includes('awaiting verification') ? 'Account Pending Verification' : 'Authentication Notice'}
                </strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Email Address / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. officer.patra@bhoomisetu.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-govblue-700 hover:text-govblue-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Create Account Link (Prompt Requirement #1) */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 mb-2 font-medium">
              Don't have an account?
            </p>
            <Link
              to="/register"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-govblue-600 text-govblue-700 hover:bg-govblue-50 font-bold text-xs transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account (Role-Based Registration)</span>
            </Link>
          </div>

          {/* Quick Demo Login Credentials Buttons */}
          {/* Quick Demo Login Credentials Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
              Demo Accounts (Pass: DemoPass123!)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('officer.patra@bhoomisetu.gov.in')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-govblue-50 border border-slate-200 text-left font-medium text-slate-700 hover:text-govblue-700 transition-all"
              >
                <div className="font-bold">Land Acquisition Officer</div>
                <div className="text-[10px] text-slate-400">Ashok Patra (Khurda)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('landowner.das@gmail.com')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left font-medium text-slate-700 hover:text-emerald-700 transition-all"
              >
                <div className="font-bold">Landowner (Farmer)</div>
                <div className="text-[10px] text-slate-400">Bikram Das (Plot 142/A)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('surveyor.mishra@bhoomisetu.gov.in')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 text-left font-medium text-slate-700 hover:text-amber-700 transition-all"
              >
                <div className="font-bold">Survey Officer</div>
                <div className="text-[10px] text-slate-400">Sunita Mishra</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('comp.jena@bhoomisetu.gov.in')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left font-medium text-slate-700 hover:text-blue-700 transition-all"
              >
                <div className="font-bold">Compensation Officer</div>
                <div className="text-[10px] text-slate-400">Debasis Jena</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 font-medium">
          <Link to="/" className="hover:text-white underline mr-4">← Back to Public Portal</Link>
          <span>BhoomiSetu AI Decision Support Prototype • Odisha</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-govblue-700 font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                <span>Account Recovery / Password Reset</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5">
              <p>
                <strong>For Government Officers:</strong> Please contact your District Land Acquisition Cell or IT Administrator at <code className="bg-slate-100 px-1.5 py-0.5 rounded text-govblue-800">admin@bhoomisetu.gov.in</code> with your official Employee ID and Office Code.
              </p>
              <p>
                <strong>For Landowners / Citizens:</strong> OTP password resets are available via registered Aadhaar/Mobile number at the local Tahsil Revenue Helpdesk.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                <strong>Prototype Notice:</strong> All pre-seeded demo accounts use the standard demonstration password: <code className="font-bold">DemoPass123!</code>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
