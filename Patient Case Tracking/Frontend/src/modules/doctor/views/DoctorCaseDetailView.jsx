import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Check,
  Clock,
  Sparkles,
  MessageSquare,
  Pill,
  FileText,
  Activity,
  User,
  Share2,
} from 'lucide-react';
import { PatientOverview } from '../components/PatientOverview';
import { PriorityTriageAlert } from '../components/PriorityTriageAlert';
import { ClinicalHistory } from '../components/ClinicalHistory';
import { MedicalDocuments } from '../components/MedicalDocuments';
import { ClinicalSummary } from '../components/ClinicalSummary';
import { DoctorActions } from '../components/DoctorActions';
import { ConversationHistory } from '../components/ConversationHistory';
import { PrescriptionBuilder } from '../components/PrescriptionBuilder';
import { CaseTransferModal } from '../components/CaseTransferModal';
import { SkeletonCaseDetail } from '../../../components/ui';
import {
  getPatientById,
  getNextWaitingPatient,
  updatePatientStatus,
} from '../services/doctorDashboardService';

/**
 * DoctorCaseDetailView Component
 * Comprehensive physician examination & clinical case workspace.
 * Features:
 * - Patient Demographics & ABHA Identity
 * - AI Physician Summary & Verification Notice
 * - Turn-by-Turn Patient-AI Dialogue History
 * - Interactive Structured Prescription Builder with Clinical Templates
 * - Diagnostic Medical Documents with OCR Findings
 * - Clinical Case Transfer Modal
 * - Encounter Digital Signature & OPD Archive sync
 */
export const DoctorCaseDetailView = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [nextPatient, setNextPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [doctorRxNotes, setDoctorRxNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'prescriptions' | 'conversation' | 'history' | 'documents'

  // Load patient case bundle from service
  useEffect(() => {
    let isMounted = true;
    const loadCase = async () => {
      setLoading(true);
      try {
        const found = await getPatientById(sessionId);
        const next = await getNextWaitingPatient();
        if (isMounted) {
          setPatient(found);
          setNextPatient(next && next.sessionId !== sessionId ? next : null);
          setDoctorRxNotes(found?.doctorRxNotes || '');
          setPrescriptions(
            found?.prescriptions && found.prescriptions.length > 0
              ? found.prescriptions
              : [
                  {
                    medicine_name: 'Paracetamol 650mg',
                    generic_name: 'Acetaminophen',
                    dosage: '650 mg',
                    frequency: 'Three times daily (TDS)',
                    route: 'Oral',
                    duration: '5 days',
                    before_after_food: 'AFTER_FOOD',
                    instructions: 'Take after meals for fever/pain',
                  },
                ]
          );
          setIsVerified(found?.status === 'APPROVED' || found?.status === 'COMPLETED');
        }
      } catch (err) {
        console.error('Failed to load patient case:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCase();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const handleHistoryChange = (field, value) => {
    setPatient((prev) => ({
      ...prev,
      history: {
        ...prev?.history,
        [field]: value,
      },
    }));
  };

  const handleSignAndComplete = async () => {
    if (!patient) return;
    try {
      await updatePatientStatus(patient.sessionId, 'APPROVED', doctorRxNotes, prescriptions);
      setIsVerified(true);
      setIsEditing(false);
      setPatient((prev) => ({
        ...prev,
        status: 'APPROVED',
        doctorRxNotes,
        prescriptions,
      }));
      setTimeout(() => {
        alert(
          `Consultation completed for ${patient.patientName} (${patient.token}). Encounter digitally signed and archived.`
        );
      }, 300);
    } catch (err) {
      console.error('Error signing consultation:', err);
    }
  };

  const handleCallNext = () => {
    if (nextPatient) {
      navigate(`/doctor/cases/${nextPatient.sessionId || nextPatient.id}`);
    } else {
      navigate('/doctor');
    }
  };

  const handleTransferSuccess = (toDoctorId, reason) => {
    alert(`Case successfully transferred to Dr. ${toDoctorId}. Handover logged in audit trail.`);
    navigate('/doctor');
  };

  if (loading) {
    return <SkeletonCaseDetail />;
  }

  if (!patient) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3 max-w-md mx-auto my-12">
        <p className="text-sm font-semibold text-slate-800">Patient case record not found.</p>
        <p className="text-xs text-slate-500">
          The requested session may have expired, been transferred, or does not exist.
        </p>
        <button
          onClick={() => navigate('/doctor')}
          className="px-5 py-2.5 rounded-full text-xs font-medium bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer"
        >
          Return to Live OPD Queue
        </button>
      </div>
    );
  }

  const isRedFlag =
    patient.triageLevel === 'RED_FLAG' ||
    patient.triage === 'red-flag' ||
    patient.triageLevel === 'HIGH' ||
    patient.triageLevel === 'EMERGENCY';

  return (
    <div className="w-full max-w-full mx-auto space-y-6">
      {/* 1. Action Toolbar */}
      <DoctorActions
        onBack={() => navigate('/doctor')}
        onPrint={() => window.print()}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        isVerified={isVerified}
        onSignAndComplete={handleSignAndComplete}
        onCallNext={handleCallNext}
        nextPatientToken={nextPatient?.token}
        onTransfer={() => setIsTransferModalOpen(true)}
      />

      {/* 2. Priority Triage Alert Banner (for genuine Red-Flag cases) */}
      {isRedFlag && (
        <PriorityTriageAlert
          reason={
            patient.priorityAlertReason ||
            patient.chiefComplaint ||
            'Acute respiratory distress or critical clinical risk detected during intake.'
          }
        />
      )}

      {/* 3. Patient Demographics & ABHA Information Header */}
      <PatientOverview patient={patient} />

      {/* 4. Clinical Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'summary'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Clinical Summary & Notes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'prescriptions'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Prescriptions & Regimen</span>
          {prescriptions.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white">
              {prescriptions.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('conversation')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'conversation'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Intake Dialogue History</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Structured History & AYUSH</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'documents'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Uploaded Documents & OCR</span>
          {patient.documents?.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500 text-white">
              {patient.documents.length}
            </span>
          )}
        </button>
      </div>

      {/* 5. Examination Tab Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main 2/3 Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'summary' && (
            <>
              <ClinicalSummary
                summary={patient.aiClinicalSummary}
                doctorRxNotes={doctorRxNotes}
                onNotesChange={setDoctorRxNotes}
                isEditing={isEditing}
              />
              <PrescriptionBuilder
                prescriptions={prescriptions}
                onPrescriptionsChange={setPrescriptions}
                isEditing={isEditing}
              />
            </>
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionBuilder
              prescriptions={prescriptions}
              onPrescriptionsChange={setPrescriptions}
              isEditing={isEditing}
            />
          )}

          {activeTab === 'conversation' && (
            <ConversationHistory
              messages={patient.conversationMessages || []}
              patientLanguage={patient.language || 'gu-IN'}
            />
          )}

          {activeTab === 'history' && (
            <ClinicalHistory
              history={patient.history}
              ayushPariksha={patient.ayushPariksha}
              isEditing={isEditing}
              onChange={handleHistoryChange}
            />
          )}

          {activeTab === 'documents' && (
            <MedicalDocuments documents={patient.documents} />
          )}
        </div>

        {/* Side 1/3 Summary & Sign-off Column */}
        <div className="space-y-6">
          {/* Quick Documents Preview Card (if not on documents tab) */}
          {activeTab !== 'documents' && (
            <MedicalDocuments documents={patient.documents} />
          )}

          {/* Quick Intake Dialogue Teaser (if not on conversation tab) */}
          {activeTab !== 'conversation' && (
            <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  <span>Intake Dialogue</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('conversation')}
                  className="text-[11px] font-medium text-sky-600 hover:text-sky-700 cursor-pointer"
                >
                  View Full Transcript →
                </button>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                Chief complaint captured: "{patient.chiefComplaint || 'Clinical evaluation requested'}"
              </p>
            </div>
          )}

          {/* Physician Consultation Sign-Off Card */}
          <div className="bg-slate-950 text-white rounded-[24px] p-5 sm:p-6 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Physician Consultation Sign-off
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
              Confirming this record applies your authenticated clinical digital signature, saves prescribed therapies, resolves active triage flags, and syncs with the central OPD register.
            </p>

            <button
              type="button"
              onClick={handleSignAndComplete}
              disabled={isVerified}
              className={`w-full py-3 rounded-full text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                isVerified
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-white text-slate-950 hover:bg-slate-100 active:scale-95'
              }`}
            >
              <Check className={`w-4 h-4 ${isVerified ? 'text-white' : 'text-emerald-600'}`} />
              <span>{isVerified ? 'Encounter Signed & Synced' : 'Sign & Complete Consultation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Case Transfer Modal */}
      <CaseTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        caseId={patient.sessionId}
        sessionId={patient.sessionId}
        patientName={patient.patientName}
        token={patient.token}
        onTransferSuccess={handleTransferSuccess}
      />
    </div>
  );
};

export default DoctorCaseDetailView;
