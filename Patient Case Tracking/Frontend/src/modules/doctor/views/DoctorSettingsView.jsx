import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Building,
  Shield,
  Clock,
  Save,
  CheckCircle2,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import {
  getDoctorProfile,
  updateDoctorProfile,
} from '../services/doctorDashboardService';

export const DoctorSettingsView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    sub_specialty: '',
    opd_type: 'GENERAL',
    opd_system: 'GENERAL_MEDICINE',
    room: 'Room 104',
    on_duty: true,
    availability_status: 'AVAILABLE',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getDoctorProfile();
        if (data) setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateDoctorProfile(profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Doctor Clinical Settings & OPD Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure personal clinical credentials, departmental assignment (General / AYUSH), room allocation, and on-duty availability.
        </p>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Doctor profile settings and OPD system preferences updated successfully!</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading profile configuration...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Identity & Personal Credentials */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-sky-600" />
              <span>Physician Identity & Contact</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Legal / Clinical Name</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Verified Medical Email</label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Hospital Extension / Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 98250 12345"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned OPD Room Number</label>
                <input
                  type="text"
                  required
                  value={profile.room}
                  onChange={(e) => setProfile({ ...profile, room: e.target.value })}
                  placeholder="e.g. Room 104"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 2. Medical System & Specialization (AYUSH / General OPD) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Departmental & Medical System Assignment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Primary OPD Wing</label>
                <select
                  value={profile.opd_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setProfile({
                      ...profile,
                      opd_type: newType,
                      opd_system: newType === 'AYUSH' ? 'AYURVEDA' : 'GENERAL_MEDICINE',
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                >
                  <option value="GENERAL">General OPD (Modern Conventional Medicine)</option>
                  <option value="AYUSH">AYUSH OPD (Traditional & Holistic Systems)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {profile.opd_type === 'AYUSH' ? 'AYUSH Medical Discipline' : 'Clinical Specialization'}
                </label>
                {profile.opd_type === 'AYUSH' ? (
                  <select
                    value={profile.opd_system}
                    onChange={(e) => setProfile({ ...profile, opd_system: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="AYURVEDA">Ayurveda (Kayachikitsa / Panchakarma)</option>
                    <option value="YOGA_NATUROPATHY">Yoga & Naturopathy (Nisargopachar)</option>
                    <option value="UNANI">Unani (Ilaj-bil-Tadbeer)</option>
                    <option value="SIDDHA">Siddha (Maruthuvam)</option>
                    <option value="HOMOEOPATHY">Homoeopathy (Similia Similibus)</option>
                    <option value="SOWA_RIGPA">Sowa-Rigpa (Tibetan Traditional Medicine)</option>
                  </select>
                ) : (
                  <select
                    value={profile.opd_system}
                    onChange={(e) => setProfile({ ...profile, opd_system: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="GENERAL_MEDICINE">General Medicine (Internal Medicine / MBBS / MD)</option>
                    <option value="CARDIOLOGY">Cardiology</option>
                    <option value="PULMONOLOGY">Pulmonology / Chest Medicine</option>
                    <option value="NEUROLOGY">Neurology</option>
                    <option value="DERMATOLOGY">Dermatology</option>
                    <option value="ORTHOPEDICS">Orthopedics</option>
                  </select>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Sub-Specialty / Clinical Focus</label>
                <input
                  type="text"
                  value={profile.sub_specialty || ''}
                  onChange={(e) => setProfile({ ...profile, sub_specialty: e.target.value })}
                  placeholder="e.g. Diabetology, Lifestyle Disorders, Chronic Joint Management"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 3. Availability & On-Duty Schedule */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Live Availability & Shift Status</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Current Duty Status</label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="on_duty"
                      checked={profile.on_duty === true}
                      onChange={() => setProfile({ ...profile, on_duty: true, availability_status: 'AVAILABLE' })}
                      className="text-slate-950 focus:ring-0"
                    />
                    <span>On Duty (Receiving OPD Queue)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                    <input
                      type="radio"
                      name="on_duty"
                      checked={profile.on_duty === false}
                      onChange={() => setProfile({ ...profile, on_duty: false, availability_status: 'OFF_DUTY' })}
                      className="text-slate-950 focus:ring-0"
                    />
                    <span>Off Duty</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Availability State</label>
                <select
                  value={profile.availability_status}
                  onChange={(e) => setProfile({ ...profile, availability_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                >
                  <option value="AVAILABLE">AVAILABLE (Active Consultation Ready)</option>
                  <option value="IN_CONSULTATION">IN CONSULTATION (Engaged with Patient)</option>
                  <option value="ON_BREAK">ON BREAK (Brief Inactivity)</option>
                  <option value="OFF_DUTY">OFF DUTY (Shift Concluded)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DoctorSettingsView;
