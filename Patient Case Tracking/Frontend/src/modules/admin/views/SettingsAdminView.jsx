import React, { useState } from 'react';
import { Settings, ShieldCheck, Check, Building } from 'lucide-react';

export const SettingsAdminView = () => {
  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'All India Institute of Ayurveda (AIIA)',
    unit: 'Sehat Smart Kiosk & OPD Automation Hub',
    opd_hours: '08:00 AM – 02:00 PM (Mon - Sat)',
    emergency_line: '108 / 011-2999-7000',
    address: 'Gautampuri, Sarita Vihar, Mathura Road, New Delhi 110076',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const rbacMatrix = [
    { role: 'SUPER_ADMIN', desc: 'Full uncontrolled administrative & audit privileges', patients: true, doctors: true, queue: true, triage: true, meds: true, ai: true, audit: true },
    { role: 'HOSPITAL_ADMIN', desc: 'Day-to-day facility management & doctor rostering', patients: true, doctors: true, queue: true, triage: true, meds: true, ai: true, audit: true },
    { role: 'DOCTOR', desc: 'Clinical intake review, diagnosis & prescription sign-off', patients: true, doctors: false, queue: true, triage: true, meds: false, ai: false, audit: false },
    { role: 'RECEPTION', desc: 'Kiosk check-in support, queue ticketing & registration', patients: true, doctors: false, queue: true, triage: false, meds: false, ai: false, audit: false },
    { role: 'ANALYST', desc: 'Read-only statistical telemetry and clinical reporting', patients: false, doctors: false, queue: false, triage: false, meds: false, ai: false, audit: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Hospital Settings & RBAC Permissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure institutional profile details and view the enforced Role-Based Access Control matrix.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hospital Facility Profile Form */}
        <div className="lg:col-span-1 p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-sky-600" />
            <span>Facility Information</span>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Institution Name</label>
              <input
                type="text"
                value={hospitalInfo.name}
                onChange={(e) => setHospitalInfo({ ...hospitalInfo, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">OPD Registration Timings</label>
              <input
                type="text"
                value={hospitalInfo.opd_hours}
                onChange={(e) => setHospitalInfo({ ...hospitalInfo, opd_hours: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Help Line</label>
              <input
                type="text"
                value={hospitalInfo.emergency_line}
                onChange={(e) => setHospitalInfo({ ...hospitalInfo, emergency_line: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2 px-4 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Facility Profile</span>
              )}
            </button>
          </form>
        </div>

        {/* RBAC Permission Matrix */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Role-Based Access Control (RBAC) Governance</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Enforced at Backend API
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-2 text-center">Patients</th>
                  <th className="py-2.5 px-2 text-center">Doctors</th>
                  <th className="py-2.5 px-2 text-center">Queue</th>
                  <th className="py-2.5 px-2 text-center">Triage</th>
                  <th className="py-2.5 px-2 text-center">Meds</th>
                  <th className="py-2.5 px-2 text-center">AI Config</th>
                  <th className="py-2.5 px-2 text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rbacMatrix.map((row) => (
                  <tr key={row.role} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 text-xs">{row.role}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{row.desc}</div>
                    </td>
                    <td className="py-3 px-2 text-center">{row.patients ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.doctors ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.queue ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.triage ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.meds ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.ai ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-3 px-2 text-center">{row.audit ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsAdminView;
