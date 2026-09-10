import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import AdminTable from '../components/AdminTable';
import AdminStatusBadge from '../components/AdminStatusBadge';
import AdminModal from '../components/AdminModal';
import adminApiService from '../services/adminApiService';

export const TriageAdminView = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRedFlags = async () => {
    try {
      setLoading(true);
      const res = await adminApiService.getRedFlags();
      setCases(res.data || []);
    } catch (err) {
      console.error('Error fetching red flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedFlags();
  }, []);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      setSubmitting(true);
      await adminApiService.resolveRedFlag(
        selectedCase.case_id,
        resolutionNotes || 'Triage operator marked incident resolved.'
      );
      setSelectedCase(null);
      fetchRedFlags();
    } catch (err) {
      alert(`Failed to resolve incident: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Case ID',
      key: 'case_id',
      render: (row) => <span className="font-mono font-semibold text-slate-800">{row.case_id}</span>,
    },
    {
      header: 'Patient ID',
      key: 'patient_id',
      render: (row) => <span className="font-mono text-slate-600">{row.patient_id}</span>,
    },
    {
      header: 'Severity',
      key: 'severity',
      render: (row) => <AdminStatusBadge status={row.severity || 'CRITICAL'} variant="priority" size="xs" />,
    },
    {
      header: 'Trigger Symptoms',
      key: 'triggers',
      render: (row) => {
        const triggers = row.triggers || (row.red_flags ? [row.red_flags.reason] : ['Acute chest discomfort / severe distress']);
        return (
          <div className="flex flex-wrap gap-1">
            {triggers.map((t, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-sm bg-rose-50 text-rose-700 text-[10px] font-medium">
                {typeof t === 'string' ? t : t.description || 'Red flag symptom'}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Triage Status',
      key: 'status',
      render: (row) => <AdminStatusBadge status={row.status} size="xs" />,
    },
    {
      header: 'Time Triggered',
      key: 'createdAt',
      render: (row) => (
        <span className="text-slate-500 text-[11px]">
          {new Date(row.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        row.status !== 'RESOLVED' ? (
          <button
            onClick={() => {
              setSelectedCase(row);
              setResolutionNotes('');
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition"
          >
            Resolve Case
          </button>
        ) : (
          <span className="text-emerald-600 font-medium text-[11px] inline-flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Resolved
          </span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Emergency & Triage Monitoring</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisory monitoring for automated red-flag detections, doctor escalations, and incident resolutions.
          </p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={cases}
        loading={loading}
        emptyTitle="No Active Red-Flag Emergencies"
        emptyDescription="All triage alerts have been handled or no critical conditions are currently detected."
      />

      {/* Resolve Case Modal */}
      <AdminModal
        isOpen={Boolean(selectedCase)}
        onClose={() => setSelectedCase(null)}
        title="Resolve Emergency Red-Flag Alert"
        description={`Document resolution for Case ${selectedCase?.case_id}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setSelectedCase(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResolve}
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </>
        }
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Resolution Clinical Notes
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g., Patient transferred immediately to Emergency Department Bed 04; stabilized with IV fluids."
              rows={3}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
            <span>
              Resolving this incident marks the emergency as closed in the supervisor dashboard and updates the clinical timeline.
            </span>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default TriageAdminView;
