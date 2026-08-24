import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { grievanceService } from '../../services/grievanceService';
import { useNotifications } from '../../context/NotificationContext';
import { MessageSquareWarning, Send, CheckCircle2, ArrowLeft, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LandownerGrievancePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [category, setCategory] = useState('Valuation Dispute');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(null);
  const [myGrievances, setMyGrievances] = useState([]);

  const loadMyGrievances = async () => {
    const data = await grievanceService.getGrievances({ landowner_id: 12 });
    setMyGrievances(data);
  };

  useEffect(() => {
    loadMyGrievances();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !description) {
      showToast('Please fill all fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await grievanceService.submitGrievance({
        category,
        subject,
        description,
        case_id: 4,
        parcel_id: 12
      });
      setSubmittedRef(res.grievance_number);
      showToast(`Grievance ${res.grievance_number} filed successfully!`, 'success');
      setSubject('');
      setDescription('');
      loadMyGrievances();
    } catch (err) {
      showToast('Failed to submit grievance: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/landowner')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('landowner.file_grievance')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Submit statutory objection or compensation inquiry directly to the Land Acquisition Officer.
          </p>
        </div>
      </div>

      {/* Success Acknowledgement Box */}
      {submittedRef && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-emerald-950">Grievance Registered Successfully</div>
              <div className="text-xs text-emerald-800">
                Acknowledgement Ref: <strong className="font-mono">{submittedRef}</strong>
              </div>
            </div>
          </div>
          <button className="bg-white hover:bg-slate-50 text-slate-800 font-bold px-3 py-1.5 rounded-lg border border-emerald-300 text-xs shadow-sm flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            Receipt PDF
          </button>
        </div>
      )}

      {/* Grievance Submission Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Objection Filing Form</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Grievance Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-govblue-500"
            >
              <option value="Valuation Dispute">Valuation Dispute (Section 15)</option>
              <option value="Ownership Title Dispute">Ownership Title / Co-sharer Dispute</option>
              <option value="Area Mismatch">Cadastral Boundary / Area Mismatch</option>
              <option value="Payment Delay">Compensation Payment Delay</option>
              <option value="Rehabilitation Claim">Rehabilitation & Resettlement Claim</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Subject Summary
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Request for title share verification for Plot #142/A"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Statement / Grounds of Objection
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete facts, co-sharer names, deed registration references, etc."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-govblue-500 font-medium leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-govblue-700 hover:bg-govblue-800 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting to Collectorate...' : 'Submit Grievance'}</span>
          </button>
        </form>
      </div>

      {/* Past Grievances History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">{t('landowner.track_grievance')}</h3>
        <div className="divide-y divide-slate-100">
          {myGrievances.map((g) => (
            <div key={g.id} className="py-3 flex justify-between items-center text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900">{g.grievance_number}</span>
                <p className="text-slate-600 font-medium mt-0.5">{g.subject}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full font-bold ${
                g.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {g.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
