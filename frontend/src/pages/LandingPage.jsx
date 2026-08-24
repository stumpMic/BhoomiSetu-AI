import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, ShieldAlert, Cpu, FileCheck, ArrowRight, BarChart3, Users, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/map?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-govblue-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:20px_20px] opacity-25"></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Smart India Hackathon Prototype 2026 • Government of Odisha
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Early Detection of <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">Land Acquisition Delays</span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            BhoomiSetu AI leverages Random Forest Machine Learning, SHAP explainability, Cadastral GIS mapping, and automated OCR discrepancy detection to eliminate bottlenecks in major infrastructure projects.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-white/20">
            <Search className="w-5 h-5 text-slate-400 ml-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Plot Number, Khata, or Case # (e.g. 142/A)..."
              className="w-full px-3 py-2.5 text-slate-900 text-sm focus:outline-none font-medium placeholder-slate-400"
            />
            <button
              type="submit"
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md flex-shrink-0"
            >
              Track Plot
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 pt-8 border-t border-slate-800 text-left">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-black text-amber-400">3 Major</div>
              <div className="text-xs text-slate-400 mt-0.5">Corridor Projects</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400">84 Parcels</div>
              <div className="text-xs text-slate-400 mt-0.5">Cadastral Demarcation</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-black text-blue-400">92.8%</div>
              <div className="text-xs text-slate-400 mt-0.5">ML Delay Accuracy</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-black text-purple-400">9 Stages</div>
              <div className="text-xs text-slate-400 mt-0.5">Compensation Pipeline</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-govblue-700 uppercase tracking-widest">Multi-Tier Technology</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Built for Transparent Land Governance
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">Predictive Delay AI</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Random Forest models analyze 17 operational risk metrics to flag delay probabilities (0–100%) and estimate delay days before bottlenecks stall the project.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">Cadastral GIS Mapping</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Color-coded interactive Leaflet maps display high-risk red polygons, medium yellow plots, and verified green parcels with real-time case links.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-2">OCR Discrepancy Engine</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Automated document scanner parses RoR deeds, cross-references official land databases via RapidFuzz, and highlights plot or name mismatches for officer sanction.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
