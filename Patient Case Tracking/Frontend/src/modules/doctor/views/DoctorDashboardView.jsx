import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  FileText,
  ArrowRight,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { TriageBadge } from '../components/TriageBadge';

/**
 * DoctorDashboardView Component
 * Streamlined physician dashboard view with Untitled UI / Lucide vector icons (no emojis).
 */
export const DoctorDashboardView = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Demo active OPD cases
  const [cases] = useState([
    {
      sessionId: 'DEMO_GUJARATI_001',
      token: 'TK-101',
      patientName: 'Ramesh Patel',
      age: 48,
      gender: 'Male',
      language: 'Gujarati (ગુજરાતી)',
      chiefComplaint: 'Right knee joint pain with morning stiffness for 3 weeks',
      triageLevel: 'NORMAL',
      status: 'PENDING_REVIEW',
      checkinTime: '10:15 AM',
      docsCount: 2,
    },
    {
      sessionId: 'DEMO_HINDI_002',
      token: 'TK-102',
      patientName: 'Sunita Sharma',
      age: 56,
      gender: 'Female',
      language: 'Hindi (हिंदी)',
      chiefComplaint: 'Acute chest tightness, shortness of breath on climbing stairs',
      triageLevel: 'RED_FLAG',
      status: 'PENDING_REVIEW',
      checkinTime: '10:22 AM',
      docsCount: 1,
    },
    {
      sessionId: 'DEMO_ENG_003',
      token: 'TK-103',
      patientName: 'Anand Verma',
      age: 34,
      gender: 'Male',
      language: 'English',
      chiefComplaint: 'Chronic acidity, disturbed sleep, post-meal bloating',
      triageLevel: 'NORMAL',
      status: 'APPROVED',
      checkinTime: '09:50 AM',
      docsCount: 0,
    },
    {
      sessionId: 'DEMO_MARATHI_004',
      token: 'TK-104',
      patientName: 'Pooja Kulkarni',
      age: 41,
      gender: 'Female',
      language: 'Marathi (मराठी)',
      chiefComplaint: 'Migraine episodes with nausea, photosensitivity',
      triageLevel: 'MEDIUM',
      status: 'PENDING_REVIEW',
      checkinTime: '10:35 AM',
      docsCount: 1,
    },
  ]);

  const filteredCases = cases.filter((item) => {
    if (filter === 'PENDING' && item.status !== 'PENDING_REVIEW') return false;
    if (filter === 'RED_FLAG' && item.triageLevel !== 'RED_FLAG') return false;
    if (filter === 'APPROVED' && item.status !== 'APPROVED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.patientName.toLowerCase().includes(q) ||
        item.token.toLowerCase().includes(q) ||
        item.chiefComplaint.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const redFlagCount = cases.filter((c) => c.triageLevel === 'RED_FLAG').length;
  const pendingCount = cases.filter((c) => c.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6">
      {/* 1. Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Today */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
            <span>Total OPD Intake</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-normal text-slate-900">28 Patients</span>
            <span className="text-xs text-slate-400 font-normal">Today</span>
          </div>
        </div>

        {/* In Queue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
            <span>Awaiting Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-normal text-slate-900">{pendingCount} Active</span>
            <span className="text-xs text-amber-600 font-medium">In Lounge</span>
          </div>
        </div>

        {/* Priority Triage */}
        <div
          className={`p-5 rounded-2xl border shadow-xs transition ${
            redFlagCount > 0
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wider font-medium mb-1 opacity-70">
            <span>Emergency Triage</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-normal">
              {redFlagCount > 0 ? `${redFlagCount} Red-Flag` : '0 Alerts'}
            </span>
            <span className="text-xs opacity-75">Immediate Attention</span>
          </div>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-normal text-slate-900">24 Discharged</span>
            <span className="text-xs text-emerald-600 font-medium">Verified</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'ALL', label: 'All Cases' },
            { id: 'PENDING', label: `Pending Review (${pendingCount})` },
            { id: 'RED_FLAG', label: `Triage Alerts (${redFlagCount})`, icon: AlertTriangle },
            { id: 'APPROVED', label: 'Completed' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-normal transition cursor-pointer ${
                  filter === tab.id
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, token, complaint..."
            className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-white text-slate-900 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* 3. Live Patient Queue Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-900">Live OPD Queue</h2>
            <p className="text-xs text-slate-400 font-normal">
              Showing patients waiting for consultation in Room 104
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Queue</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-normal text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[11px] text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-3.5">Token</th>
                <th className="px-6 py-3.5">Patient Details</th>
                <th className="px-6 py-3.5">Language</th>
                <th className="px-6 py-3.5">AI Chief Complaint</th>
                <th className="px-6 py-3.5">Reports</th>
                <th className="px-6 py-3.5">Triage</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((patient) => (
                <tr
                  key={patient.sessionId}
                  className="hover:bg-slate-50/70 transition cursor-pointer"
                  onClick={() => navigate(`/doctor/cases/${patient.sessionId}`)}
                >
                  {/* Token */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-slate-950 font-normal block">
                      {patient.token}
                    </span>
                    <span className="text-[10px] text-slate-400">{patient.checkinTime}</span>
                  </td>

                  {/* Patient Name & Demographics */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-normal text-slate-900">{patient.patientName}</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      {patient.age} yrs • {patient.gender}
                    </div>
                  </td>

                  {/* Language */}
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-normal">
                    {patient.language}
                  </td>

                  {/* Chief Complaint */}
                  <td className="px-6 py-4 max-w-xs truncate text-slate-800 font-normal">
                    {patient.chiefComplaint}
                  </td>

                  {/* Reports Attached */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.docsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-normal bg-slate-100 text-slate-700">
                        <FileText className="w-3 h-3" />
                        <span>{patient.docsCount} file(s)</span>
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[10px]">—</span>
                    )}
                  </td>

                  {/* Triage Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TriageBadge level={patient.triageLevel} status={patient.status} />
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/cases/${patient.sessionId}`);
                      }}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-normal text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-2xs"
                    >
                      <span>Examine</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardView;
