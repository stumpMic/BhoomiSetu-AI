import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { hearingService } from '../../services/hearingService';
import { useNotifications } from '../../context/NotificationContext';

export const ScheduleHearingModal = ({ isOpen, onClose, caseId, caseNumber, onHearingScheduled }) => {
  const { showToast } = useNotifications();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    case_id: caseId || 4,
    case_number: caseNumber || "CASE-OD-2026-004",
    hearing_type: "Section 15 Objections Hearing",
    title: "Public Hearing on RoR Title & Boundary Objections - Plot #142",
    hearing_date: "2026-09-20",
    hearing_time: "11:00 AM",
    venue_or_mode: "Collectorate Conference Hall, Khurda",
    participants: "Land Acquisition Officer, Tahsildar Pipili, Bikram Keshari Das & Co-sharers",
    purpose: "Formal hearing for affected landowners to present evidence on sub-plot demarcation and title claims.",
    status: "Scheduled"
  });

  useEffect(() => {
    if (caseId) {
      setFormData(prev => ({ ...prev, case_id: caseId, case_number: caseNumber }));
    }
  }, [caseId, caseNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const scheduled = await hearingService.scheduleHearing(formData);
      showToast(`Hearing scheduled for ${scheduled.hearing_date} at ${scheduled.hearing_time}!`, 'success');
      if (onHearingScheduled) onHearingScheduled(scheduled);
      onClose();
    } catch (err) {
      showToast('Failed to schedule hearing: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 bg-gradient-to-r from-govblue-900 to-govblue-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">Schedule Statutory Hearing / Meeting</h2>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Hearing Type</label>
            <select
              value={formData.hearing_type}
              onChange={(e) => setFormData({ ...formData, hearing_type: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none font-bold"
            >
              <option value="Section 15 Objections Hearing">Section 15 Objections Hearing</option>
              <option value="Land Valuation & Award Consultation">Land Valuation & Award Consultation</option>
              <option value="Rehabilitation & Resettlement (R&R) Meeting">Rehabilitation & Resettlement (R&R) Meeting</option>
              <option value="Joint Field Demarcation Briefing">Joint Field Demarcation Briefing</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Hearing Title / Subject</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.hearing_date}
                onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Time</label>
              <input
                type="text"
                required
                value={formData.hearing_time}
                onChange={(e) => setFormData({ ...formData, hearing_time: e.target.value })}
                placeholder="e.g. 11:00 AM"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Venue / Online Mode</label>
            <input
              type="text"
              required
              value={formData.venue_or_mode}
              onChange={(e) => setFormData({ ...formData, venue_or_mode: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Invited Participants</label>
            <input
              type="text"
              value={formData.participants}
              onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
              placeholder="e.g. LAO, Tahsildar, Title Holders of Plot #142"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Hearing Purpose & Agenda</label>
            <textarea
              rows={2}
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-govblue-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-govblue-700 hover:bg-govblue-800 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Schedule Hearing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
