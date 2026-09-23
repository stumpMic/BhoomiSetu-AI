import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('BhoomiSetu Uncaught Component Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600 border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Application Notice</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                An unexpected interface error occurred. Please click below to refresh the page or return to the main portal.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-govblue-700 hover:bg-govblue-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                <Home className="w-4 h-4" /> Home Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
