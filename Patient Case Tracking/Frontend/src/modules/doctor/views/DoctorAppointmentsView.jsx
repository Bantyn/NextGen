import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Stethoscope,
  ExternalLink,
  Filter,
  AlertCircle,
  Building,
} from 'lucide-react';
import {
  getDoctorAppointments,
  createDoctorAppointment,
  updateAppointmentStatus,
} from '../services/doctorDashboardService';

export const DoctorAppointmentsView = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('TODAY');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [counts, setCounts] = useState({ today: 0, upcoming: 0, completed: 0, cancelled: 0, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [newAppt, setNewAppt] = useState({
    patient_id: 'PAT-701A1',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '02:30 PM',
    opd_type: 'GENERAL',
    opd_system: 'GENERAL_MEDICINE',
    reason: 'Follow-up Clinical Review',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDoctorAppointments(tab, search);
      if (res?.appointments) {
        setAppointments(res.appointments);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const timer = setTimeout(fetchAppointments, 200);
    return () => clearTimeout(timer);
  }, [fetchAppointments]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      fetchAppointments();
    } catch (err) {
      alert(`Failed to update appointment: ${err.message}`);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createDoctorAppointment(newAppt);
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      alert(`Failed to schedule appointment: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Appointments & Consultation Schedule</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage scheduled patient bookings, follow-up consults, and clinical time slots.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Appointment</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {[
            { key: 'TODAY', label: "Today's Schedule", count: counts.today },
            { key: 'UPCOMING', label: 'Upcoming', count: counts.upcoming },
            { key: 'COMPLETED', label: 'Completed', count: counts.completed },
            { key: 'CANCELLED', label: 'Cancelled', count: counts.cancelled },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
                tab === t.key
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, token, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
          />
        </div>
      </div>

      {/* Appointment Cards / Schedule List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading appointments schedule...</div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No appointments found in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {appointments.map((appt) => {
            const isConfirmed = appt.status === 'CONFIRMED';
            const isCompleted = appt.status === 'COMPLETED';
            const isCancelled = appt.status === 'CANCELLED';

            return (
              <div
                key={appt.appointmentId || appt.id}
                className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-md transition space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs flex items-center gap-1.5 border border-sky-100">
                        <Clock className="w-3.5 h-3.5" />
                        {appt.time}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{appt.date}</span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900">{appt.patientName}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {appt.age} yrs • {appt.gender} • {appt.phone || 'Phone verified'}
                    </div>
                  </div>

                  <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Clinical Reason</div>
                    <div>{appt.reason}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span>{appt.opdType} OPD ({appt.opdSystem}) • {appt.room}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!isCompleted && !isCancelled && (
                      <>
                        <button
                          onClick={() => handleStatusChange(appt.appointmentId || appt.id, 'COMPLETED')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => handleStatusChange(appt.appointmentId || appt.id, 'CANCELLED')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => navigate('/doctor/opd')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                  >
                    <span>Start Consult</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Schedule Patient Appointment</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Patient ID</label>
                <input
                  type="text"
                  required
                  value={newAppt.patient_id}
                  onChange={(e) => setNewAppt({ ...newAppt, patient_id: e.target.value })}
                  placeholder="e.g. PAT-701A1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newAppt.appointment_date}
                    onChange={(e) => setNewAppt({ ...newAppt, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={newAppt.appointment_time}
                    onChange={(e) => setNewAppt({ ...newAppt, appointment_time: e.target.value })}
                    placeholder="e.g. 10:30 AM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">OPD Category</label>
                  <select
                    value={newAppt.opd_type}
                    onChange={(e) => setNewAppt({ ...newAppt, opd_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="GENERAL">General OPD</option>
                    <option value="AYUSH">AYUSH OPD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">System / Specialization</label>
                  <select
                    value={newAppt.opd_system}
                    onChange={(e) => setNewAppt({ ...newAppt, opd_system: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="GENERAL_MEDICINE">General Medicine</option>
                    <option value="AYURVEDA">Ayurveda</option>
                    <option value="YOGA_NATUROPATHY">Yoga & Naturopathy</option>
                    <option value="UNANI">Unani</option>
                    <option value="SIDDHA">Siddha</option>
                    <option value="HOMOEOPATHY">Homoeopathy</option>
                    <option value="SOWA_RIGPA">Sowa-Rigpa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Consultation</label>
                <input
                  type="text"
                  required
                  value={newAppt.reason}
                  onChange={(e) => setNewAppt({ ...newAppt, reason: e.target.value })}
                  placeholder="e.g. Routine glycemic monitoring & review"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={newAppt.notes}
                  onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                  placeholder="Instructions for receptionist or nurse..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentsView;
