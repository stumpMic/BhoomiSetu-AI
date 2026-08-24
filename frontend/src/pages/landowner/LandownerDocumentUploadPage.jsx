import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../../services/documentService';
import { useNotifications } from '../../context/NotificationContext';
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LandownerDocumentUploadPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('Record of Rights (RoR)');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a file to upload', 'error');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('case_id', 4);
      formData.append('parcel_id', 12);
      formData.append('document_type', docType);
      formData.append('file', file);

      const res = await documentService.uploadDocument(formData);
      setResult(res);
      showToast('Document uploaded and analyzed via OCR!', 'success');
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/landowner')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('landowner.upload_documents')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Upload RoR / Patta deeds for Plot #142/A (Case: CASE-OD-2026-004).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Document Category
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-govblue-500"
            >
              <option value="Record of Rights (RoR)">Record of Rights (RoR / Patta)</option>
              <option value="Land Mutation Certificate">Land Mutation Certificate</option>
              <option value="Legal Heir Certificate">Legal Heir / Succession Certificate</option>
              <option value="Bank Passbook Front Page">Bank Passbook / Cancelled Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Upload PDF or Scanned Image (Max 10MB)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-govblue-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
                id="doc-file-input"
              />
              <label htmlFor="doc-file-input" className="cursor-pointer block space-y-2">
                <Upload className="w-8 h-8 text-govblue-700 mx-auto" />
                <div className="text-xs font-bold text-slate-900">
                  {file ? file.name : 'Click to select file or drag & drop here'}
                </div>
                <div className="text-[11px] text-slate-400">PDF, PNG, JPG supported</div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Processing OCR Extraction...' : 'Submit & Analyze Deed'}</span>
          </button>
        </form>

        {/* OCR Result Box */}
        {result && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 animate-fade-in">
            <h4 className="font-bold text-slate-900 text-sm">Automated OCR Results</h4>
            {result.has_discrepancy ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950 block">Discrepancy Detected by System:</span>
                  <p className="mt-0.5 text-amber-800">{result.flagged_issues[0]}</p>
                  <p className="mt-1 text-slate-600">The Land Acquisition Officer has been notified for manual review.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Document extracted and verified without discrepancies!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
