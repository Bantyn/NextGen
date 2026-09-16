import React, { useState, useEffect } from 'react';
import { Share2, X, AlertTriangle, UserCheck, Stethoscope, Loader2 } from 'lucide-react';
import { getEligibleColleagues, transferCase } from '../services/doctorDashboardService';

/**
 * CaseTransferModal Component
 * Facilitates clinical case handoff to an eligible specialist or department colleague.
 * Enforces audit logging and authorization on the backend.
 */
export const CaseTransferModal = ({
  isOpen,
  onClose,
  caseId,
  sessionId,
  patientName,
  token,
  onTransferSuccess,
}) => {
  const [colleagues, setColleagues] = useState([]);
  const [loadingColleagues, setLoadingColleagues] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoadingColleagues(true);
      setErrorMessage('');
      getEligibleColleagues()
        .then((data) => {
          setColleagues(data || []);
          if (data && data.length > 0) {
            setSelectedDoctorId(data[0].doctor_id);
          }
        })
        .catch((err) => {
          console.error('Failed to load eligible doctors:', err);
          setErrorMessage('Could not load eligible doctors list.');
        })
        .finally(() => setLoadingColleagues(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setErrorMessage('Please select a recipient specialist.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Please provide a clinical rationale / reason for transferring this case.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // Transfer case via API
      await transferCase(caseId || sessionId, selectedDoctorId, reason);
      if (onTransferSuccess) {
        onTransferSuccess(selectedDoctorId, reason);
      }
      onClose();
    } catch (err) {
      console.error('Case transfer error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to transfer case. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedColleague = colleagues.find((c) => c.doctor_id === selectedDoctorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transfer Case / Clinical Escalation</h3>
              <p className="text-[11px] text-slate-400">
                Handoff case to another authorized on-duty specialist
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient Reference Card */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient</span>
            <span className="font-semibold text-slate-900">{patientName || 'Active Patient'}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Encounter</span>
            <span className="font-mono text-slate-700">{token || sessionId}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-3.5">
          {/* Recipient Doctor Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Recipient Specialist *
            </label>
            {loadingColleagues ? (
              <div className="py-3 text-center text-xs text-slate-400">Loading on-duty doctors...</div>
            ) : (
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              >
                {colleagues.map((doc) => (
                  <option key={doc.doctor_id} value={doc.doctor_id}>
                    {doc.doctor_name} — {doc.specialty} ({doc.room || 'OPD'})
                  </option>
                ))}
              </select>
            )}
            {selectedColleague && (
              <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-purple-600" />
                <span>
                  {selectedColleague.specialty} • {selectedColleague.hospital || 'MediKiosk Apex Civil Hospital'}
                </span>
              </p>
            )}
          </div>

          {/* Clinical Reason for Transfer */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Clinical Transfer Reason / Handover Summary *
            </label>
            <textarea
              rows="3"
              required
              placeholder="Detail reasons for referral (e.g., patient exhibits ECG abnormalities requiring urgent cardiology evaluation; transferring for second opinion)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500 placeholder:text-slate-400 font-sans"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingColleagues}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transferring Case...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Confirm Clinical Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseTransferModal;
