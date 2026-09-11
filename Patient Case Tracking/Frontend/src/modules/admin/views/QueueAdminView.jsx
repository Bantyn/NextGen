import React, { useState } from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import AdminTable from '../components/AdminTable';
import AdminStatusBadge from '../components/AdminStatusBadge';
import AdminModal from '../components/AdminModal';
import adminApiService from '../services/adminApiService';

export const QueueAdminView = ({
  queue = [],
  onRefresh,
}) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [newPriority, setNewPriority] = useState('URGENT');
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleOpenOverride = (session) => {
    setSelectedSession(session);
    setNewPriority(session.priority || 'URGENT');
    setOverrideReason('');
    setSuccessMessage('');
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      setSubmitting(true);
      await adminApiService.overrideQueuePriority(
        selectedSession.session_id,
        newPriority,
        overrideReason || 'Administrative queue adjustment'
      );
      setSuccessMessage('Priority overridden successfully.');
      setTimeout(() => {
        setSelectedSession(null);
        if (onRefresh) onRefresh();
      }, 700);
    } catch (err) {
      alert(`Error updating queue priority: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Token',
      key: 'token_number',
      width: '100px',
      render: (row) => (
        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
          {row.token_number}
        </span>
      ),
    },
    {
      header: 'Patient ID',
      key: 'patient_id',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700">{row.patient_id}</span>
      ),
    },
    {
      header: 'Chief Complaint',
      key: 'chief_complaint',
      render: (row) => (
        <div>
          <span className="text-slate-800 font-medium">{row.chief_complaint}</span>
          {row.has_red_flag && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
              Red Flag
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Language',
      key: 'language',
      render: (row) => (
        <span className="uppercase text-[10px] font-semibold tracking-wider text-slate-500">
          {row.language || 'gu-IN'}
        </span>
      ),
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (row) => <AdminStatusBadge status={row.priority} variant="priority" size="xs" />,
    },
    {
      header: 'Session Status',
      key: 'status',
      render: (row) => <AdminStatusBadge status={row.status} size="xs" />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <button
          onClick={() => handleOpenOverride(row)}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
        >
          Override Priority
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Live OPD Queue Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time patient progression through check-in, automated triage, and physician handoff.
        </p>
      </div>

      <AdminTable
        columns={columns}
        data={queue}
        emptyTitle="Queue is currently clear"
        emptyDescription="No registered patients are currently waiting for intake or physician review."
      />

      {/* Override Priority Modal */}
      <AdminModal
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        title="Override Clinical Queue Priority"
        description={`Modify priority for Token ${selectedSession?.token_number} (${selectedSession?.patient_id})`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveOverride}
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Applying...' : 'Confirm Override'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveOverride} className="space-y-4">
          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select New Priority
            </label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="EMERGENCY">EMERGENCY (Immediate Red-Flag Dispatch)</option>
              <option value="HIGH_PRIORITY">HIGH_PRIORITY (Expedited Review)</option>
              <option value="URGENT">URGENT (Elevated)</option>
              <option value="MODERATE">MODERATE (Standard Wait)</option>
              <option value="ROUTINE">ROUTINE (Standard OPD)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Administrative Reason (Required for Audit Trail)
            </label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g., Patient presented with sudden worsening dyspnea in waiting hall."
              rows={3}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              All priority overrides are permanently recorded in the institutional audit log with your administrative user ID.
            </span>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default QueueAdminView;
