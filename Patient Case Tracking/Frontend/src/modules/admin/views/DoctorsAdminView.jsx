import React, { useState, useEffect } from 'react';
import { Stethoscope, Check, Clock } from 'lucide-react';
import AdminTable from '../components/AdminTable';
import AdminStatusBadge from '../components/AdminStatusBadge';
import AdminModal from '../components/AdminModal';
import adminApiService from '../services/adminApiService';

export const DoctorsAdminView = ({ onRefreshRoster }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState('AVAILABLE');
  const [onDuty, setOnDuty] = useState(true);
  const [specialty, setSpecialty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await adminApiService.getDoctors();
      setDoctors(res.data || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleOpenEdit = (doc) => {
    setEditingDoctor(doc);
    setAvailabilityStatus(doc.availability_status || 'AVAILABLE');
    setOnDuty(doc.on_duty !== false);
    setSpecialty(doc.specialty || 'General Medicine');
    setToastMessage('');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editingDoctor) return;
    try {
      setSubmitting(true);
      await adminApiService.updateDoctorStatus(editingDoctor.doctor_id, {
        availability_status: availabilityStatus,
        on_duty: onDuty,
        specialty,
      });
      setToastMessage('Doctor availability updated. AI Assistant reflects this immediately.');
      setTimeout(() => {
        setEditingDoctor(null);
        fetchDoctors();
        if (onRefreshRoster) onRefreshRoster();
      }, 700);
    } catch (err) {
      alert(`Failed to update doctor: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Physician',
      key: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name || row.doctor_name}</div>
          <div className="text-[10px] text-slate-400 font-mono">{row.doctor_id}</div>
        </div>
      ),
    },
    {
      header: 'Specialty / Unit',
      key: 'specialty',
      render: (row) => (
        <div>
          <span className="text-slate-800 font-medium">{row.specialty}</span>
          {row.sub_specialty && (
            <span className="block text-[10px] text-slate-500">{row.sub_specialty}</span>
          )}
        </div>
      ),
    },
    {
      header: 'OPD Duty',
      key: 'on_duty',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            row.on_duty !== false
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.on_duty !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {row.on_duty !== false ? 'On Duty' : 'Off Duty'}
        </span>
      ),
    },
    {
      header: 'Availability State',
      key: 'availability_status',
      render: (row) => <AdminStatusBadge status={row.availability_status || 'AVAILABLE'} size="xs" />,
    },
    {
      header: 'Room / OPD Schedule',
      key: 'schedule',
      render: (row) => (
        <div className="text-slate-600 text-xs">
          <div className="font-medium text-slate-800">{row.room || 'Room 104'}</div>
          <div className="text-[10px] text-slate-400">09:00 AM – 02:00 PM</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <button
          onClick={() => handleOpenEdit(row)}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
        >
          Configure
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Doctor Management & Rostering</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physician availability, room assignments, and specialty routing for both OPD and AI Assistant queries.
          </p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={doctors}
        loading={loading}
        emptyTitle="No Doctors Registered"
        emptyDescription="Please check the directory service or configure clinical staff."
      />

      {/* Edit Doctor Availability Modal */}
      <AdminModal
        isOpen={Boolean(editingDoctor)}
        onClose={() => setEditingDoctor(null)}
        title={`Configure: ${editingDoctor?.name || editingDoctor?.doctor_name}`}
        description={`ID: ${editingDoctor?.doctor_id} | Changes immediately propagate to patient-facing AI assistant.`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingDoctor(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveStatus}
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Update Roster'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveStatus} className="space-y-4">
          {toastMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Clinical Specialty
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="block text-xs font-semibold text-slate-800">OPD On-Duty Status</span>
              <span className="text-[11px] text-slate-500">Enable when physician is actively present at hospital.</span>
            </div>
            <input
              type="checkbox"
              checked={onDuty}
              onChange={(e) => setOnDuty(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded-sm cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Live Availability State
            </label>
            <select
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="AVAILABLE">AVAILABLE (Accepting Patients)</option>
              <option value="BUSY">BUSY (In Consultation)</option>
              <option value="ON_BREAK">ON_BREAK (Temporary Rest)</option>
              <option value="OFFLINE">OFFLINE (Shift Concluded)</option>
            </select>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default DoctorsAdminView;
