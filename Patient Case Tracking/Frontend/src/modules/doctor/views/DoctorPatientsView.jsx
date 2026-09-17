import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  User,
  Activity,
  FileText,
  Calendar,
  Pill,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Phone,
  Droplet,
  MapPin,
  Clock,
  Heart,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  getDoctorPatients,
  getPatientClinicalProfile,
} from '../services/doctorDashboardService';

// Safe rendering helper to prevent React object child crashes
const renderClinicalValue = (value) => {
  if (value === null || value === undefined) return 'Not available';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None recorded';
    return (
      <div className="flex flex-wrap gap-1 mt-0.5">
        {value.map((item, idx) => (
          <span key={idx} className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
            {typeof item === 'object' ? (item.name || item.test_name || item.allergen || JSON.stringify(item)) : String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className="space-y-1 text-[11px] text-slate-600">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="flex items-start gap-1">
            <span className="font-semibold text-slate-700 capitalize">{k.replace(/_/g, ' ')}:</span>
            <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return String(value);
};

export const DoctorPatientsView = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTab, setProfileTab] = useState('overview');

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDoctorPatients(search);
      if (res?.patients) {
        setPatients(res.patients);
        setTotal(res.total || res.patients.length);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchPatients, 250);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  const handleOpenProfile = async (patientId) => {
    setSelectedPatientId(patientId);
    setProfileTab('overview');
    try {
      setProfileLoading(true);
      const data = await getPatientClinicalProfile(patientId);
      setProfileData(data);
    } catch (err) {
      alert(`Failed to load patient dossier: ${err.message}`);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Active Patient Directory & Health Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search patient records, view electronic health dossiers, vitals telemetry, and previous OPD clinical consultations.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ABHA, phone, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
          />
        </div>
      </div>

      {/* Patient Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading patient directory...</div>
      ) : patients.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No patients found matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {patients.map((p) => {
            const isHigh = p.riskStatus === 'High Priority';
            return (
              <div
                key={p.patientId || p.id}
                className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-md transition space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {p.name ? p.name[0] : 'P'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{p.name || 'Patient'}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">{p.patientId}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${p.abhaId ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-100 text-slate-500'}`}>
                            {p.abhaId ? `ABHA: ${p.abhaId}` : 'ABHA not linked'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800'
                          : p.riskStatus === 'Moderate'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.riskStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 p-2 bg-slate-50 rounded-xl text-center text-[11px] border border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Age / Gender</span>
                      <strong className="text-slate-700">
                        {p.age != null ? `${p.age}y` : 'Age not available'} • {p.gender ? (p.gender === 'MALE' ? 'Male' : p.gender === 'FEMALE' ? 'Female' : p.gender) : 'Not provided'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Blood Group</span>
                      <strong className="text-slate-700">{p.bloodGroup}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">OPD Type</span>
                      <strong className="text-slate-700">{p.opdType}</strong>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-700">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Latest Complaint</div>
                    <p className="line-clamp-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100/70">{p.latestComplaint}</p>
                  </div>

                  {/* Vitals summary preview */}
                  {p.vitals && (
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 bg-sky-50/50 p-2 rounded-lg border border-sky-100">
                      <span>BP: <strong>{p.vitals.bp}</strong></span>
                      <span>Pulse: <strong>{p.vitals.pulse}</strong></span>
                      <span>SpO2: <strong>{p.vitals.spo2}</strong></span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">Last visit: {p.lastVisit}</span>
                  <button
                    onClick={() => handleOpenProfile(p.patientId)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    <span>View Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Clinical Profile Dossier Modal */}
      {selectedPatientId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center text-sm font-bold">
                  {profileData?.patient?.name ? profileData.patient.name[0] : 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{profileData?.patient?.name || 'Patient Profile'}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
                      {profileData?.patient?.riskStatus || 'Moderate'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {profileData?.patient?.abhaId ? `ABHA: ${profileData.patient.abhaId}` : 'ABHA not linked'}
                    {profileData?.patient?.phone ? ` • ${profileData.patient.phone}` : ''}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatientId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-5 border-b border-slate-200 flex items-center gap-2 text-xs bg-white">
              {[
                { key: 'overview', label: 'Overview & Vitals' },
                { key: 'reports', label: `Lab Reports (${profileData?.documents?.length || 0})` },
                { key: 'consultations', label: `Consultations (${profileData?.sessions?.length || 0})` },
                { key: 'prescriptions', label: `Prescriptions (${profileData?.prescriptions?.length || 0})` },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setProfileTab(t.key)}
                  className={`py-3 px-2.5 font-semibold border-b-2 transition cursor-pointer ${
                    profileTab === t.key
                      ? 'border-slate-950 text-slate-950'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar text-xs">
              {profileLoading ? (
                <div className="py-12 text-center text-slate-400">Loading comprehensive dossier...</div>
              ) : profileTab === 'overview' ? (
                <div className="space-y-4">
                  {/* Demographics Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Age / Gender</span>
                      <strong className="text-slate-800">
                        {profileData?.patient?.age != null ? `${profileData.patient.age} yrs` : 'Age not available'} • {profileData?.patient?.gender ? (profileData.patient.gender === 'MALE' ? 'Male' : profileData.patient.gender === 'FEMALE' ? 'Female' : profileData.patient.gender) : 'Not provided'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Blood Group</span>
                      <strong className="text-slate-800">{profileData?.patient?.bloodGroup}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Contact Phone</span>
                      <strong className="text-slate-800">{profileData?.patient?.phone}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Residential Area</span>
                      <strong className="text-slate-800">{profileData?.patient?.address}</strong>
                    </div>
                  </div>

                  {/* Vitals History */}
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-sky-600" />
                      <span>Vitals Signs History</span>
                    </h4>
                    {profileData?.vitals?.length === 0 ? (
                      <p className="text-slate-400 py-3">No vitals logs recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {profileData?.vitals?.map((v) => (
                          <div key={v.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                            <span className="font-mono text-slate-500">{v.date}</span>
                            <div className="flex items-center gap-4 font-semibold text-slate-700">
                              <span>BP: {v.bp}</span>
                              <span>Pulse: {v.pulse}</span>
                              <span>SpO2: {v.spo2}</span>
                              <span>Temp: {v.temp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : profileTab === 'reports' ? (
                <div className="space-y-3">
                  {profileData?.documents?.length === 0 ? (
                    <p className="text-slate-400 py-6 text-center">No diagnostic reports uploaded yet.</p>
                  ) : (
                    profileData?.documents?.map((d) => {
                      const summaryObj = (typeof d.summary === 'object' && d.summary !== null) ? d.summary : (d.structuredSummary || null);
                      const summaryText = typeof d.summary === 'string' ? d.summary : (summaryObj?.physician_digest || summaryObj?.patient_overview || null);

                      return (
                        <div key={d.documentId} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{d.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                              {d.isVerified ? 'VERIFIED' : 'PENDING'}
                            </span>
                          </div>

                          {/* Primary text summary */}
                          {summaryText && (
                            <p className="text-slate-600 leading-relaxed text-xs">{summaryText}</p>
                          )}

                          {/* Structured clinical summary breakdown */}
                          {summaryObj && (
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                              {summaryObj.patient_overview && (
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Patient Overview</span>
                                  <div className="text-slate-700">{renderClinicalValue(summaryObj.patient_overview)}</div>
                                </div>
                              )}

                              {(summaryObj.doctor || summaryObj.facility) && (
                                <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                                  {summaryObj.doctor && <span><strong>Doctor:</strong> {renderClinicalValue(summaryObj.doctor)}</span>}
                                  {summaryObj.facility && <span><strong>Facility:</strong> {renderClinicalValue(summaryObj.facility)}</span>}
                                </div>
                              )}

                              {summaryObj.chief_complaints && (
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Chief Complaints</span>
                                  {renderClinicalValue(summaryObj.chief_complaints)}
                                </div>
                              )}

                              {summaryObj.current_medications && (
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Current Medications</span>
                                  {renderClinicalValue(summaryObj.current_medications)}
                                </div>
                              )}

                              {summaryObj.important_findings && (
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Important Findings</span>
                                  {renderClinicalValue(summaryObj.important_findings)}
                                </div>
                              )}

                              {(summaryObj.investigations_count != null || summaryObj.abnormal_count != null) && (
                                <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-[11px] flex-wrap">
                                  {summaryObj.investigations_count != null && (
                                    <span className="text-slate-600">Investigations: <strong>{renderClinicalValue(summaryObj.investigations_count)}</strong></span>
                                  )}
                                  {summaryObj.abnormal_count != null && (
                                    <span className="text-amber-700 font-semibold">Abnormal Parameters: {renderClinicalValue(summaryObj.abnormal_count)}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                            <span>Date: {d.date}</span>
                            {d.url && (
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                              >
                                View File ↗
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : profileTab === 'consultations' ? (
                <div className="space-y-3">
                  {profileData?.sessions?.map((s) => (
                    <div key={s.sessionId} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{s.chiefComplaint}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                          {s.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Encounter Date: {s.date} • {s.opdType} OPD</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData?.prescriptions?.length === 0 ? (
                    <p className="text-slate-400 py-6 text-center">No prescriptions recorded.</p>
                  ) : (
                    profileData?.prescriptions?.map((rx, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900">{rx.medicine_name}</strong>
                          <div className="text-[11px] text-slate-500">{rx.dosage} • {rx.frequency} • {rx.duration}</div>
                        </div>
                        <span className="text-[11px] text-slate-600">{rx.instructions}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-[11px] text-slate-500">Sehat Electronic Medical Record (EMR)</span>
              <button
                onClick={() => {
                  setSelectedPatientId(null);
                  navigate('/doctor/opd');
                }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs transition cursor-pointer"
              >
                Go to Live OPD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientsView;
