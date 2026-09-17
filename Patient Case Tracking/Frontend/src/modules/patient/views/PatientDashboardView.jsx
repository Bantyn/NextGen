import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  FileText,
  Stethoscope,
  Pill,
  Clock,
  Activity,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Info,
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
  Plus,
  Bell,
  Mic,
  Leaf,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import {
  fetchRegisteredPatients,
  fetchPatientDashboardBundle,
  uploadPatientMedicalDocument,
  bookPatientAppointmentAPI,
  markNotificationReadAPI,
  startNewPatientIntakeAPI,
  addPatientMedicalHistoryAPI,
  fetchAvailableDoctorsAPI,
  recommendDoctorAPI,
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
  const navigate = useNavigate();
  const { user, loginAsPatient } = useAuth();

  // 1. State for selected patient profile (synced with real backend data & auth user)
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    if (user?.role === 'PATIENT' && (user.patient_id || user.id)) {
      return user.patient_id || user.id;
    }
    return sessionStorage.getItem('selected_patient_id') || user?.patient_id || user?.id || null;
  });
  const [patient, setPatient] = useState(INITIAL_EMPTY_PATIENT);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [patientLoadError, setPatientLoadError] = useState(null);
  const [isStartingIntake, setIsStartingIntake] = useState(false);
  const [selectedIntakeDetail, setSelectedIntakeDetail] = useState(null);

  const handleStartNewIntake = async () => {
    const patientId = selectedPatientId || user?.patient_id || user?.id;
    if (!patientId) {
      alert('Please select or log in as a patient first.');
      return;
    }
    try {
      setIsStartingIntake(true);
      const res = await startNewPatientIntakeAPI(patientId, {
        opd_type: patient?.opdType || 'GENERAL',
        opd_system: patient?.opdSystem || 'GENERAL_MEDICINE',
        language: 'gu-IN',
      });
      const newSession = res?.encounter || res?.data || res;
      const newSessionId = newSession?.session_id || res?.sessionId || `SES-${Date.now()}`;

      sessionStorage.setItem(
        'patient_session',
        JSON.stringify({
          sessionId: newSessionId,
          patientId: patientId,
          fullName: patient?.name,
          opdType: patient?.opdType || 'GENERAL',
          opdSystem: patient?.opdSystem || 'GENERAL_MEDICINE',
          tokenNumber: newSession?.token_number || `TK-${Math.floor(Math.random() * 80 + 101)}`,
        })
      );

      navigate('/patient/intake');
    } catch (err) {
      console.error('[PatientDashboard] Failed to initialize new intake encounter:', err);
      alert('Could not start a new intake encounter. Please try again.');
    } finally {
      setIsStartingIntake(false);
    }
  };

  // Modals for Appointments, Notifications
  const [showBookAppointmentModal, setShowBookAppointmentModal] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const [appointmentFormError, setAppointmentFormError] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({
    doctorId: 'DOC-MED-01',
    doctorName: 'Dr. Priya Sharma',
    doctorSpecialization: 'General Medicine',
    consultationType: 'IN_PERSON',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '10:30 AM',
    reason: 'Follow-up clinical consultation',
  });

  // Dynamic Live Doctor Fetching State
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorFetchError, setDoctorFetchError] = useState(null);

  // AI Doctor Recommendation State
  const [isRecommendingDoctor, setIsRecommendingDoctor] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState('');

  const handleRecommendDoctor = async () => {
    if (!appointmentForm.reason) {
      alert('Please describe your symptoms in the "Reason for Visit" box first.');
      return;
    }
    
    setIsRecommendingDoctor(true);
    setRecommendationMessage('');
    
    try {
      const patientId = selectedPatientId || user?.patient_id || user?.id;
      const res = await recommendDoctorAPI(appointmentForm.reason, patient?.opdType || 'GENERAL', patientId);
      
      if (res && res.recommendedDoctor) {
        const doc = res.recommendedDoctor;
        setAppointmentForm(prev => ({
          ...prev,
          doctorId: doc.doctorId,
          doctorName: doc.name,
          doctorSpecialization: doc.specialization || doc.department || 'General Medicine',
          time: doc.fixedSlots && doc.fixedSlots.length > 0 ? doc.fixedSlots[0] : prev.time,
        }));
        setRecommendationMessage(`AI Selected: ${doc.name} (${res.specialty}). ${res.message || ''}`);
      } else {
        setRecommendationMessage('Could not find a suitable doctor for your symptoms.');
      }
    } catch (err) {
      console.error('AI Recommendation failed:', err);
      alert('AI Recommendation failed. Please select a doctor manually.');
    } finally {
      setIsRecommendingDoctor(false);
    }
  };

  // Fetch verified hospital doctors live from backend when appointment modal is opened
  React.useEffect(() => {
    if (!showBookAppointmentModal) return;
    let isMounted = true;
    setLoadingDoctors(true);
    setDoctorFetchError(null);
    fetchAvailableDoctorsAPI({ opd_type: patient?.opdType || 'GENERAL' })
      .then((docs) => {
        if (isMounted && Array.isArray(docs) && docs.length > 0) {
          setAvailableDoctors(docs);
          // Set active doctor if currently selected isn't in list
          if (!docs.some((d) => d.doctorId === appointmentForm.doctorId)) {
            const first = docs[0];
            setAppointmentForm((prev) => ({
              ...prev,
              doctorId: first.doctorId,
              doctorName: first.name,
              doctorSpecialization: first.specialization || first.department || 'General Medicine',
              time: first.fixedSlots?.[0] || '10:30 AM',
            }));
          }
        }
      })
      .catch((err) => {
        console.warn('[PatientDashboard] Live doctors fetch failed:', err.message);
        if (isMounted) {
          setDoctorFetchError('Could not load live doctors from server.');
        }
      })
      .finally(() => {
        if (isMounted) setLoadingDoctors(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showBookAppointmentModal, patient?.opdType]);

  // Load real registered patients from MongoDB Atlas
  React.useEffect(() => {
    let isMounted = true;
    fetchRegisteredPatients().then((list) => {
      if (isMounted && list && list.length > 0) {
        setPatientsList(list);
        // If user is a logged-in patient, their ID takes precedence
        if (user?.role === 'PATIENT' && (user.patient_id || user.id)) {
          const authPatientId = user.patient_id || user.id;
          setSelectedPatientId(authPatientId);
          sessionStorage.setItem('selected_patient_id', authPatientId);
        } else {
          const storedId = sessionStorage.getItem('selected_patient_id');
          if (storedId && list.some((p) => p.id === storedId)) {
            setSelectedPatientId(storedId);
          } else if (!selectedPatientId) {
            setSelectedPatientId(list[0].id);
          }
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load full clinical bundle dynamically from MongoDB Atlas
  const loadDashboard = React.useCallback(async () => {
    if (!selectedPatientId) {
      setLoadingPatient(false);
      return;
    }
    try {
      setLoadingPatient(true);
      setPatientLoadError(null);
      const bundle = await fetchPatientDashboardBundle(selectedPatientId);
      if (bundle) {
        setPatient(bundle);
      }
    } catch (err) {
      console.warn('[PatientDashboard] Load bundle failed:', err.message);
      setPatientLoadError(err.message || 'Unable to retrieve clinical records from server.');
    } finally {
      setLoadingPatient(false);
    }
  }, [selectedPatientId]);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Listen for storage events or window refocus from ABHA creation new tab
  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'abha_linked_event') {
        loadDashboard();
      }
    };
    const handleFocus = () => {
      loadDashboard();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadDashboard]);


  // 2. Active Tab State: 'overview' | 'reports' | 'doctors' | 'prescriptions' | 'history' | 'vitals'
  const [activeTab, setActiveTab] = useState('overview');

  // 3. Search & Filter states
  const [reportSearch, setReportSearch] = useState('');
  const [reportCategory, setReportCategory] = useState('ALL');

  // 4. Modals State
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportModalTab, setReportModalTab] = useState('patient'); // 'patient' | 'extracted' | 'clinical' | 'original'
  const [isExtractedTextExpanded, setIsExtractedTextExpanded] = useState(false);
  const [uploadProgressStep, setUploadProgressStep] = useState('IDLE'); // 'IDLE' | 'UPLOADING' | 'VALIDATING' | 'EXTRACTING' | 'SUMMARIZING' | 'COMPLETED' | 'FAILED'
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
    selectedSessionId: '',
  });

  // Medical History Self-Reporting Modal State
  const [showAddHistoryModal, setShowAddHistoryModal] = useState(false);
  const [historyType, setHistoryType] = useState('condition'); // 'condition' | 'allergy'
  const [historyForm, setHistoryForm] = useState({
    condition: '',
    diagnosedYear: '',
    status: 'Active',
    allergy: '',
    severity: 'Moderate',
    notes: '',
  });
  const [isSubmittingHistory, setIsSubmittingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historySuccess, setHistorySuccess] = useState('');

  const handleAddHistorySubmit = async (e) => {
    e.preventDefault();
    setHistoryError('');
    setHistorySuccess('');
    const targetPatientId = selectedPatientId || user?.patient_id || user?.id;
    if (!targetPatientId) {
      setHistoryError('No active patient selected.');
      return;
    }

    if (historyType === 'condition' && !historyForm.condition.trim()) {
      setHistoryError('Please enter a medical condition name (e.g., Hypertension, Type 2 Diabetes).');
      return;
    }
    if (historyType === 'allergy' && !historyForm.allergy.trim()) {
      setHistoryError('Please enter an allergen name (e.g., Penicillin, Peanuts).');
      return;
    }

    try {
      setIsSubmittingHistory(true);
      await addPatientMedicalHistoryAPI(targetPatientId, {
        condition: historyType === 'condition' ? historyForm.condition.trim() : undefined,
        diagnosedYear: historyForm.diagnosedYear || undefined,
        status: historyForm.status || 'Active',
        allergy: historyType === 'allergy' ? historyForm.allergy.trim() : undefined,
        severity: historyForm.severity || 'Moderate',
        notes: historyForm.notes || undefined,
      });

      setHistorySuccess(
        historyType === 'condition'
          ? `Condition "${historyForm.condition.trim()}" added to medical history!`
          : `Allergy "${historyForm.allergy.trim()}" recorded successfully!`
      );
      setHistoryForm({
        condition: '',
        diagnosedYear: '',
        status: 'Active',
        allergy: '',
        severity: 'Moderate',
        notes: '',
      });
      await loadDashboard();
      setTimeout(() => {
        setShowAddHistoryModal(false);
        setHistorySuccess('');
      }, 1000);
    } catch (err) {
      console.error('[AddMedicalHistory] error:', err);
      setHistoryError(err.message || 'Failed to record medical history.');
    } finally {
      setIsSubmittingHistory(false);
    }
  };

  // Handlers for dynamic actions

  const handleBookAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    try {
      setIsSubmittingAppointment(true);
      setAppointmentFormError(null);
      await bookPatientAppointmentAPI(selectedPatientId, appointmentForm);
      setShowBookAppointmentModal(false);
      setAppointmentForm({
        doctorId: 'DOC-MED-01',
        doctorName: 'Dr. Priya Sharma',
        doctorSpecialization: 'General Medicine',
        consultationType: 'IN_PERSON',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '10:30 AM',
        reason: 'Follow-up clinical consultation',
      });
      await loadDashboard();
    } catch (err) {
      setAppointmentFormError(err.message || 'Failed to schedule appointment.');
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await markNotificationReadAPI(notifId);
      await loadDashboard();
    } catch (err) {
      console.warn('Failed to mark notification read:', err.message);
    }
  };

  // 6-second background sync for live tracking & real-time updates
  React.useEffect(() => {
    if (!selectedPatientId) return;
    const interval = setInterval(() => {
      fetchPatientDashboardBundle(selectedPatientId)
        .then((bundle) => {
          if (bundle && bundle.currentToken) {
            setPatient((prev) => ({
              ...bundle,
              reports: bundle.reports || prev.reports,
            }));
          }
        })
        .catch(() => {});
    }, 6000);

    return () => clearInterval(interval);
  }, [selectedPatientId]);

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

  // Error state display when API fails
  if (patientLoadError) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-20 text-center space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-slate-900">Unable to load your health information</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {patientLoadError}
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => loadDashboard()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
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
  const patientVitals = safePatient?.vitals || null; // Strictly null if not recorded!
  const currentToken = safePatient?.currentToken || null; // Strictly null if not checked in!
  const patientAppointments = Array.isArray(safePatient?.appointments?.upcoming) ? safePatient.appointments.upcoming : [];
  const allAppointments = Array.isArray(safePatient?.appointments?.all) ? safePatient.appointments.all : [];
  const patientNotifications = Array.isArray(safePatient?.notifications?.items) ? safePatient.notifications.items : [];
  const unreadNotificationsCount = safePatient?.notifications?.unreadCount || 0;

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
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    let t1, t2, t3;
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgressStep('UPLOADING');

      // Visual pipeline progress
      t1 = setTimeout(() => setUploadProgressStep('VALIDATING'), 600);
      t2 = setTimeout(() => setUploadProgressStep('EXTRACTING'), 1400);
      t3 = setTimeout(() => setUploadProgressStep('SUMMARIZING'), 2500);

      const patientId = selectedPatientId || safePatient?.id || safePatient?.patient_id || user?.patient_id || user?.id || 'PAT-DEMO';
      const res = await uploadPatientMedicalDocument(patientId, {
        file: uploadForm.file,
        docType: uploadForm.docType,
        testName: uploadForm.testName.trim() || uploadForm.file.name,
        sessionId: uploadForm.selectedSessionId ? uploadForm.selectedSessionId : null,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setUploadProgressStep('COMPLETED');

      // Optimistically prepend newly uploaded report into patient.reports
      if (res?.report) {
        setPatient((prev) => ({
          ...prev,
          reports: [res.report, ...(Array.isArray(prev?.reports) ? prev.reports : [])],
        }));
      }

      // Close modal and reset form after brief completion state
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadProgressStep('IDLE');
        setUploadForm({
          docType: 'Diagnostic Lab Report',
          testName: '',
          date: new Date().toISOString().split('T')[0],
          file: null,
          selectedSessionId: '',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Switch to reports tab to immediately display the document
        setActiveTab('reports');

        // Trigger success toast
        setUploadSuccessToast(true);
        setTimeout(() => setUploadSuccessToast(false), 4000);
      }, 800);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      console.error('[PatientDashboardView] Upload error:', err);
      setUploadProgressStep('FAILED');
      setUploadError(
        err.message ||
        "We couldn't understand this document. Please upload a clearer document or try again."
      );
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
      case 'CHECKED_IN':
      case 'STARTED':
      case 'IDENTIFIED':
        return 0;
      case 'VITALS_TAKEN':
      case 'VITALS_RECORDED':
      case 'PRIORITY_TRIAGE':
        return 1;
      case 'IN_CONSULTATION':
      case 'READY_FOR_DOCTOR':
      case 'DOCTOR_REVIEW':
        return 2;
      case 'LAB_PENDING':
      case 'DIAGNOSTIC_TESTS':
      case 'DOCUMENT_PROCESSING':
        return 3;
      case 'COMPLETED':
      case 'CONSULTATION_COMPLETE':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx =
    currentToken?.stepIndex != null
      ? currentToken.stepIndex
      : getStepIndex(currentToken?.stageKey || currentToken?.status || 'CHECKED_IN');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* =========================================================================
          TOP BANNER: PATIENT IDENTITY CARD & QUICK ACTIONS
          ========================================================================= */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6 sm:p-8 relative">
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
                  {safePatient.name || 'Patient Profile'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                  {safePatient.gender || 'Patient'}{safePatient.age != null ? `, ${safePatient.age} yrs` : ''}
                </span>
                {safePatient.bloodGroup && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Blood Group: {safePatient.bloodGroup}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {safePatient.opdDisplay || (safePatient.opdType === 'AYUSH' ? 'AYUSH OPD' : 'General OPD')}
                </span>
              </div>

              {/* Dynamic ABHA & Contact Info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                {safePatient.abhaId ? (
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
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">ABHA:</span>
                    <span className="text-slate-500 italic">Not Linked</span>
                  </div>
                )}

                {safePatient.address && (
                  <div className="hidden sm:inline-flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{safePatient.address}</span>
                  </div>
                )}

                {safePatient.phone && (
                  <div className="hidden md:inline-flex items-center gap-1 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{safePatient.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Patient Switcher (Populated from MongoDB Atlas) */}
            <div className="hidden items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-400 px-2 uppercase tracking-wider">Patient:</span>
              <select
                value={selectedPatientId || ''}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  sessionStorage.setItem('selected_patient_id', e.target.value);
                  const p = patientsList.find((item) => item.id === e.target.value);
                  if (p && user?.role === 'PATIENT') {
                    loginAsPatient(p);
                  }
                }}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
              >
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications Dropdown Container */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsPanel((prev) => !prev)}
                className="relative z-1000 p-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer shadow-2xs"
                title="System & Clinical Notifications"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsPanel && (
                <div className="absolute z-1000 right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-slate-700" />
                      <span className="text-xs font-semibold text-slate-900">Notifications</span>
                      {unreadNotificationsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowNotificationsPanel(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {patientNotifications.length > 0 ? (
                      patientNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) handleMarkNotificationRead(n.id);
                          }}
                          className={`p-3.5 text-xs transition cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                            !n.isRead ? 'bg-sky-50/40 font-medium' : ''
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              !n.isRead ? 'bg-sky-500' : 'bg-slate-300'
                            }`}
                          />
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center justify-between text-slate-900">
                              <span className="font-semibold">{n.title}</span>
                              <span className="text-[10px] text-slate-400">
                                {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 space-y-1">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-medium text-slate-600">You're all caught up.</p>
                        <p className="text-[11px] text-slate-400">No new clinical notifications.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAbhaModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-600" />
              <span>Digital ABHA Card</span>
            </button>

            <button
              onClick={handleStartNewIntake}
              disabled={isStartingIntake}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white active:scale-95 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Start a new clinical intake encounter for this patient"
            >
              {isStartingIntake ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span> Start New Intake</span>
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
      {currentToken ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-700 text-xs font-mono font-bold tracking-wide">
                TOKEN {currentToken.token}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-950">
                    Live OPD Journey & Consultation Status
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  {currentToken.department} • {currentToken.room}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{currentToken.statusLabel}</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-slate-600 font-medium hidden sm:inline">
                Doctor: <strong className="text-slate-900">{currentToken.doctor}</strong>
              </span>

              {/* Authoritative Real-Time Hospital Feed Badge */}
              <div className="flex items-center gap-1.5 pl-1 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Authoritative Hospital Feed</span>
              </div>
            </div>
          </div>

          {/* 5-Step Horizontal Flow Indicator (Read-Only Live Tracker) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {journeySteps.map((step, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div
                  key={step.key}
                  title={`Stage ${idx + 1}: ${step.label} (${isCurrent ? 'In Progress' : isCompleted ? 'Completed' : 'Pending'})`}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                      : isCompleted
                      ? 'bg-slate-50/80 border-emerald-200/70'
                      : 'bg-white border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'bg-sky-600 text-white shadow-xs'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        Current
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-medium text-emerald-700">Done</span>
                    )}
                    {!isCompleted && !isCurrent && (
                      <span className="text-[10px] font-medium text-slate-400">Pending</span>
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

          {/* Dynamic OPD Encounter Details & Progression Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Est. Wait: <strong className="text-slate-800">{currentToken.estimatedWait || 'In Progress'}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Queue Position: <strong className="text-slate-800">#{currentToken.queuePosition ?? 1}</strong>
              </span>
              {currentToken.stageDesc && (
                <span className="hidden lg:inline text-slate-500 italic">
                  ({currentToken.stageDesc})
                </span>
              )}
            </div>

            {currentStepIdx < 4 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700">
                <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                <span>Next Stage: <strong className="text-slate-900">{journeySteps[currentStepIdx + 1].label}</strong></span>
                <span className="text-slate-400 hidden sm:inline">• Awaiting clinic staff update</span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encounter Completed & Discharged</span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">No Active OPD Encounter Today</h3>
              <p className="text-xs text-slate-500">You are not currently queued in an active clinical session. Start check-in to generate a queue token.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStartNewIntake}
              disabled={isStartingIntake}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isStartingIntake ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>+ Start New Clinical Intake</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          NAVIGATION TABS
          ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80">
        {[
          { id: 'overview', label: 'Overview', icon: HeartPulse },
          {
            id: 'intakes',
            label: 'Intake History',
            icon: Layers,
            count: (safePatient?.intakes || safePatient?.intakeHistory || []).length,
          },
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
            id: 'appointments',
            label: 'Appointments',
            icon: Calendar,
            count: patientAppointments.length,
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
          {/* Dedicated ABHA Section (State A: Linked, State B: Not Linked) */}
          {safePatient.isAbhaLinked && safePatient.abhaId ? (
            /* State A — ABHA Already Linked */
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-400 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                        Ayushman Bharat Health Account (ABHA)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Linked</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm sm:text-base font-mono font-bold tracking-wider text-white">
                        {safePatient.abhaId}
                      </span>
                      <button
                        onClick={handleCopyAbha}
                        className="text-slate-400 hover:text-white transition cursor-pointer"
                        title="Copy ABHA Number"
                      >
                        {copiedAbha ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {safePatient.abhaAddress && (
                      <p className="text-xs text-slate-300 font-mono">
                        Address: <strong className="text-sky-300">{safePatient.abhaAddress}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowAbhaModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition shadow-xs cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-sky-600" />
                    <span>View ABHA Card</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* State B — ABHA Not Linked (Clear Non-Intrusive CTA opening in New Tab) */
            <div className="p-5 sm:p-6 rounded-3xl bg-sky-50/70 border border-sky-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-sky-600 border border-sky-200 flex items-center justify-center shrink-0 shadow-xs">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-950">Your ABHA is not linked yet</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 text-slate-600">
                      Unlinked
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    Create or link your ABHA to connect your digital health identity with your healthcare records. Your existing clinical consultations, lab reports, and history will stay attached to your profile.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <a
                  href={`/patient/abha/create${selectedPatientId ? `?patientId=${selectedPatientId}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create ABHA</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </a>
              </div>
            </div>
          )}

          {/* 0. Clinical Risk & Red-Flag Assessment Status Banner (Dynamic) */}
          <div className="p-4 sm:p-5 rounded-2xl border transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-slate-200/80">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  safePatient?.health?.riskLevel === 'HIGH' || safePatient?.health?.riskLevel === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : safePatient?.health?.riskLevel === 'MODERATE'
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : safePatient?.health?.riskLevel === 'LOW'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                {safePatient?.health?.riskLevel === 'HIGH' || safePatient?.health?.riskLevel === 'CRITICAL' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                ) : safePatient?.health?.riskLevel === 'MODERATE' ? (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                ) : safePatient?.health?.riskLevel === 'LOW' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Info className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                    Clinical Risk Assessment
                  </h4>
                  {safePatient?.health?.riskLevel ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                        safePatient.health.riskLevel === 'HIGH' || safePatient.health.riskLevel === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : safePatient.health.riskLevel === 'MODERATE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {safePatient.health.riskLevel} Risk
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                      Not Computed
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-800">
                  {safePatient?.health?.riskLevel
                    ? `Patient evaluated under ${safePatient.health.riskCategory || 'General Clinical'} risk protocol.`
                    : 'Risk assessment not available'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 pl-13 sm:pl-0">
              {safePatient?.health?.lastUpdated ? (
                <span>
                  Evaluated: <strong className="text-slate-700">{new Date(safePatient.health.lastUpdated).toLocaleDateString()}</strong>
                </span>
              ) : (
                <span className="text-slate-400">Awaiting clinical intake data</span>
              )}
            </div>
          </div>

          {/* 1. Quick Vitals Summary Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-semibold text-slate-900">Latest Recorded Vitals</h3>
                {patientVitals?.recordedAt && (
                  <span className="text-[11px] text-slate-400">
                    (Updated {new Date(patientVitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Recorded by Hospital Staff</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Blood Pressure */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Blood Pressure</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      patientVitals?.bloodPressure?.display || patientVitals?.bp ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div className="text-lg sm:text-xl font-semibold text-slate-900 font-mono">
                  {patientVitals?.bloodPressure?.display || patientVitals?.bp || 'No recent reading'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  {patientVitals?.bloodPressure ? (patientVitals.bpStatus || 'Recorded reading') : 'Target: 120/80 mmHg'}
                </div>
              </div>

              {/* Heart Rate / Pulse */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Heart Rate (Pulse)</span>
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="text-lg sm:text-xl font-semibold text-slate-900 font-mono">
                  {patientVitals?.pulse?.value
                    ? `${patientVitals.pulse.value} bpm`
                    : patientVitals?.pulse
                    ? `${patientVitals.pulse} bpm`
                    : 'Not recorded yet'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  {patientVitals?.pulse ? 'Resting Pulse' : 'Normal: 60-100 bpm'}
                </div>
              </div>

              {/* Blood Glucose */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Blood Glucose</span>
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {patientVitals?.bloodSugar?.sugarType || patientVitals?.sugarType || 'Random'}
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-semibold text-slate-900 font-mono">
                  {patientVitals?.bloodSugar?.value
                    ? `${patientVitals.bloodSugar.value} mg/dL`
                    : patientVitals?.sugar
                    ? `${patientVitals.sugar} mg/dL`
                    : 'Not recorded yet'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  {patientVitals?.bloodSugar?.status || (patientVitals?.bloodSugar?.value ? 'Recorded Glucose' : 'Ref: 70-140 mg/dL')}
                </div>
              </div>

              {/* SpO2 / Temp / BMI */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>SpO2 / Temp</span>
                  <span className="text-[10px] text-sky-600 font-medium">
                    {patientVitals?.recordedAt
                      ? new Date(patientVitals.recordedAt).toLocaleDateString()
                      : patientVitals?.lastUpdated || 'No readings'}
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-semibold text-slate-900 font-mono">
                  {patientVitals?.oxygenSaturation?.value
                    ? `${patientVitals.oxygenSaturation.value}%`
                    : patientVitals?.spo2
                    ? `${patientVitals.spo2}`
                    : 'Not recorded'}
                  {patientVitals?.temperature?.value ? (
                    <span className="text-xs text-slate-400 font-normal"> / {patientVitals.temperature.value}°F</span>
                  ) : patientVitals?.temp ? (
                    <span className="text-xs text-slate-400 font-normal"> / {patientVitals.temp}°F</span>
                  ) : (
                    ''
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  BMI: {patientVitals?.bmi?.value || patientVitals?.bmi || 'Not calculated'}
                </div>
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
                    {patientConsultedDoctors[0].avatar ? (
                      <img
                        src={patientConsultedDoctors[0].avatar}
                        alt={patientConsultedDoctors[0].name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-lg shadow-2xs">
                        <Stethoscope className="w-8 h-8 text-sky-600" />
                      </div>
                    )}
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
                <div className="flex items-center justify-between gap-2 text-rose-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Allergy & Contraindications</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryType('allergy');
                      setHistoryError('');
                      setHistorySuccess('');
                      setShowAddHistoryModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-100/80 hover:bg-rose-200/80 px-2 py-0.5 rounded-lg border border-rose-200 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
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
                <div className="flex items-center justify-between gap-2 text-slate-900">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <h4 className="text-xs font-semibold">Diagnosed Conditions</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryType('condition');
                      setHistoryError('');
                      setHistorySuccess('');
                      setShowAddHistoryModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200/60 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
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
          TAB CONTENT: CLINICAL INTAKE & ENCOUNTER HISTORY
          ========================================================================= */}
      {activeTab === 'intakes' && (
        <div className="space-y-6">
          {/* Intake Header & CTA Bar */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-950">Clinical Intake & Encounter History</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                  {(safePatient?.intakes || safePatient?.intakeHistory || []).length} Encounters
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Persistent history of your voice intakes, chief complaints, AI-assisted summaries, and doctor consultations.
              </p>
            </div>

            <button
              onClick={handleStartNewIntake}
              disabled={isStartingIntake}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white active:scale-95 transition cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
            >
              {isStartingIntake ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
              <span>+ Start New Clinical Intake</span>
            </button>
          </div>

          {/* Encounters List */}
          {(safePatient?.intakes || safePatient?.intakeHistory || []).length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {(safePatient?.intakes || safePatient?.intakeHistory || []).map((enc, idx) => {
                const isEmergency = enc.triageLevel === 'EMERGENCY' || enc.hasRedFlag;
                const isHigh = enc.triageLevel === 'HIGH PRIORITY' || enc.triageLevel === 'HIGH';
                const isModerate = enc.triageLevel === 'MODERATE';

                const badgeBg = isEmergency
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isHigh
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : isModerate
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <div
                    key={enc.sessionId || enc.id || idx}
                    className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {enc.sessionId || enc.id}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500 font-medium">
                              {enc.formattedDate || (enc.date ? new Date(enc.date).toLocaleDateString('en-GB') : 'Recent')}
                            </span>
                            {enc.tokenNumber && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                                Token: {enc.tokenNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-800 capitalize mt-0.5">
                            {enc.department || enc.opdSystem || enc.opdType || 'General OPD'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}>
                          {enc.triageLevel || 'NORMAL'}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {enc.status || 'COMPLETED'}
                        </span>
                      </div>
                    </div>

                    {/* Complaint & Symptoms */}
                    <div className="space-y-2">
                      <div className="text-xs">
                        <span className="text-slate-400 font-medium uppercase text-[11px] block">Chief Complaint:</span>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {enc.chiefComplaint || 'Clinical consultation recorded via voice intake.'}
                        </p>
                      </div>

                      {Array.isArray(enc.symptoms) && enc.symptoms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {enc.symptoms.map((sym, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
                            >
                              {sym}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Automatically Appointed Doctor */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-slate-50 border border-sky-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
                          {enc.opdType === 'AYUSH' ? (
                            <Leaf className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Stethoscope className="w-5 h-5 text-sky-600" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-700">
                              Automatically Appointed Doctor
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Assigned
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {enc.assignedDoctorName || (enc.opdType === 'AYUSH' ? 'Vaidya Rajesh Kumar' : 'Dr. Sarah Mitchell')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {enc.assignedDoctorDegree || (enc.opdType === 'AYUSH' ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (General Medicine)')}
                            {enc.assignedDoctorSpecialty && enc.assignedDoctorSpecialty !== enc.assignedDoctorDegree ? ` • ${enc.assignedDoctorSpecialty}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-sky-100/80">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Consultation Room
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5">
                          {enc.assignedDoctorRoom || (enc.opdType === 'AYUSH' ? 'Room 104 (Ayush OPD)' : 'Room 202 (General OPD)')}
                        </div>
                      </div>
                    </div>

                    {/* AI Assistive Summary Snippet */}
                    {enc.aiSummary && (
                      <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 text-xs text-slate-700 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-sky-800">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Clinical Digest</span>
                        </div>
                        <p className="line-clamp-2 leading-relaxed text-slate-600">
                          {enc.aiSummary}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400">
                        {enc.voiceTranscript ? '🎙️ Voice Transcript Available' : 'Clinical Encounter Recorded'}
                      </span>

                      <button
                        onClick={() => setSelectedIntakeDetail(enc)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-900 font-medium transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Encounter Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">No Previous Intake Encounters</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't completed any clinical intakes yet. Click below to start a new voice intake session.
              </p>
              <button
                onClick={handleStartNewIntake}
                disabled={isStartingIntake}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Start First Intake Encounter</span>
              </button>
            </div>
          )}
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
              {filteredReports.map((report) => {
                // Key findings derivation
                const findingsList =
                  report.importantFindings && report.importantFindings.length > 0
                    ? report.importantFindings
                    : (report.parameters || []).slice(0, 3).map((p) => ({
                        finding: `${p.name}: ${p.value}`,
                        status: p.alert ? 'HIGH' : 'NORMAL',
                        reference_range: p.normalRange,
                      }));

                const patientMeaning =
                  report.patientSummary?.meaning ||
                  (report.patientSummary?.about ? report.patientSummary.about : null) ||
                  report.summary ||
                  'Your medical document has been digitized and securely linked to your health record.';

                return (
                  <div
                    key={report.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      {/* 1. Header: Icon, ID, Title, Facility & Confidence */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0 shadow-2xs">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                                {report.testCode || 'DOC-REP'}
                              </span>
                              {report.extractionConfidence && (
                                <span
                                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                                    report.extractionConfidence === 'CLEAR'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : report.extractionConfidence === 'PARTIAL'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {report.extractionConfidence === 'CLEAR'
                                    ? '● Clearly extracted'
                                    : report.extractionConfidence === 'PARTIAL'
                                    ? '● Partially extracted'
                                    : '● Uncertain extraction'}
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-semibold text-slate-950 leading-snug">
                              {report.title}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              {report.date} • {report.facility || 'Apex Healthcare Diagnostics'}
                            </p>
                          </div>
                        </div>

                        {report.statusSeverity === 'attention' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full shrink-0">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Attention</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Normal</span>
                          </span>
                        )}
                      </div>

                      {/* 2. AI Summary Block */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                          <Sparkles className="w-3 h-3 text-sky-600" />
                          <span>AI Summary</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {report.patientSummary?.about || report.summary || 'Your report contains diagnostic investigation results.'}
                        </p>
                      </div>

                      {/* 3. Key Findings with 🔴 / 🟢 semantic indicators */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                          Key Findings
                        </span>
                        <div className="space-y-1.5">
                          {findingsList.length > 0 ? (
                            findingsList.slice(0, 3).map((f, i) => {
                              const isAbnormal =
                                f.status === 'LOW' ||
                                f.status === 'HIGH' ||
                                f.status === 'CRITICAL' ||
                                f.severity === 'CRITICAL' ||
                                f.severity === 'HIGH' ||
                                f.severity === 'LOW';
                              return (
                                <div
                                  key={i}
                                  className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-xl border ${
                                    isAbnormal
                                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 font-medium truncate max-w-[220px] sm:max-w-xs">
                                    <span>{isAbnormal ? '🔴' : '🟢'}</span>
                                    <span>{f.finding}</span>
                                  </span>
                                  <span className="text-[10px] font-mono shrink-0 ml-2">
                                    {isAbnormal
                                      ? (f.status === 'LOW' ? 'Below reference range' : f.status === 'HIGH' ? 'Above reference range' : 'Critical/Attention')
                                      : 'Within range'}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-slate-400 py-1">No abnormal findings identified.</div>
                          )}
                        </div>
                      </div>

                      {/* 4. What It Means */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                          What It Means
                        </span>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {patientMeaning}
                        </p>
                      </div>

                      {/* 5. ⚠️ Important Disclaimer */}
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          <strong>Important:</strong> Discuss abnormal findings with your doctor. This summary is generated from your uploaded report and is not a diagnosis.
                        </span>
                      </div>
                    </div>

                    {/* 6. Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setReportModalTab('patient');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 active:scale-98 transition cursor-pointer shadow-xs"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>View Full Report</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setReportModalTab('extracted');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 active:scale-98 transition cursor-pointer shadow-2xs"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Extracted Data</span>
                      </button>

                      <button
                        onClick={() => {
                          if (report.fileUrl) {
                            window.open(report.fileUrl, '_blank');
                          } else {
                            alert(`Document: ${report.title}`);
                          }
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950 transition cursor-pointer shrink-0"
                        title="Download or View Document File"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
                        onClick={() => {
                          setAppointmentForm((prev) => ({
                            ...prev,
                            doctorId: doc.id || doc.doctorId || 'DOC-MED-01',
                            doctorName: doc.name,
                            doctorSpecialization: doc.specialty || doc.department || 'General Medicine',
                          }));
                          setShowBookAppointmentModal(true);
                        }}
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
          TAB CONTENT: APPOINTMENTS & CONSULTATION BOOKINGS (DYNAMIC)
          ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Appointments & Scheduled Consultations
              </h2>
              <p className="text-xs text-slate-500">
                Manage upcoming and previous clinical visits with Modern Medicine and AYUSH specialists
              </p>
            </div>
            <button
              onClick={() => setShowBookAppointmentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs shrink-0"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book New Appointment</span>
            </button>
          </div>

          {/* Upcoming Appointments */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Upcoming Appointments</h3>
            {patientAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {apt.appointmentNumber || apt.id}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{apt.status}</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-950">{apt.doctorName}</h4>
                      <p className="text-xs text-sky-700 font-medium">{apt.doctorSpecialization}</p>
                      <p className="text-xs text-slate-500">{apt.department || 'General OPD'} • {apt.consultationType}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {apt.date} at {apt.time}
                      </span>
                      <span className="font-medium text-slate-900">{apt.room || 'Room Assigned on Check-in'}</span>
                    </div>

                    {apt.reason && (
                      <p className="text-[11px] text-slate-500 italic">Reason: "{apt.reason}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-3xl bg-white border border-slate-200/80 text-slate-500 space-y-3 shadow-xs">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-800">No upcoming appointments.</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have no scheduled clinical consultations or follow-up visits pending.
                  </p>
                </div>
                <button
                  onClick={() => setShowBookAppointmentModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Consultation</span>
                </button>
              </div>
            )}
          </div>

          {/* Past Appointments */}
          {allAppointments.length > patientAppointments.length && (
            <div className="space-y-3 pt-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Past Consultations</h3>
              <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                {allAppointments
                  .filter((a) => a.status === 'COMPLETED' || a.status === 'CANCELLED')
                  .map((apt) => (
                    <div key={apt.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{apt.doctorName}</span>
                        <div className="text-slate-500">{apt.doctorSpecialization} • {apt.date}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {apt.status}
                      </span>
                    </div>
                  ))}
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Chronic Medical Conditions</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryType('condition');
                    setHistoryError('');
                    setHistorySuccess('');
                    setShowAddHistoryModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200/60 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Condition</span>
                </button>
              </div>
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Known Allergies & Adverse Reactions</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryType('allergy');
                    setHistoryError('');
                    setHistorySuccess('');
                    setShowAddHistoryModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-200 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Allergy</span>
                </button>
              </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Vitals & Biometric Trend Log</h2>
              <p className="text-xs text-slate-500">
                Recorded during check-ins and clinical appointments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Last recorded:{' '}
                <strong className="text-slate-800">
                  {patientVitals?.recordedAt
                    ? new Date(patientVitals.recordedAt).toLocaleString()
                    : patientVitals?.lastUpdated || 'No readings on record'}
                </strong>
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Authoritative Clinical Data • Managed by Triage & Doctor</span>
              </div>
            </div>
          </div>

          {/* Detailed Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-slate-500">Blood Pressure</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-950">
                {patientVitals?.bloodPressure?.display || patientVitals?.bp || 'No recent reading'}
              </div>
              <div className="text-xs text-emerald-700 font-medium">
                {patientVitals?.bloodPressure ? (patientVitals.bpStatus || 'Recorded reading') : 'Target: 120/80 mmHg'}
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Target reference range: 110-125 / 70-85 mmHg
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-slate-500">Blood Glucose</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-950">
                {patientVitals?.bloodSugar?.value
                  ? `${patientVitals.bloodSugar.value} mg/dL`
                  : patientVitals?.sugar
                  ? `${patientVitals.sugar} mg/dL`
                  : 'Not recorded yet'}
              </div>
              <div className="text-xs text-emerald-700 font-medium">
                {patientVitals?.bloodSugar?.sugarType || (patientVitals?.bloodSugar?.value ? 'Recorded Glucose' : 'Ref: 70-140 mg/dL')}
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Target reference range: 70 - 140 mg/dL
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-slate-500">Body Mass Index (BMI)</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-950">
                {patientVitals?.bmi?.value || patientVitals?.bmi || 'Not calculated'}
              </div>
              <div className="text-xs text-sky-700 font-medium">
                {patientVitals?.weight?.value
                  ? `${patientVitals.weight.value} kg`
                  : patientVitals?.weight
                  ? `${patientVitals.weight} kg`
                  : 'Weight N/A'}{' '}
                /{' '}
                {patientVitals?.height?.value
                  ? `${patientVitals.height.value} cm`
                  : patientVitals?.height
                  ? `${patientVitals.height} cm`
                  : 'Height N/A'}
              </div>
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
                        <td className="py-3 px-3 font-sans font-medium text-slate-900">{row.date} {row.time && <span className="text-slate-400 font-normal">({row.time})</span>}</td>
                        <td className="py-3 px-3 text-slate-700">{row.bp ? `${row.bp} mmHg` : (row.bpSys ? `${row.bpSys}/${row.bpDia} mmHg` : '—')}</td>
                        <td className="py-3 px-3 text-slate-700">{row.pulse != null ? `${row.pulse} bpm` : '—'}</td>
                        <td className="py-3 px-3 text-slate-700">{row.sugar != null ? `${row.sugar} mg/dL` : '—'}</td>
                        <td className="py-3 px-3 text-slate-700">{row.weight != null ? `${row.weight} kg` : '—'}</td>
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
      {/* =========================================================================
          MODAL 1: ADVANCED DOCUMENT INTELLIGENCE DETAIL VIEW
          ========================================================================= */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-[28px] max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-bold">
                    {selectedReport.testCode || 'DOC-REP'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{selectedReport.category}</span>
                  {selectedReport.extractionConfidence && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        selectedReport.extractionConfidence === 'CLEAR'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : selectedReport.extractionConfidence === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>
                        {selectedReport.extractionConfidence === 'CLEAR'
                          ? 'Clearly Extracted'
                          : selectedReport.extractionConfidence === 'PARTIAL'
                          ? 'Partially Extracted'
                          : 'Uncertain Extraction'}
                      </span>
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-950">
                  {selectedReport.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Conducted at {selectedReport.facility || 'Apex Healthcare Diagnostics'} • {selectedReport.date}
                  {selectedReport.orderedBy ? ` • Ordered by ${selectedReport.orderedBy}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedReport.fileUrl && (
                  <button
                    onClick={() => window.open(selectedReport.fileUrl, '_blank')}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-950 transition cursor-pointer shadow-2xs"
                    title="Open Document in New Tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setIsExtractedTextExpanded(false);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white overflow-x-auto text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => setReportModalTab('patient')}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  reportModalTab === 'patient'
                    ? 'border-slate-950 text-slate-950 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Patient Explanation</span>
              </button>

              <button
                type="button"
                onClick={() => setReportModalTab('extracted')}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  reportModalTab === 'extracted'
                    ? 'border-slate-950 text-slate-950 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Extracted Clinical Data</span>
              </button>

              <button
                type="button"
                onClick={() => setReportModalTab('clinical')}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  reportModalTab === 'clinical'
                    ? 'border-slate-950 text-slate-950 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>AI Clinical Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setReportModalTab('original')}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  reportModalTab === 'original'
                    ? 'border-slate-950 text-slate-950 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Original Document</span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
              {/* TAB 1: PATIENT EXPLANATION */}
              {reportModalTab === 'patient' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* What this report is about */}
                  <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-600" />
                      <span>What this report is about</span>
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {selectedReport.patientSummary?.about ||
                        selectedReport.summary ||
                        'This document contains clinical diagnostic information recorded on ' + selectedReport.date + '.'}
                    </p>
                  </div>

                  {/* Important findings */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                      Important Findings
                    </span>
                    <div className="space-y-2">
                      {selectedReport.importantFindings && selectedReport.importantFindings.length > 0 ? (
                        selectedReport.importantFindings.map((f, idx) => {
                          const isAbnormal =
                            f.status === 'LOW' ||
                            f.status === 'HIGH' ||
                            f.status === 'CRITICAL' ||
                            f.severity === 'CRITICAL' ||
                            f.severity === 'HIGH' ||
                            f.severity === 'LOW';
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${
                                isAbnormal
                                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{isAbnormal ? '🔴' : '🟢'}</span>
                                <span className="font-medium">{f.finding}</span>
                              </div>
                              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-current shrink-0 ml-2">
                                {f.status === 'LOW'
                                  ? 'Below Reference Range'
                                  : f.status === 'HIGH'
                                  ? 'Above Reference Range'
                                  : f.status === 'CRITICAL'
                                  ? 'Critical Finding'
                                  : 'Normal / In Range'}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                          All observed parameters are within expected clinical limits or no critical deviations detected.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* What this may mean */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>What this may mean</span>
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {selectedReport.patientSummary?.meaning ||
                        'Abnormal indicators could suggest common nutritional or metabolic variations. These findings provide context but cannot alone determine the cause without a physician examination.'}
                    </p>
                  </div>

                  {/* What you should do */}
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>What you should do</span>
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {selectedReport.patientSummary?.action_advice ||
                        'Discuss these findings with your treating doctor during your OPD consultation, especially if you experience persistent symptoms, fatigue, or discomfort.'}
                    </p>
                  </div>

                  {/* ⚠️ Mandatory Safety Note */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Important Notice:</strong>{' '}
                      {selectedReport.patientSummary?.important_disclaimer ||
                        'This summary is generated from your uploaded medical document and is not a medical diagnosis. Always consult with a registered physician.'}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXTRACTED CLINICAL DATA */}
              {reportModalTab === 'extracted' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Extracted Metadata Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase">Patient Name</span>
                      <strong className="text-slate-900 font-medium">
                        {(() => {
                          const n = selectedReport.extractedData?.patient?.name;
                          const isInvalid = !n || /\b(?:with|chronic|acute|disease|asymptomatic|patient|liver|hepatitis|cirrhosis|report|investigation)\b/i.test(n);
                          return (!isInvalid ? n : (safePatient.name || 'Recorded in Report'));
                        })()}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase">Age / Gender</span>
                      <strong className="text-slate-900 font-medium">
                        {selectedReport.extractedData?.patient?.age || safePatient.age || '—'}{' '}
                        {(selectedReport.extractedData?.patient?.age || safePatient.age) ? 'Y / ' : ''}
                        {selectedReport.extractedData?.patient?.gender || safePatient.gender || 'Not specified'}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase">Doctor / Facility</span>
                      <strong className="text-slate-900 font-medium">
                        {(selectedReport.orderedBy || selectedReport.facility || 'Clinical Provider').replace(/\s+(?:reported|collected|registered|generated|sample|date|time|uhid|ref|page|contact).*$/i, '')}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase">Document Date</span>
                      <strong className="text-slate-900 font-medium">{selectedReport.date}</strong>
                    </div>
                  </div>

                  {/* Diagnoses & Clinical Entities */}
                  {selectedReport.extractedData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {selectedReport.extractedData.diagnoses && selectedReport.extractedData.diagnoses.length > 0 && (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Extracted Diagnoses / Indications
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedReport.extractedData.diagnoses.map((d, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedReport.extractedData.medications && selectedReport.extractedData.medications.length > 0 && (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Active Medications in Document
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedReport.extractedData.medications.map((m, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium"
                              >
                                {typeof m === 'string' ? m : `${m.name} ${m.dosage || ''}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lab Results Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Extracted Lab Investigations & Reference Ranges
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {((selectedReport.parameters || []).length)} Parameters Identified
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                          <tr>
                            <th className="p-3">Test Investigation</th>
                            <th className="p-3">Observed Value</th>
                            <th className="p-3">Reference Range</th>
                            <th className="p-3 text-right">Semantic Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {((selectedReport.parameters || []).length > 0) ? (
                            selectedReport.parameters.map((param, idx) => (
                              <tr key={idx} className={param.alert ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'}>
                                <td className="p-3 font-medium text-slate-900">
                                  {param.name}
                                </td>
                                <td className="p-3 font-mono font-semibold text-slate-900">
                                  {param.value}
                                </td>
                                <td className="p-3 font-mono text-slate-500">
                                  {param.normalRange || 'Standard reference'}
                                </td>
                                <td className="p-3 text-right">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                      param.alert
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {param.status || 'Normal'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400">
                                No tabular laboratory investigations extracted from this document type.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AI CLINICAL SUMMARY */}
              {reportModalTab === 'clinical' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
                      <Stethoscope className="w-4 h-4" />
                      <span>Physician Clinical Digest</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {selectedReport.clinicalSummary?.physician_digest ||
                        (typeof selectedReport.clinicalSummary === 'string'
                          ? selectedReport.clinicalSummary
                          : selectedReport.summary)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-semibold text-slate-900 block uppercase tracking-wider text-[10px]">
                        Patient Overview
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedReport.clinicalSummary?.patient_overview ||
                          `${safePatient.name}, ${safePatient.age}y ${safePatient.gender}. Diagnostic encounter evaluated.`}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-semibold text-slate-900 block uppercase tracking-wider text-[10px]">
                        Relevant Medical History
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedReport.clinicalSummary?.medical_history ||
                          (selectedReport.extractedData?.medical_history?.join(', ')) ||
                          'No prior chronic condition history explicitly noted in this document.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-semibold text-slate-900 block uppercase tracking-wider text-[10px]">
                        Investigations & Results
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedReport.clinicalSummary?.investigations ||
                          `Total parameters analyzed: ${(selectedReport.parameters || []).length}.`}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                      <span className="font-semibold text-rose-900 block uppercase tracking-wider text-[10px]">
                        Possible Risk Indicators & Red Flags
                      </span>
                      <p className="text-rose-950 leading-relaxed font-medium">
                        {selectedReport.clinicalSummary?.risk_indicators ||
                          (selectedReport.critical
                            ? 'Abnormal clinical markers detected requiring physician consultation.'
                            : 'No acute red flags detected in document parameters.')}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-200 text-xs space-y-1">
                    <span className="font-semibold text-sky-900 block uppercase tracking-wider text-[10px]">
                      Recommended Follow-up
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {selectedReport.clinicalSummary?.recommended_followup ||
                        'Correlate observed investigation values with patient symptom profile and clinical examination during OPD encounter.'}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 italic px-1">
                    Note: Clinical summary strictly preserves factual extracted lab ranges. AI inference is provided as clinical support and does not replace the physician's diagnostic evaluation.
                  </div>
                </div>
              )}

              {/* TAB 4: ORIGINAL DOCUMENT PREVIEW */}
              {reportModalTab === 'original' && (
                <div className="space-y-4 animate-fadeIn">
                  {selectedReport.fileUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">
                          Original File: <strong className="text-slate-900">{selectedReport.fileName || selectedReport.title}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(selectedReport.fileUrl, '_blank')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open In Full Window</span>
                          </button>
                          <a
                            href={selectedReport.fileUrl}
                            download={selectedReport.fileName || 'medical_document'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white transition cursor-pointer shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Original</span>
                          </a>
                        </div>
                      </div>

                      {/* Iframe or Image Preview Container */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[420px]">
                        {selectedReport.fileUrl.toLowerCase().endsWith('.pdf') ? (
                          <iframe
                            src={selectedReport.fileUrl}
                            className="w-full h-[520px] rounded-2xl"
                            title="Uploaded Medical Document PDF"
                          />
                        ) : (
                          <img
                            src={selectedReport.fileUrl}
                            alt="Uploaded Medical Document"
                            className="max-h-[520px] max-w-full object-contain p-2"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center rounded-3xl bg-slate-50 border border-slate-200 text-slate-500 space-y-3">
                      <FileText className="w-10 h-10 mx-auto text-slate-400" />
                      <h4 className="text-sm font-semibold text-slate-800">
                        Electronic ABDM Diagnostic Record
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        This document was received electronically via ABDM FHIR gateway. The extracted parameters and clinical summaries reflect the authenticated lab payload.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible View Extracted Text (OCR) Section */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExtractedTextExpanded(!isExtractedTextExpanded)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Extracted Text (OCR / Machine Text)</span>
                  </span>
                  {isExtractedTextExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isExtractedTextExpanded && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 border border-slate-800 whitespace-pre-wrap">
                    {selectedReport.extractedText ||
                      'No raw OCR text preserved. Parameters were ingested directly as structured entities.'}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs shrink-0">
              <span className="text-slate-500">
                ABDM FHIR Resource • Verified Record
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedReport(null);
                  setIsExtractedTextExpanded(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
              >
                Close Document
              </button>
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
              id="document-file-input-modal"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {/* Multi-stage Async Processing View */}
            {uploadProgressStep !== 'IDLE' && uploadProgressStep !== 'FAILED' ? (
              <div className="py-6 px-4 space-y-6 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto shadow-sm">
                  {uploadProgressStep === 'COMPLETED' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-slate-900">
                    {uploadProgressStep === 'UPLOADING' && 'Uploading Document...'}
                    {uploadProgressStep === 'VALIDATING' && 'Validating File & Security...'}
                    {uploadProgressStep === 'EXTRACTING' && 'Running OCR & Extracting Medical Data...'}
                    {uploadProgressStep === 'SUMMARIZING' && 'Generating Dual AI Clinical Summaries...'}
                    {uploadProgressStep === 'COMPLETED' && 'Document Processing Completed!'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Digitizing your clinical document with multimodal OCR intelligence
                  </p>
                </div>

                {/* 5-Step Progress Bar */}
                <div className="space-y-2.5 max-w-sm mx-auto text-left text-xs">
                  {[
                    { key: 'UPLOADING', label: '1. Uploading Document' },
                    { key: 'VALIDATING', label: '2. Validating File Integrity' },
                    { key: 'EXTRACTING', label: '3. Extracting Structured Medical Information' },
                    { key: 'SUMMARIZING', label: '4. AI Clinical & Patient Summary' },
                    { key: 'COMPLETED', label: '5. Completed & Linked to ABDM' },
                  ].map((st, idx) => {
                    const stepOrder = ['UPLOADING', 'VALIDATING', 'EXTRACTING', 'SUMMARIZING', 'COMPLETED'];
                    const currentIdx = stepOrder.indexOf(uploadProgressStep);
                    const thisIdx = stepOrder.indexOf(st.key);
                    const isPassed = currentIdx > thisIdx || uploadProgressStep === 'COMPLETED';
                    const isCurrent = currentIdx === thisIdx && uploadProgressStep !== 'COMPLETED';

                    return (
                      <div
                        key={st.key}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition ${
                          isCurrent
                            ? 'bg-sky-50 border border-sky-200 text-sky-900 font-medium'
                            : isPassed
                            ? 'text-emerald-800'
                            : 'text-slate-400 opacity-60'
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin text-sky-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </div>
                        )}
                        <span className="text-xs">{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : uploadProgressStep === 'FAILED' ? (
              /* Failed Processing State Card (Section 12) */
              <div className="py-6 px-4 space-y-5 text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                  <AlertCircle className="w-7 h-7 text-rose-600" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-semibold text-rose-950">
                    Processing Failed
                  </h4>
                  <p className="text-xs text-rose-800 font-medium max-w-sm mx-auto">
                    We couldn't understand this document. Please upload a clearer document or try again.
                  </p>
                  {uploadError && (
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto pt-1 font-mono">
                      Detail: {uploadError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadProgressStep('IDLE');
                      setUploadError(null);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-white transition cursor-pointer shadow-xs"
                  >
                    Upload Clearer Document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadProgressStep('IDLE');
                      setUploadError(null);
                      removeSelectedFile();
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Upload Form */
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
                    <option>Doctor Consultation Document</option>
                    <option>Vaccination Certificate</option>
                    <option>Previous Medical Record</option>
                  </select>
                </div>

                {/* Test or Document Title Input */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Test or Document Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Complete Blood Count & Lipid Profile"
                    value={uploadForm.testName}
                    onChange={(e) => setUploadForm({ ...uploadForm, testName: e.target.value })}
                    disabled={isUploading}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none transition disabled:opacity-60"
                  />
                </div>

                {/* Link to Encounter (Optional) */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Link to Encounter (Optional)</label>
                  <select
                    value={uploadForm.selectedSessionId || ''}
                    onChange={(e) => setUploadForm({ ...uploadForm, selectedSessionId: e.target.value })}
                    disabled={isUploading}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none transition disabled:opacity-60"
                  >
                    <option value="">General Patient Record (No specific encounter)</option>
                    {(safePatient?.intakes || safePatient?.intakeHistory || []).map((enc) => (
                      <option key={enc.sessionId || enc.id} value={enc.sessionId || enc.id}>
                        {enc.formattedDate || 'Encounter'} — {enc.department || 'General OPD'}: {enc.chiefComplaint?.slice(0, 30) || 'Consultation'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Drag and Drop Zone or Selected File Preview */}
                {!uploadForm.file ? (
                  <label
                    htmlFor="document-file-input-modal"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`block p-6 rounded-2xl border-2 border-dashed transition cursor-pointer text-center space-y-2.5 ${
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
                        PDF, PNG, JPEG up to 20MB • Processed with OCR & AI
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] text-sky-700 bg-sky-100/60 font-medium px-2.5 py-1 rounded-full">
                      <Paperclip className="w-3 h-3" />
                      <span>Browse Local Files</span>
                    </div>
                  </label>
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
                            Ready for AI Extraction
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
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 ${
                      uploadForm.file
                        ? 'bg-slate-950 hover:bg-slate-800 text-white'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadForm.file ? 'Confirm Upload & Start AI Processing' : 'Browse & Select File to Upload'}</span>
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
            )}
          </div>
        </div>
      )}

      {/* =========================================================================

      {/* =========================================================================
          MODAL 4: BOOK CONSULTATION APPOINTMENT
          ========================================================================= */}
      {showBookAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Book Clinical Consultation</h3>
                  <p className="text-xs text-slate-500">Schedule an appointment with an attending physician</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBookAppointmentModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookAppointmentSubmit} className="p-6 space-y-4 text-xs">
              {appointmentFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{appointmentFormError}</div>
                </div>
              )}

              {recommendationMessage && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-start gap-2 mb-2 text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>{recommendationMessage}</div>
                </div>
              )}

              {/* Doctor & Specialty Selection — Live Backend Query */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 block">Consulting Physician</label>
                  {loadingDoctors && (
                    <span className="text-[11px] text-sky-600 flex items-center gap-1 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Fetching live doctors...
                    </span>
                  )}
                </div>
                {doctorFetchError && (
                  <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl mb-2 border border-amber-200">
                    {doctorFetchError}
                  </div>
                )}
                <select
                  value={appointmentForm.doctorId}
                  disabled={loadingDoctors}
                  onChange={(e) => {
                    const selDocId = e.target.value;
                    const doc = availableDoctors.find((d) => d.doctorId === selDocId);
                    if (doc) {
                      setAppointmentForm({
                        ...appointmentForm,
                        doctorId: doc.doctorId,
                        doctorName: doc.name,
                        doctorSpecialization: doc.specialization || doc.department || 'General Medicine',
                        time: doc.fixedSlots && doc.fixedSlots.length > 0 ? doc.fixedSlots[0] : appointmentForm.time,
                      });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {availableDoctors.length > 0 ? (
                    availableDoctors.map((doc) => (
                      <option key={doc.doctorId} value={doc.doctorId}>
                        {doc.name} ({doc.specialization} — {doc.department}) [{doc.availabilityStatus === 'AVAILABLE' ? 'Available' : doc.availabilityStatus}]
                      </option>
                    ))
                  ) : (
                    <option value={appointmentForm.doctorId}>
                      {loadingDoctors ? 'Loading verified doctors...' : `${appointmentForm.doctorName} (${appointmentForm.doctorSpecialization})`}
                    </option>
                  )}
                </select>
              </div>

              {/* Consultation Type */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAppointmentForm({ ...appointmentForm, consultationType: 'IN_PERSON' })}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition cursor-pointer ${
                      appointmentForm.consultationType === 'IN_PERSON'
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    In-Person Hospital Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentForm({ ...appointmentForm, consultationType: 'TELECONSULTATION' })}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition cursor-pointer ${
                      appointmentForm.consultationType === 'TELECONSULTATION'
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Video Teleconsult
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time Slot</label>
                  <select
                    value={appointmentForm.time}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {(() => {
                      const selDoc = availableDoctors.find((d) => d.doctorId === appointmentForm.doctorId);
                      const slots =
                        selDoc?.fixedSlots && selDoc.fixedSlots.length > 0
                          ? selDoc.fixedSlots
                          : ['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:30 PM'];
                      return slots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Visit & Symptoms</label>
                <textarea
                  rows={2}
                  placeholder="Describe your current symptoms (e.g., severe headache, fever) to let AI recommend a doctor, or write your reason for follow-up"
                  value={appointmentForm.reason}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none mb-2"
                />
                
                <button
                  type="button"
                  onClick={handleRecommendDoctor}
                  disabled={isRecommendingDoctor || loadingDoctors}
                  className="w-full py-2 rounded-xl text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isRecommendingDoctor ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>AI Recommend Doctor based on Symptoms</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isSubmittingAppointment}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-white transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingAppointment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Booking</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookAppointmentModal(false)}
                  disabled={isSubmittingAppointment}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ENCOUNTER CLINICAL DETAILS & SUMMARY
          ========================================================================= */}
      {selectedIntakeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Clinical Encounter Details
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{selectedIntakeDetail.sessionId || selectedIntakeDetail.id}</span>
                    <span>•</span>
                    <span>{selectedIntakeDetail.formattedDate || (selectedIntakeDetail.date ? new Date(selectedIntakeDetail.date).toLocaleDateString() : 'Recent')}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIntakeDetail(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Department & Triage Priority */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">OPD Department / System</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {selectedIntakeDetail.department || selectedIntakeDetail.opdSystem || 'General OPD'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                  Priority: {selectedIntakeDetail.triageLevel || 'NORMAL'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {selectedIntakeDetail.status || 'COMPLETED'}
                </span>
              </div>
            </div>

            {/* Automatically Appointed Doctor */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-slate-50 border border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
                  {selectedIntakeDetail.opdType === 'AYUSH' ? (
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Stethoscope className="w-5 h-5 text-sky-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-sky-700">
                      Automatically Appointed Doctor
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Assigned
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-950 mt-0.5">
                    {selectedIntakeDetail.assignedDoctorName || (selectedIntakeDetail.opdType === 'AYUSH' ? 'Vaidya Rajesh Kumar' : 'Dr. Sarah Mitchell')}
                  </div>
                  <div className="text-xs text-slate-600">
                    {selectedIntakeDetail.assignedDoctorDegree || (selectedIntakeDetail.opdType === 'AYUSH' ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (General Medicine)')}
                    {selectedIntakeDetail.assignedDoctorSpecialty && selectedIntakeDetail.assignedDoctorSpecialty !== selectedIntakeDetail.assignedDoctorDegree ? ` • ${selectedIntakeDetail.assignedDoctorSpecialty}` : ''}
                  </div>
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-sky-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Consultation Room</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedIntakeDetail.assignedDoctorRoom || (selectedIntakeDetail.opdType === 'AYUSH' ? 'Room 104 (Ayush OPD)' : 'Room 202 (General OPD)')}
                </span>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Reported Chief Complaint
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-900 leading-relaxed">
                {selectedIntakeDetail.chiefComplaint || 'Consultation intake'}
              </div>
            </div>

            {/* Extracted Symptoms */}
            {Array.isArray(selectedIntakeDetail.symptoms) && selectedIntakeDetail.symptoms.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Extracted Clinical Symptoms
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIntakeDetail.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Clinical Summary */}
            {selectedIntakeDetail.aiSummary && (
              <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>AI Assistive Clinical Summary</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedIntakeDetail.aiSummary}
                </p>
              </div>
            )}

            {/* Voice Transcript (if available) */}
            {selectedIntakeDetail.voiceTranscript && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-slate-500" />
                  <span>Voice Conversation Transcript</span>
                </label>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedIntakeDetail.voiceTranscript}
                </div>
              </div>
            )}

            {/* Prescriptions / Doctor Notes (if present) */}
            {selectedIntakeDetail.doctorNotes && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Physician Consultation Notes</span>
                </div>
                <p className="text-xs text-slate-700">{selectedIntakeDetail.doctorNotes}</p>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIntakeDetail(null)}
                className="px-5 py-2 rounded-xl text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close Encounter Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: ADD MEDICAL HISTORY / ALLERGY MODAL
          ========================================================================= */}
      {showAddHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Add Medical History</h3>
                  <p className="text-[11px] text-slate-400">Record chronic conditions, illnesses, or allergies</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingHistory) {
                    setShowAddHistoryModal(false);
                    setHistoryError('');
                    setHistorySuccess('');
                  }
                }}
                disabled={isSubmittingHistory}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error / Success Messages */}
            {historyError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{historyError}</span>
              </div>
            )}
            {historySuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{historySuccess}</span>
              </div>
            )}

            {/* Selector: Condition vs Allergy */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setHistoryType('condition');
                  setHistoryError('');
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition ${
                  historyType === 'condition'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Medical Condition
              </button>
              <button
                type="button"
                onClick={() => {
                  setHistoryType('allergy');
                  setHistoryError('');
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition ${
                  historyType === 'allergy'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Allergy / Reaction
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddHistorySubmit} className="space-y-4">
              {historyType === 'condition' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Condition / Disease Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Hypertension, Type 2 Diabetes, Asthma, Thyroid"
                      value={historyForm.condition}
                      onChange={(e) => setHistoryForm((prev) => ({ ...prev, condition: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Diagnosed Year / Period
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2021 or 3 years ago"
                        value={historyForm.diagnosedYear}
                        onChange={(e) => setHistoryForm((prev) => ({ ...prev, diagnosedYear: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">Status</label>
                      <select
                        value={historyForm.status}
                        onChange={(e) => setHistoryForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Managed">Managed</option>
                        <option value="In Remission">In Remission</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Allergen / Substance <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Penicillin, Sulfa drugs, Peanuts, Latex"
                      value={historyForm.allergy}
                      onChange={(e) => setHistoryForm((prev) => ({ ...prev, allergy: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">Severity</label>
                    <select
                      value={historyForm.severity}
                      onChange={(e) => setHistoryForm((prev) => ({ ...prev, severity: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                      <option value="Life-Threatening">Life-Threatening</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Additional Notes (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="e.g., Currently under medication or causes mild hives"
                  value={historyForm.notes}
                  onChange={(e) => setHistoryForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddHistoryModal(false)}
                  disabled={isSubmittingHistory}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingHistory}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingHistory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save to History</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
