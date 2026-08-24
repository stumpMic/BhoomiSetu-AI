import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSelector = ({ className = '' }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={`flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold ${className}`}>
      <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded transition-all ${
          i18n.language === 'en' ? 'bg-white text-govblue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('hi')}
        className={`px-2 py-1 rounded transition-all ${
          i18n.language === 'hi' ? 'bg-white text-govblue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        हिन्दी
      </button>
      <button
        onClick={() => changeLanguage('or')}
        className={`px-2 py-1 rounded transition-all ${
          i18n.language === 'or' ? 'bg-white text-govblue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        ଓଡ଼ିଆ
      </button>
    </div>
  );
};
