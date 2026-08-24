import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">403 — Unauthorized Access</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 font-medium">
        You do not have the required statutory officer privileges to view this section of the BhoomiSetu AI portal.
      </p>
      <Link
        to="/"
        className="mt-6 bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Portal
      </Link>
    </div>
  );
};

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-5xl font-black text-slate-900 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-slate-700 mt-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-md mt-1 font-medium">
        The requested record or portal section does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        Return Home
      </Link>
    </div>
  );
};
