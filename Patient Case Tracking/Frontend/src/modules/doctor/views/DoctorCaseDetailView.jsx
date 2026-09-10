import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Check, Clock } from 'lucide-react';
import { PatientOverview } from '../components/PatientOverview';
import { PriorityTriageAlert } from '../components/PriorityTriageAlert';
import { ClinicalHistory } from '../components/ClinicalHistory';
import { MedicalDocuments } from '../components/MedicalDocuments';
import { ClinicalSummary } from '../components/ClinicalSummary';
import { DoctorActions } from '../components/DoctorActions';
import {
  getPatientById,
  getNextWaitingPatient,
  updatePatientStatus,
} from '../services/doctorDashboardService';

/**
 * DoctorCaseDetailView Component
 * Comprehensive physician examination screen.
 * Dynamically loads patient records via doctorDashboardService.
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

  // Load patient case from service
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
        ...prev.history,
        [field]: value,
      },
    }));
  };

  const handleSignAndComplete = async () => {
    if (!patient) return;
    try {
      await updatePatientStatus(patient.sessionId, 'APPROVED', doctorRxNotes);
      setIsVerified(true);
      setIsEditing(false);
      setPatient((prev) => ({
        ...prev,
        status: 'APPROVED',
        doctorRxNotes,
      }));
      setTimeout(() => {
        alert(
          `Consultation completed for ${patient.patientName} (${patient.token}). Record signed and synced.`
        );
      }, 300);
    } catch (err) {
      console.error('Error signing consultation:', err);
    }
  };

  const handleCallNext = () => {
    if (nextPatient) {
      navigate(`/doctor/cases/${nextPatient.sessionId}`);
    } else {
      navigate('/doctor');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500 font-normal">Loading patient case record...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <p className="text-sm text-slate-700">Patient case not found.</p>
        <button
          onClick={() => navigate('/doctor')}
          className="px-4 py-2 rounded-full text-xs bg-slate-950 text-white"
        >
          Return to Live OPD Queue
        </button>
      </div>
    );
  }

  const isRedFlag =
    patient.triageLevel === 'RED_FLAG' ||
    patient.triage === 'red-flag' ||
    patient.triageLevel === 'HIGH';

  return (
    <div className="w-full max-w-full mx-auto space-y-6">
      {/* 1. Header Action Bar */}
      <DoctorActions
        onBack={() => navigate('/doctor')}
        onPrint={() => window.print()}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        isVerified={isVerified}
        onSignAndComplete={handleSignAndComplete}
        onCallNext={handleCallNext}
        nextPatientToken={nextPatient?.token}
      />

      {/* 2. Priority Triage Warning Banner (if Red-Flag) */}
      {isRedFlag && (
        <PriorityTriageAlert
          reason={
            patient.priorityAlertReason ||
            patient.chiefComplaint ||
            'Acute respiratory distress or critical discomfort reported.'
          }
        />
      )}

      {/* 3. Patient Overview / Demographics Bar */}
      <PatientOverview patient={patient} />

      {/* 4. Examination Grid (2/3 Clinical History & Summary, 1/3 Documents & Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Structured History */}
          <ClinicalHistory
            history={patient.history}
            ayushPariksha={patient.ayushPariksha}
            isEditing={isEditing}
            onChange={handleHistoryChange}
          />

          {/* AI Clinical Summary & Doctor Rx */}
          <ClinicalSummary
            summary={patient.aiClinicalSummary}
            doctorRxNotes={doctorRxNotes}
            onNotesChange={setDoctorRxNotes}
            isEditing={isEditing}
          />
        </div>

        {/* Side Column (1/3) */}
        <div className="space-y-6">
          {/* Diagnostic Reports & Extracted Values */}
          <MedicalDocuments documents={patient.documents} />

          {/* Physician Consultation Sign-Off Card */}
          <div className="bg-slate-950 text-white rounded-[24px] p-5 sm:p-6 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Physician Consultation Sign-off
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
              Confirming this record finalizes the consultation summary, applies your digital clinical signature, and archives the case to the OPD register.
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
    </div>
  );
};

export default DoctorCaseDetailView;
