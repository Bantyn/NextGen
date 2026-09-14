import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  FileText,
  Stethoscope,
  Pill,
  Clock,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Search,
  ChevronRight,
  ExternalLink,
  QrCode,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Copy,
  Check,
  X,
  Share2,
  Printer,
  Sparkles,
  Layers,
  ArrowUpRight,
  Hospital,
  AlertCircle,
  FlaskConical,
  RefreshCw,
  Loader2,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import {
  fetchRegisteredPatients,
  fetchPatientDashboardBundle,
  uploadPatientMedicalDocument,
} from '../services/patientDashboardService';
import { INITIAL_EMPTY_PATIENT } from '../../../data/patientDashboardData';
import {
  Skeleton,
  SkeletonStats,
  SkeletonTable,
  SkeletonPatientProfile,
  SkeletonCard,
} from '../../../components/ui';

export const PatientDashboardView = () => {
  const { user, loginAsPatient } = useAuth();

  // 1. State for selected patient profile (synced with real backend data & auth user)
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(
    () => sessionStorage.getItem('selected_patient_id') || user?.patient_id || user?.id || 'PAT-146A5F03'
  );
  const [patient, setPatient] = useState(INITIAL_EMPTY_PATIENT);
  const [loadingPatient, setLoadingPatient] = useState(true);

  // Load real registered patients from MongoDB Atlas
  React.useEffect(() => {
    let isMounted = true;
    fetchRegisteredPatients().then((list) => {
      if (isMounted && list && list.length > 0) {
        setPatientsList(list);
        const storedId = sessionStorage.getItem('selected_patient_id');
        if (storedId && list.some((p) => p.id === storedId)) {
          setSelectedPatientId(storedId);
        } else if (!user?.patient_id && !user?.id) {
          setSelectedPatientId(list[0].id);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load full clinical bundle (prescriptions, doctor notes, reports, token status) from Atlas
  React.useEffect(() => {
    let isMounted = true;
    setLoadingPatient(true);
    fetchPatientDashboardBundle(selectedPatientId)
      .then((bundle) => {
        if (isMounted && bundle) {
          setPatient(bundle);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingPatient(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedPatientId]);


  // 2. Active Tab State: 'overview' | 'reports' | 'doctors' | 'prescriptions' | 'history' | 'vitals'
  const [activeTab, setActiveTab] = useState('overview');

  // 3. Search & Filter states
  const [reportSearch, setReportSearch] = useState('');
  const [reportCategory, setReportCategory] = useState('ALL');

  // 4. Modals State
  const [selectedReport, setSelectedReport] = useState(null);
  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copiedAbha, setCopiedAbha] = useState(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState(false);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    docType: 'Diagnostic Lab Report',
    testName: '',
    date: new Date().toISOString().split('T')[0],
    file: null,
  });

  // Theme-compliant Skeleton Loading State based on Planner/Theme.md
  if (loadingPatient || !patient) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Skeleton Top Banner / Patient Profile */}
        <SkeletonPatientProfile />

        {/* Skeleton Live OPD Status Card */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="w-48 h-5" />
            <Skeleton variant="text" className="w-24 h-6 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="text" className="h-12 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Skeleton Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="w-32 h-10 rounded-xl" />
          ))}
        </div>

        {/* Skeleton Vitals & Prescriptions Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonTable rows={5} />
          </div>
          <div className="space-y-6">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      </div>
    );
  }

  // Defensive safe wrapper for patient contracts
  const safePatient = patient || INITIAL_EMPTY_PATIENT;
  const patientReports = Array.isArray(safePatient?.reports) ? safePatient.reports : [];
  const patientPrescriptions = Array.isArray(safePatient?.prescriptions) ? safePatient.prescriptions : [];
  const patientConsultedDoctors = Array.isArray(safePatient?.consultedDoctors) ? safePatient.consultedDoctors : [];
  const patientAllergies = Array.isArray(safePatient?.allergies) ? safePatient.allergies : [];
  const patientChronicConditions = Array.isArray(safePatient?.chronicConditions) ? safePatient.chronicConditions : [];
  const patientTimeline = Array.isArray(safePatient?.timeline) ? safePatient.timeline : [];
  const patientVitalsHistory = Array.isArray(safePatient?.vitalsHistory) ? safePatient.vitalsHistory : [];
  const patientVitals = safePatient?.vitals || INITIAL_EMPTY_PATIENT.vitals;
  const currentToken = safePatient?.currentToken || INITIAL_EMPTY_PATIENT.currentToken;

  // Copy ABHA Handler
  const handleCopyAbha = () => {
    if (safePatient?.abhaId) {
      navigator.clipboard?.writeText(safePatient.abhaId);
      setCopiedAbha(true);
      setTimeout(() => setCopiedAbha(false), 2000);
    }
  };

  // Medical Document Upload Handlers
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setUploadError(null);
    if (selectedFile.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds the 20MB limit. Please select a smaller document.');
      return;
    }
    setUploadForm((prev) => ({
      ...prev,
      file: selectedFile,
      testName: prev.testName || selectedFile.name.replace(/\.[^/.]+$/, ''),
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setUploadForm((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = async () => {
    if (!uploadForm.file) {
      setUploadError('Please select or drag a medical document file (PDF, PNG, JPG, WebP).');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const patientId = safePatient.id || safePatient.patient_id;
      const res = await uploadPatientMedicalDocument(patientId, {
        file: uploadForm.file,
        docType: uploadForm.docType,
        testName: uploadForm.testName.trim() || uploadForm.file.name,
        sessionId: safePatient.sessionId,
      });

      // Optimistically prepend newly uploaded report into patient.reports
      if (res?.report) {
        setPatient((prev) => ({
          ...prev,
          reports: [res.report, ...(Array.isArray(prev?.reports) ? prev.reports : [])],
        }));
      }

      // Close modal and reset form
      setShowUploadModal(false);
      setUploadForm({
        docType: 'Diagnostic Lab Report',
        testName: '',
        date: new Date().toISOString().split('T')[0],
        file: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Switch to reports tab to immediately display the document
      setActiveTab('reports');

      // Trigger success toast
      setUploadSuccessToast(true);
      setTimeout(() => setUploadSuccessToast(false), 4000);
    } catch (err) {
      console.error('[PatientDashboardView] Upload error:', err);
      setUploadError(err.message || 'Failed to upload document. Please check server connection.');
    } finally {
      setIsUploading(false);
    }
  };

  // Filtered reports with safe fallback (Never null)
  const filteredReports = patientReports.filter((rep) => {
    if (!rep) return false;
    const cat = rep.category || '';
    const matchesCategory =
      reportCategory === 'ALL' ||
      (reportCategory === 'RADIOLOGY' && cat.includes('Radiology')) ||
      (reportCategory === 'BIOCHEM' && cat.includes('Biochemistry')) ||
      (reportCategory === 'HEMATOLOGY' && cat.includes('Hematology')) ||
      (reportCategory === 'CARDIOLOGY' && cat.includes('Cardiology'));

    const searchLower = reportSearch.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      (rep.title && rep.title.toLowerCase().includes(searchLower)) ||
      (rep.orderedBy && rep.orderedBy.toLowerCase().includes(searchLower)) ||
      (rep.facility && rep.facility.toLowerCase().includes(searchLower));

    return matchesCategory && matchesSearch;
  });

  // OPD Journey Steps definition
  const journeySteps = [
    { key: 'CHECKED_IN', label: 'Checked In', desc: 'Kiosk registration' },
    { key: 'VITALS_TAKEN', label: 'Vitals Recorded', desc: 'Nurse triage desk' },
    { key: 'IN_CONSULTATION', label: 'In Consultation', desc: 'Doctor OPD room' },
    { key: 'LAB_PENDING', label: 'Diagnostic Tests', desc: 'Lab investigations' },
    { key: 'COMPLETED', label: 'Consultation Complete', desc: 'Rx & Discharge' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'CHECKED_IN': return 0;
      case 'VITALS_TAKEN': return 1;
      case 'IN_CONSULTATION': return 2;
      case 'LAB_PENDING': return 3;
      case 'COMPLETED': return 4;
      default: return 2;
    }
  };

  const currentStepIdx = getStepIndex(currentToken?.status || 'CHECKED_IN');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* =========================================================================
          TOP BANNER: PATIENT IDENTITY CARD & QUICK ACTIONS
          ========================================================================= */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Patient Bio & Avatar */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-semibold text-2xl shadow-md ring-4 ring-white">
                {(safePatient.name || 'Patient').split(' ').filter(Boolean).map((n) => n[0]).join('') || 'P'}
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white ring-2 ring-white" title="ABDM Verified Patient">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-950 tracking-tight">
                  {safePatient.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                  {safePatient.gender}, {safePatient.age} yrs
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Blood Group: {safePatient.bloodGroup}
                </span>
              </div>

              {/* ABHA ID with Copy Action */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-slate-500">ABHA:</span>
                  <span className="font-mono font-medium text-slate-900">{safePatient.abhaId}</span>
                  <button
                    onClick={handleCopyAbha}
                    className="ml-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title="Copy ABHA Number"
                  >
                    {copiedAbha ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{(safePatient.address || 'Ahmedabad, Gujarat').split(',')[1]?.trim() || 'Ahmedabad'}, Gujarat</span>
                </div>

                <div className="hidden md:inline-flex items-center gap-1 text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{safePatient.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Patient Switcher (Populated from MongoDB Atlas) */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-400 px-2 uppercase tracking-wider">Patient:</span>
              <select
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  const p = (patientsList.length > 0 ? patientsList : [{ id: selectedPatientId, name: safePatient.name }]).find((item) => item.id === e.target.value);
                  if (p && user?.role === 'PATIENT') {
                    loginAsPatient(p);
                  }
                }}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
              >
                {(patientsList.length > 0 ? patientsList : [{ id: selectedPatientId, name: safePatient.name }]).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAbhaModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-600" />
              <span>Digital ABHA Card</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          LIVE OPD JOURNEY & QUEUE STATUS TRACKER
          ========================================================================= */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-700 text-xs font-mono font-bold tracking-wide">
              TOKEN {currentToken.token}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Live OPD Journey & Consultation Status
              </h2>
              <p className="text-xs text-slate-500">
                {currentToken.department} • {currentToken.room}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{currentToken.statusLabel}</span>
            </div>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 font-medium">
              Doctor: <strong className="text-slate-900">{currentToken.doctor}</strong>
            </span>
          </div>
        </div>

        {/* 5-Step Horizontal Flow Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {journeySteps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50/80 border-emerald-200/70'
                    : 'bg-white border-slate-200/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isCurrent
                        ? 'bg-sky-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Current
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] font-medium text-emerald-700">Done</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          NAVIGATION TABS
          ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80">
        {[
          { id: 'overview', label: 'Overview', icon: HeartPulse },
          {
            id: 'reports',
            label: 'Diagnostic Reports',
            icon: FlaskConical,
            count: patientReports.length,
          },
          {
            id: 'doctors',
            label: 'Consulted Doctors',
            icon: Stethoscope,
            count: patientConsultedDoctors.length,
          },
          {
            id: 'prescriptions',
            label: 'Prescriptions (Rx)',
            icon: Pill,
            count: patientPrescriptions.length,
          },
          { id: 'history', label: 'Medical History', icon: Clock },
          { id: 'vitals', label: 'Vitals & Metrics', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB CONTENT 1: OVERVIEW
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 1. Quick Vitals Summary Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Blood Pressure</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-slate-900 font-mono">
                {patientVitals.bp || '120/80'}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                {patientVitals.bpStatus || 'Normal Range'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Heart Rate (Pulse)</span>
                <Activity className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-slate-900 font-mono">
                {patientVitals.pulse || '74'} bpm
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Regular Sinus Rhythm
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Blood Glucose</span>
                <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {patientVitals.sugarType || 'Fasting / Random'}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-slate-900 font-mono">
                {patientVitals.sugar || '98'} mg/dL
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                {patientVitals.sugarStatus || 'Normal Glycemic Control'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>SpO2 / Temp</span>
                <span className="text-[10px] text-sky-600 font-medium">Recorded Today</span>
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-slate-900 font-mono">
                {patientVitals.spo2 || '99%'} <span className="text-xs text-slate-400 font-normal">/ {patientVitals.temp || '98.4'}°F</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                BMI: {patientVitals.bmi || '24.1'} ({patientVitals.bmiStatus || 'Healthy'})
              </div>
            </div>
          </div>

          {/* 2. Dual Column: Current Consulted Doctor Spotlight + Active Prescriptions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Consulted Doctor Spotlight & OPD Advice */}
            <div className="lg:col-span-2 space-y-6">
              {/* Primary Active Doctor Card */}
              {patientConsultedDoctors[0] ? (
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs uppercase tracking-wider font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                      Primary Consulted Physician
                    </span>
                    <button
                      onClick={() => setActiveTab('doctors')}
                      className="text-xs font-medium text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>All Consultations</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <img
                      src={patientConsultedDoctors[0].avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
                      alt={patientConsultedDoctors[0].name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-950">
                          {patientConsultedDoctors[0].name}
                        </h3>
                        <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs font-medium text-sky-700">
                        {patientConsultedDoctors[0].specialty}
                      </p>
                      <p className="text-xs text-slate-500">
                        {patientConsultedDoctors[0].degrees || 'MBBS'} • {patientConsultedDoctors[0].department || 'General Medicine'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Chief Complaint:</span>
                      <span className="font-semibold text-slate-900">
                        {patientConsultedDoctors[0].chiefComplaint || 'Primary Clinical Inquiry'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Confirmed Diagnosis:</span>
                      <span className="font-semibold text-sky-800 bg-sky-100/60 px-2 py-0.5 rounded">
                        {patientConsultedDoctors[0].diagnosis || 'Under Active Clinical Observation'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pt-1 leading-relaxed border-t border-slate-200/60 mt-2">
                      <strong className="text-slate-800">Doctor's Clinical Notes:</strong>{' '}
                      {patientConsultedDoctors[0].clinicalNotes || patientConsultedDoctors[0].notes || 'Follow medical advice, continue prescribed medications, and track symptoms.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Next Recommended Follow-up: <strong className="text-slate-900">{patientConsultedDoctors[0].followUp || 'In 2 weeks'}</strong>
                    </span>
                    <button
                      onClick={() => setActiveTab('prescriptions')}
                      className="inline-flex items-center gap-1 text-slate-900 font-medium hover:underline cursor-pointer"
                    >
                      <span>View Prescribed Meds</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      Primary Consulted Physician
                    </span>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-2">
                    <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
                    <h4 className="text-sm font-semibold text-slate-800">Awaiting Physician Consultation</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Doctor consultation details and clinical examination notes will automatically sync here once your OPD encounter begins.
                    </p>
                  </div>
                </div>
              )}

              {/* Recent Diagnostic Reports Highlight */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      Recent Diagnostic Reports & Imaging
                    </h3>
                    <p className="text-xs text-slate-500">
                      Digitized and synced with Ayushman Bharat Digital Mission (ABDM)
                    </p>
                  </div>
                  {patientReports.length > 0 && (
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="text-xs font-medium text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({patientReports.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {patientReports.length > 0 ? (
                    patientReports.slice(0, 3).map((rep) => (
                      <div
                        key={rep.id}
                        onClick={() => setSelectedReport(rep)}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-2xs group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-sky-700 transition">
                              {rep.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>{rep.category || 'Clinical'}</span>
                              <span>•</span>
                              <span>{rep.date || 'Recent'}</span>
                              <span>•</span>
                              <span>Ordered by {rep.orderedBy || 'Attending Doctor'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {rep.statusSeverity === 'attention' ? (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Attention</span>
                            </span>
                          ) : (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Normal</span>
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Not Uploaded</span>
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Diagnostic investigations and test reports have not been uploaded yet for this patient.
                      </p>
                      <div>
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Physical Report</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Active Medications, Allergies & Quick Alerts */}
            <div className="space-y-6">
              {/* Active Prescriptions Snapshot */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-semibold text-slate-950">Active Medications</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('prescriptions')}
                    className="text-xs font-medium text-sky-700 hover:underline cursor-pointer"
                  >
                    View Schedule
                  </button>
                </div>

                <div className="space-y-3">
                  {((patientPrescriptions[0]?.medications || patientPrescriptions[0]?.medicines) && (patientPrescriptions[0].medications || patientPrescriptions[0].medicines).length > 0) ? (
                    (patientPrescriptions[0].medications || patientPrescriptions[0].medicines).map((med, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-900">{med.name}</span>
                          <span className="text-[10px] font-mono bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">
                            {med.schedule || '1 - 0 - 1'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {med.timing || 'Daily'} • {med.duration || 'As directed'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-center space-y-1.5">
                      <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Not Uploaded
                      </span>
                      <p className="text-xs text-slate-500">No active medication orders issued for this encounter yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Allergy Alert Card */}
              <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Allergy & Contraindications</h4>
                </div>
                <div className="space-y-2">
                  {patientAllergies.length > 0 ? (
                    patientAllergies.map((all, idx) => (
                      <div key={idx} className="text-xs bg-white/80 p-2.5 rounded-xl border border-rose-100">
                        <div className="font-semibold text-slate-900">{all.allergen}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">Reaction: {all.reaction} ({all.severity})</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 bg-white/80 p-2.5 rounded-xl border border-rose-100">
                      No known adverse allergies or contraindications recorded.
                    </div>
                  )}
                </div>
              </div>

              {/* Chronic Conditions */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-semibold">Diagnosed Conditions</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {patientChronicConditions.length > 0 ? (
                    patientChronicConditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {cond.name} <span className="text-slate-400">({cond.diagnosedYear || 'Recorded'})</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No chronic medical conditions recorded.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 2: DIAGNOSTIC REPORTS & LABS
          ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search tests, doctor, lab..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {[
                { id: 'ALL', label: 'All Reports' },
                { id: 'RADIOLOGY', label: 'X-Ray & Imaging' },
                { id: 'BIOCHEM', label: 'Biochemistry' },
                { id: 'HEMATOLOGY', label: 'Blood (CBC)' },
                { id: 'CARDIOLOGY', label: 'Cardiology' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setReportCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                    reportCategory === cat.id
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Grid */}
          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            {report.testCode || 'INV-001'}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-950 leading-snug">
                            {report.title}
                          </h3>
                        </div>
                      </div>

                      {report.statusSeverity === 'attention' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full shrink-0">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Attention</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Normal</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-3 leading-relaxed">
                      {report.summary}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">Date:</span> {report.date}
                      </div>
                      <div>
                        <span className="text-slate-400">Lab:</span> {(report.facility || 'Apex Lab').split(' ')[0]}
                      </div>
                      <div>
                        <span className="text-slate-400">Doctor:</span> {report.orderedBy}
                      </div>
                      <div>
                        <span className="text-slate-400">File size:</span> {report.fileSize || '1.2 MB'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>View Test Parameters</span>
                    </button>
                    <button
                      onClick={() => {
                        if (report.fileUrl) {
                          window.open(report.fileUrl, '_blank');
                        } else {
                          alert(`Simulated Download: ${report.title}.pdf`);
                        }
                      }}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950 transition cursor-pointer"
                      title="Download or View Document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-slate-200/90 text-slate-500 space-y-4 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Not Uploaded</span>
                </div>
                <h4 className="text-base font-semibold text-slate-900">
                  No Diagnostic Reports Uploaded Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Diagnostic lab reports, blood panels, and radiology investigations have not been uploaded for this patient. You can upload physical or digital reports to sync with ABDM.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Physical Document / Report</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 3: CONSULTED DOCTORS & CLINICAL VISITS
          ========================================================================= */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Consulted Physicians & Clinical Encounters
              </h2>
              <p className="text-xs text-slate-500">
                Complete record of doctors who treated you across OPD and inpatient services
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {patientConsultedDoctors.length} Registered Consultations
            </span>
          </div>

          {patientConsultedDoctors.length > 0 ? (
            <div className="space-y-4">
              {patientConsultedDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start sm:items-center gap-4">
                      <img
                        src={doc.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
                        alt={doc.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-950">{doc.name}</h3>
                          {doc.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                              Current OPD Visit
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-sky-700">{doc.specialty}</p>
                        <p className="text-xs text-slate-500">
                          {doc.degrees || 'MBBS, MD'} • {doc.department || 'General Medicine'}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right space-y-1">
                      <span className="inline-block text-xs font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                        {doc.room || 'OPD Room 102'}
                      </span>
                      <div className="text-xs text-slate-500">{doc.lastVisit || 'Recent Visit'}</div>
                    </div>
                  </div>

                  {/* Consultation Clinical Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                      <span className="text-slate-500 font-medium">Chief Symptom / Complaint:</span>
                      <p className="text-slate-900 font-medium">{doc.chiefComplaint || 'Clinical evaluation'}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200/70 space-y-1">
                      <span className="text-sky-700 font-medium">Clinical Diagnosis:</span>
                      <p className="text-sky-950 font-semibold">{doc.diagnosis || 'Under Observation'}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200/60 text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Doctor's Assessment & Treatment Advice:</strong>{' '}
                    {doc.clinicalNotes || doc.notes || 'Continue prescribed therapy and monitor symptoms.'}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Follow-up: <strong className="text-slate-900">{doc.followUp || 'In 2 weeks'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('prescriptions')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                      >
                        <Pill className="w-3.5 h-3.5 text-sky-600" />
                        <span>View Prescribed Rx</span>
                      </button>
                      <button
                        onClick={() => alert(`Appointment request queued for ${doc.name}`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-white transition cursor-pointer shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Next Slot</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-slate-200/90 text-slate-500 space-y-3 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  <span>No Consultations</span>
                </div>
                <h4 className="text-base font-semibold text-slate-900">
                  No Consultation Encounters Recorded Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your doctor consultations and clinical examination encounters will appear here once an attending physician begins your review.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 4: PRESCRIPTIONS & MEDICATIONS (Rx)
          ========================================================================= */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Active Prescriptions & Pharmacy Orders</h2>
              <p className="text-xs text-slate-500">
                Medication schedule, dosage directions, and refill authorizations
              </p>
            </div>
            <button
              onClick={() => alert('Simulated: Full Rx PDF generated')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Prescription</span>
            </button>
          </div>

          {patientPrescriptions.length > 0 ? (
            <div className="space-y-6">
              {patientPrescriptions.map((rx) => {
                const meds = rx.medications || rx.medicines || [];
                return (
                  <div
                    key={rx.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {rx.id}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Prescribed by {rx.doctor}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rx.specialty} • Issued on {rx.date} (Valid till {rx.validTill})
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{rx.status}</span>
                      </span>
                    </div>

                    <div className="space-y-3">
                      {meds.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-500" />
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-950">
                                {med.name}
                              </h4>
                              <span className="text-xs text-slate-500 font-mono">({med.dosage})</span>
                            </div>
                            <p className="text-xs text-slate-600 pl-4">{med.instructions}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 pl-4">
                              <span>Timing: <strong>{med.timing}</strong></span>
                              <span>•</span>
                              <span>Duration: <strong>{med.duration}</strong></span>
                            </div>
                          </div>

                          <div className="text-left sm:text-right pl-4 sm:pl-0 space-y-1">
                            <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white border border-slate-200 text-slate-900">
                              {med.schedule || '1 - 0 - 1'}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium">
                              {med.refill || 'Authorized'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-slate-200/90 text-slate-500 space-y-3 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <Pill className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Not Uploaded</span>
                </div>
                <h4 className="text-base font-semibold text-slate-900">
                  No Prescriptions Uploaded or Issued Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No active physician prescriptions have been uploaded or finalized for this patient record yet.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 5: MEDICAL HISTORY & TIMELINE
          ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Chronic Conditions & Allergies Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Chronic Medical Conditions</span>
              </h3>
              <div className="space-y-2">
                {patientChronicConditions.length > 0 ? (
                  patientChronicConditions.map((cond, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{cond.name}</div>
                        <div className="text-[11px] text-slate-500">Diagnosed: {cond.diagnosedYear || 'Recorded in EMR'}</div>
                      </div>
                      <span className="text-[11px] font-medium bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                        {cond.status || 'Active'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-2xl">
                    No chronic conditions recorded for this patient.
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Known Allergies & Adverse Reactions</span>
              </h3>
              <div className="space-y-2">
                {patientAllergies.length > 0 ? (
                  patientAllergies.map((all, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200/70 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-rose-950">{all.allergen}</div>
                        <div className="text-[11px] text-slate-600">{all.reaction}</div>
                      </div>
                      <span className="text-[11px] font-semibold bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                        {all.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-2xl">
                    No drug or food allergies on record.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Chronological Health Timeline */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-slate-950">
              Lifelong Health Event Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Chronological log of clinical visits, diagnostic reports, and medical milestones
            </p>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pt-2">
              {patientTimeline.length > 0 ? (
                patientTimeline.map((item) => (
                  <div key={item.id} className="relative space-y-1">
                    <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-white" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">{item.date}</span>
                      <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-sky-700 font-medium">{item.department}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600">{item.description}</p>
                    <p className="text-[11px] text-slate-400">Attending: {item.doctor}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4">
                  No previous health event milestones recorded in the timeline.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT 6: VITALS & HEALTH METRICS TRACKER
          ========================================================================= */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Vitals & Biometric Trend Log</h2>
              <p className="text-xs text-slate-500">
                Recorded during check-ins and clinical appointments
              </p>
            </div>
            <span className="text-xs text-slate-500">
              Last synced: <strong className="text-slate-800">{patientVitals.lastUpdated || 'Today'}</strong>
            </span>
          </div>

          {/* Detailed Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-slate-500">Blood Pressure</span>
              <div className="text-3xl font-bold font-mono text-slate-950">{patientVitals.bp || '120/80'}</div>
              <div className="text-xs text-emerald-700 font-medium">Status: {patientVitals.bpStatus || 'Normal'}</div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Target reference range: 110-125 / 70-85 mmHg
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-slate-500">Random Blood Sugar</span>
              <div className="text-3xl font-bold font-mono text-slate-950">{patientVitals.sugar || '98'}</div>
              <div className="text-xs text-emerald-700 font-medium">Status: {patientVitals.sugarStatus || 'Normal'}</div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Target reference range: 70 - 140 mg/dL
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-slate-500">Body Mass Index (BMI)</span>
              <div className="text-3xl font-bold font-mono text-slate-950">{patientVitals.bmi || '24.1'}</div>
              <div className="text-xs text-sky-700 font-medium">{patientVitals.weight || '68 kg'} / {patientVitals.height || '168 cm'}</div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Normal BMI threshold: 18.5 - 24.9 kg/m²
              </p>
            </div>
          </div>

          {/* Historical Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Historical Check-In Vitals</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">BP (Systolic/Diastolic)</th>
                    <th className="py-2.5 px-3">Pulse (bpm)</th>
                    <th className="py-2.5 px-3">Blood Sugar (mg/dL)</th>
                    <th className="py-2.5 px-3">Weight (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {patientVitalsHistory.length > 0 ? (
                    patientVitalsHistory.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-sans font-medium text-slate-900">{row.date}</td>
                        <td className="py-3 px-3 text-slate-700">{row.bpSys} / {row.bpDia} mmHg</td>
                        <td className="py-3 px-3 text-slate-700">{row.pulse}</td>
                        <td className="py-3 px-3 text-slate-700">{row.sugar}</td>
                        <td className="py-3 px-3 text-slate-700">{row.weight} kg</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 px-3 text-center text-slate-400 font-sans">
                        No previous historical vitals recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: REPORT VIEWER (TEST PARAMETERS & REFERENCE RANGES)
          ========================================================================= */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-bold">
                    {selectedReport.testCode}
                  </span>
                  <span className="text-xs text-slate-500">{selectedReport.category}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-950">
                  {selectedReport.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Conducted at {selectedReport.facility} • {selectedReport.date} at {selectedReport.time}
                </p>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clinical Summary Note */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
              <span className="font-semibold text-slate-900">Pathologist / Radiologist Impression:</span>
              <p className="text-slate-600 leading-relaxed">{selectedReport.summary}</p>
            </div>

            {/* Test Parameters Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Detailed Test Observations
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="p-3">Parameter</th>
                      <th className="p-3">Observed Value</th>
                      <th className="p-3">Reference Interval</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {((selectedReport.parameters || selectedReport.values || []).length > 0) ? (
                      (selectedReport.parameters || selectedReport.values).map((param, idx) => (
                        <tr key={idx} className={param.alert ? 'bg-amber-50/40' : ''}>
                          <td className="p-3 font-medium text-slate-900">{param.name || param.param || 'Parameter'}</td>
                          <td className="p-3 font-mono font-semibold text-slate-900">{param.value || param.result || 'Recorded'}</td>
                          <td className="p-3 font-mono text-slate-500">{param.normalRange || 'Standard'}</td>
                          <td className="p-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                param.alert
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {param.status || 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          Detailed parameter breakdown not uploaded for this document.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sign-off & Download Action */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-500">
                Sign-off: <strong className="text-slate-800">{selectedReport.labTechnician || 'Diagnostic Laboratory'}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedReport.fileUrl) {
                      window.open(selectedReport.fileUrl, '_blank');
                    } else {
                      alert(`Downloaded: ${selectedReport.title}.pdf`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-white transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / View Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: OFFICIAL DIGITAL ABHA CARD PREVIEW
          ========================================================================= */}
      {showAbhaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-6 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-semibold text-slate-900">
                  Ayushman Bharat Digital Account (ABHA)
                </span>
              </div>
              <button
                onClick={() => setShowAbhaModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Smart Digital Health Card Design */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white shadow-xl text-left space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl" />

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-sky-400 tracking-wider">
                    Government of India • NHA
                  </div>
                  <div className="text-sm font-bold text-white">ABHA Health Card</div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                  Verified
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xl text-white">
                  {(safePatient.name || 'Patient').split(' ').filter(Boolean).map((n) => n[0]).join('') || 'P'}
                </div>
                <div className="space-y-0.5">
                  <div className="text-base font-semibold text-white">{safePatient.name}</div>
                  <div className="text-xs text-slate-300 font-mono">{safePatient.gender}, Age: {safePatient.age}</div>
                  <div className="text-xs text-sky-300 font-mono">ABDM Enrolled</div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">ABHA Number</div>
                  <div className="text-sm font-mono font-bold text-sky-300 tracking-wide">
                    {safePatient.abhaId}
                  </div>
                  <div className="text-[11px] text-slate-300">{safePatient.abhaAddress || 'patient@abdm'}</div>
                </div>

                {/* Simulated QR Code Box */}
                <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
                  <QrCode className="w-12 h-12 text-slate-950" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => alert('Simulated ABHA Card PDF Downloaded!')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-white transition cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ABHA Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: UPLOAD NEW MEDICAL REPORT MODAL
          ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Upload Medical Document</h3>
                  <p className="text-[11px] text-slate-400">PDF, PNG, JPG files are digitized with AI OCR</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUploading) {
                    setShowUploadModal(false);
                    removeSelectedFile();
                    setUploadError(null);
                  }
                }}
                disabled={isUploading}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden Native File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="space-y-4 text-left text-xs">
              {/* Document Type Dropdown */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Document Type</label>
                <select
                  value={uploadForm.docType}
                  onChange={(e) => setUploadForm({ ...uploadForm, docType: e.target.value })}
                  disabled={isUploading}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none transition disabled:opacity-60"
                >
                  <option>Diagnostic Lab Report</option>
                  <option>Radiology / X-Ray / MRI Scan</option>
                  <option>Physician Prescription</option>
                  <option>Discharge Summary</option>
                  <option>Vaccination Certificate</option>
                </select>
              </div>

              {/* Test or Document Title Input */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Test or Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Vitamin D3 & B12 Screening"
                  value={uploadForm.testName}
                  onChange={(e) => setUploadForm({ ...uploadForm, testName: e.target.value })}
                  disabled={isUploading}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none transition disabled:opacity-60"
                />
              </div>

              {/* Drag and Drop Zone or Selected File Preview */}
              {!uploadForm.file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed transition cursor-pointer text-center space-y-2.5 ${
                    isDragging
                      ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200 scale-[1.01]'
                      : 'border-slate-200 hover:border-sky-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center mx-auto shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-800">
                      Click or drag document to upload
                    </div>
                    <div className="text-[11px] text-slate-400">
                      PDF, PNG, JPEG up to 20MB • Synced to ABDM Locker
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-sky-700 bg-sky-100/60 font-medium px-2.5 py-1 rounded-full">
                    <Paperclip className="w-3 h-3" />
                    <span>Browse Local Files</span>
                  </div>
                </div>
              ) : (
                /* Selected File Card */
                <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden space-y-0.5">
                      <div className="text-xs font-semibold text-slate-900 truncate max-w-[260px] sm:max-w-xs">
                        {uploadForm.file.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>
                          {uploadForm.file.size > 1024 * 1024
                            ? `${(uploadForm.file.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${Math.round(uploadForm.file.size / 1024)} KB`}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeSelectedFile}
                    disabled={isUploading}
                    className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0 disabled:opacity-50"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">{uploadError}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-white transition cursor-pointer shadow-xs disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Digitizing & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Confirm Upload & Submit</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isUploading) {
                      setShowUploadModal(false);
                      removeSelectedFile();
                      setUploadError(null);
                    }
                  }}
                  disabled={isUploading}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {uploadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">Document Uploaded Successfully!</span>
            <div className="text-[11px] text-slate-400">Report synced to your health locker.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboardView;
