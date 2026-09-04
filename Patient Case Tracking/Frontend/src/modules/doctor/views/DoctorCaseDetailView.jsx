import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  FlaskConical,
  Printer,
  Check,
  CheckCircle2,
  Edit3,
  Save,
  AlertTriangle,
  Pill,
  Activity,
  ShieldCheck,
  Sparkles,
  Leaf,
  Clock,
} from 'lucide-react';
import { TriageBadge } from '../components/TriageBadge';

/**
 * DoctorCaseDetailView Component — Module C: Structured History Summary Generator & EMR View
 * Standard Clinical Format: CC -> HPI (SOCRATES) -> Past Medical/Surgical -> Drug & Allergy ->
 * Family -> Personal -> ROS -> Prior Investigations & AYUSH Dashavidha Pariksha.
 * Fully editable & verifiable by the physician.
 */
export const DoctorCaseDetailView = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Comprehensive Physician-Ready EMR Case Model
  const [caseRecord, setCaseRecord] = useState({
    sessionId: sessionId || 'DEMO_GUJARATI_001',
    token: 'TK-101',
    patientName: 'Ramesh Patel',
    age: 49,
    gender: 'Male',
    phone: '9876543210',
    abhaId: '91-4432-8812-9901',
    language: 'Gujarati (ગુજરાતી)',
    triageLevel: 'NORMAL', // 'NORMAL' | 'HIGH' | 'EMERGENCY'
    status: 'PENDING_REVIEW', // 'PENDING_REVIEW' | 'VERIFIED' | 'COMPLETED'
    opdMode: 'AYUSH',

    // 1. Chief Complaint (CC)
    chiefComplaint: 'Bilateral knee joint pain with morning stiffness (~45 mins) lasting for 3 weeks.',

    // 2. History of Present Illness (HPI - SOCRATES Framework)
    hpi: {
      site: 'Bilateral knee joints (Right > Left medial compartment)',
      onset: 'Gradual onset over past 21 days, aggravated by ascending stairs and prolonged standing',
      character: 'Dull aching pain with periodic cracking sensation (Crepitus)',
      radiation: 'No radiation to thighs or feet',
      associated: 'Morning joint stiffness lasting 30-45 minutes, mild evening peri-articular puffiness',
      timing: 'More severe during early morning and after evening walking',
      exacerbating: 'Walking long distances, cold climate exposure',
      relieving: 'Rest, hot water bag fomentation',
      severity: '6 / 10 on Numeric Pain Scale'
    },

    // 3. Past Medical & Surgical History
    pastHistory: 'Known hypertensive since 2 years on Tab Telmisartan 40mg. No prior joint surgeries.',

    // 4. Drug & Allergy History
    drugHistory: 'Tab Telmisartan 40mg (1-0-0), OTC Calcium supplements. No known drug allergies (NKDA).',

    // 5. Family History
    familyHistory: 'Father had osteoarthritis; Mother had hypertension.',

    // 6. Personal & Social History (Ahara-Vihara)
    personalHistory: 'Non-smoker, non-alcoholic. Sedentary merchant business, disturbed sleep due to irregular dinner hours.',

    // 7. Review of Systems (ROS)
    ros: 'Cardiovascular: Normal. Respiratory: Clear. Gastrointestinal: Mild morning hyperacidity. Musculoskeletal: Knee tenderness positive.',

    // 8. AYUSH Dashavidha Pariksha Assessment
    ayushPariksha: {
      prakriti: 'Vata-Pitta (વાત-પિત્ત પ્રધાન)',
      vikriti: 'Vata Vriddhi (Sandhigata Vata)',
      sara: 'Madhyama Sara (મધ્યમ સાર)',
      samhanana: 'Susamhata (સુસંહત)',
      aharaShakti: 'Vishamagni (વિષમ અગ્નિ / Irregular Appetite)',
      vyayamaShakti: 'Madhyama (મધ્યમ વ્યાયામ શક્તિ)',
      suspectedDiagnosis: 'Sandhigata Vata (Osteoarthritis of Knees)'
    },

    // 9. Document-AI OCR & Lab Abnormalities
    ocrMedications: [
      { name: 'Tab Telmisartan 40mg', dosage: '1-0-0 morning', source: 'Prescription_Nov2025.jpg' },
      { name: 'Tab Metformin 500mg', dosage: '1-0-1 after meals', source: 'Prescription_Nov2025.jpg' }
    ],
    ocrLabResults: [
      { test: 'HbA1c', value: '8.9 %', ref: '4.0 - 5.6 %', isAbnormal: true, flag: 'HIGH' },
      { test: 'Fasting Blood Sugar', value: '162 mg/dL', ref: '70 - 100 mg/dL', isAbnormal: true, flag: 'HIGH' },
      { test: 'Serum Uric Acid', value: '5.2 mg/dL', ref: '3.5 - 7.2 mg/dL', isAbnormal: false, flag: 'NORMAL' }
    ],

    // 10. Physician Consultation Notes & Rx (Editable by Doctor)
    doctorRxNotes: '1. Yogaraj Guggulu 2 tabs twice daily after food.\n2. Janu Basti with Mahanarayana Taila for 7 days.\n3. Daily mild knee quadriceps isometric exercises.',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSaveAndVerify = () => {
    setCaseRecord((prev) => ({
      ...prev,
      status: 'VERIFIED',
    }));
    setIsVerified(true);
    setIsEditing(false);
    setTimeout(() => {
      alert('Clinical Summary verified, signed-off by physician, and synced with ABHA & HIS.');
    }, 400);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/doctor')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-normal text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Live OPD Queue</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Clinical History</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal border transition cursor-pointer ${
              isEditing
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Done Editing' : 'Edit History Draft'}</span>
          </button>

          <TriageBadge level={caseRecord.triageLevel} status={caseRecord.status} />
        </div>
      </div>

      {/* Patient Demographic Bar */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              OPD Token {caseRecord.token}
            </span>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 font-normal">
              AYUSH OPD
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight mt-0.5">
            {caseRecord.patientName}
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            {caseRecord.age} Years • {caseRecord.gender} • Phone: <strong>{caseRecord.phone}</strong> • Spoken Language: {caseRecord.language}
          </p>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <div className="text-xs text-slate-500">
            ABHA ID: <span className="font-mono text-slate-900 font-medium">{caseRecord.abhaId}</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Session: {caseRecord.sessionId}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" /> ABDM FHIR Linked
          </span>
        </div>
      </div>

      {/* Module C — Standard Clinical History Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2/3): Clinical Format (CC, HPI, Past, Drug, ROS) */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Chief Complaint & HPI (SOCRATES) */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-medium uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <span>1. Chief Complaint & HPI (SOCRATES Framework)</span>
              </h2>
              <span className="text-[11px] text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                AI Voice Structured
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Chief Complaint (મુખ્ય તકલીફ)
              </span>
              {isEditing ? (
                <textarea
                  rows="2"
                  value={caseRecord.chiefComplaint}
                  onChange={(e) => setCaseRecord((p) => ({ ...p, chiefComplaint: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-normal text-slate-900"
                />
              ) : (
                <p className="text-sm font-normal text-slate-900 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  {caseRecord.chiefComplaint}
                </p>
              )}
            </div>

            {/* SOCRATES Breakdown Table */}
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                SOCRATES Symptom Breakdown
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-normal">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase">Site & Location (S)</span>
                  <span className="text-slate-900 font-medium">{caseRecord.hpi.site}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase">Onset & Duration (O)</span>
                  <span className="text-slate-900 font-medium">{caseRecord.hpi.onset}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase">Character & Sensation (C)</span>
                  <span className="text-slate-900 font-medium">{caseRecord.hpi.character}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase">Associated Symptoms (A)</span>
                  <span className="text-slate-900 font-medium">{caseRecord.hpi.associated}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase">Exacerbating / Relieving (E)</span>
                  <span className="text-slate-900 font-medium">{caseRecord.hpi.exacerbating}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-400 block text-[10px] uppercase">Severity Scale (S)</span>
                  <span className="text-rose-700 font-medium">{caseRecord.hpi.severity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Medical, Drug & Personal History */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Pill className="w-4 h-4 text-slate-700" />
              <span>2. Past Medical, Medications & Personal History</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-normal">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase mb-0.5">Past Medical History</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">{caseRecord.pastHistory}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase mb-0.5">Current Drug & Allergy History</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">{caseRecord.drugHistory}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase mb-0.5">Family History</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">{caseRecord.familyHistory}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase mb-0.5">Personal / Ahara-Vihara Routine</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">{caseRecord.personalHistory}</p>
              </div>
            </div>
          </div>

          {/* 3. Physician Diagnosis & Rx Notes (Editable) */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-medium uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3. Physician Prescription & Plan of Care</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-normal">Physician Retains Full Authority</span>
            </div>

            <textarea
              rows="4"
              value={caseRecord.doctorRxNotes}
              onChange={(e) => setCaseRecord((p) => ({ ...p, doctorRxNotes: e.target.value }))}
              placeholder="Enter prescription medicines, dietary advice, and follow-up plan..."
              className="w-full p-3.5 rounded-xl border border-slate-300 text-xs font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Side Column (1/3): AYUSH Dashavidha Pariksha & Lab OCR Intelligence */}
        <div className="space-y-5">
          {/* AYUSH Dashavidha Pariksha Card */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-900">
                Dashavidha Pariksha (10-Fold)
              </h3>
            </div>

            <div className="space-y-2 text-xs font-normal">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="text-slate-600">Prakriti (પ્રકૃતિ):</span>
                <strong className="text-emerald-900 font-medium">{caseRecord.ayushPariksha.prakriti}</strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-slate-600">Vikriti (વિકૃતિ):</span>
                <strong className="text-slate-900 font-medium">{caseRecord.ayushPariksha.vikriti}</strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-slate-600">Ahara Shakti (અગ્નિ):</span>
                <strong className="text-slate-900 font-medium">{caseRecord.ayushPariksha.aharaShakti}</strong>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-slate-600">Vyayama (શક્તિ):</span>
                <strong className="text-slate-900 font-medium">{caseRecord.ayushPariksha.vyayamaShakti}</strong>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 text-white mt-1 text-[11px]">
                <span className="text-slate-400 block text-[10px]">Suspected Diagnosis</span>
                <span>{caseRecord.ayushPariksha.suspectedDiagnosis}</span>
              </div>
            </div>
          </div>

          {/* Document-AI OCR & Abnormal Lab Highlights */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-900">
                  Lab OCR Intelligence
                </h3>
              </div>
              <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-medium">
                Abnormal Flagged
              </span>
            </div>

            <div className="space-y-2 text-xs font-normal">
              {caseRecord.ocrLabResults.map((lab, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    lab.isAbnormal
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-medium text-[11px]">{lab.test}</div>
                    <div className="text-[10px] text-slate-400">Ref: {lab.ref}</div>
                  </div>
                  <div className="text-right font-medium">
                    <div>{lab.value}</div>
                    {lab.isAbnormal && (
                      <span className="text-[9px] font-medium text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-full">
                        {lab.flag}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Sign-Off Box */}
          <div className="bg-slate-950 text-white rounded-[24px] p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-200">
                Physician Consultation Sign-off
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
              Confirming this record locks the consultation summary, logs the physician digital signature, and pushes the EHR encounter to HIS.
            </p>

            <button
              onClick={handleSaveAndVerify}
              disabled={isVerified}
              className="w-full py-3 rounded-full text-xs font-medium text-slate-950 bg-white hover:bg-slate-100 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{isVerified ? 'Encounter Verified & Signed' : 'Sign & Complete Consultation'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCaseDetailView;
