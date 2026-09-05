import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  FileText,
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { VoiceRecorder } from '../../../components/VoiceRecorder';
import { DocumentUploadZone } from '../components/DocumentUploadZone';
import { AYUSH_DASHAPARIKSHA_FRAMEWORK } from '../../../constants/ayushPariksha';

/**
 * PatientIntakeView Component — Step 2 & 3: Multimodal Conversational History & Document AI
 * Implements Module A (Voice + Touch SOCRATES intake), AYUSH Dashavidha Pariksha, and Module B Document-AI OCR.
 */
export const PatientIntakeView = () => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState({
    fullName: 'Ramesh Patel',
    phone: '9876543210',
    preferredLanguage: 'gu-IN',
    sessionId: 'DEMO_GUJARATI_001',
    opdMode: 'AYUSH',
    abhaId: '91-4432-8812-9901',
  });

  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'ayush' | 'documents'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [ocrData, setOcrData] = useState(null);

  // Dashavidha Pariksha state (Ayurvedic OPD Mode)
  const [ayushAssessments, setAyushAssessments] = useState({
    prakriti: 'vata_pitta',
    vikriti: 'vata_vriddhi',
    sara: 'madhyama',
    samhanana: 'susamhata',
    satmya: 'sarva_rasa',
    ahara_shakti: 'vishamagni',
    vyayama_shakti: 'madhyama',
    vaya: 'madhyama',
    aharaHabits: 'Vegetarian, hot water, morning tea, late night dinners',
    viharaHabits: 'Desk job, irregular sleep, low physical exercise',
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('patient_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPatientData(parsed);
        if (parsed.opdMode === 'AYUSH') {
          setActiveTab('voice');
        }
      } catch (err) {
        console.error('Failed to parse patient session:', err);
      }
    }
  }, []);

  const handleParikshaSelect = (field, optionId) => {
    setAyushAssessments((prev) => ({
      ...prev,
      [field]: optionId,
    }));
  };

  const handleFinishIntake = () => {
    const structuredSummary = {
      ...patientData,
      uploadedCount: uploadedFiles.length,
      ocrData: ocrData,
      ayushAssessments: patientData.opdMode === 'AYUSH' ? ayushAssessments : null,
      intakeTime: new Date().toLocaleTimeString(),
    };

    sessionStorage.setItem('patient_summary', JSON.stringify(structuredSummary));
    navigate('/patient/success');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header Info */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-slate-100 text-slate-700 mb-2">
          {patientData.opdMode === 'AYUSH' ? (
            <>
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>AYUSH OPD Intake (Dashavidha Pariksha Active)</span>
            </>
          ) : (
            <>
              <HeartPulse className="w-3.5 h-3.5 text-sky-600" />
              <span>General Allopathic OPD Intake</span>
            </>
          )}
        </div>

        <p className="text-sm font-normal text-slate-500 mb-1">Step 2 of 4 • Conversational & Document Intake</p>
        <h1 className="text-3xl sm:text-4xl font-normal text-slate-950 tracking-tight">
          Clinical History Intake
        </h1>
        <p className="text-sm font-normal text-slate-500 mt-2">
          Patient: <strong className="text-slate-900 font-medium">{patientData.fullName}</strong> • ABHA:{' '}
          <span className="font-mono text-xs text-slate-700">{patientData.abhaId || 'Linked'}</span>
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setActiveTab('voice')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-normal transition cursor-pointer ${
            activeTab === 'voice'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Multimodal Voice & Touch</span>
        </button>

        {patientData.opdMode === 'AYUSH' && (
          <button
            onClick={() => setActiveTab('ayush')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-normal transition cursor-pointer ${
              activeTab === 'ayush'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-300" />
            <span>Dashavidha Pariksha (10-Fold)</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('documents')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-normal transition cursor-pointer ${
            activeTab === 'documents'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Scan Reports ({uploadedFiles.length})</span>
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] mb-8">
        {/* TAB 1: Voice & Touch Dual-Mode Engine */}
        {activeTab === 'voice' && (
          <div>
            <div className="text-center mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Module A: Adaptive Clinical Voice & Touch History
              </span>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                Speak freely in your language or tap quick answer chips. Red flags auto-trigger priority triage.
              </p>
            </div>

            <VoiceRecorder
              sessionId={patientData.sessionId}
              patientId={patientData.phone}
              defaultLanguage={patientData.preferredLanguage}
              opdMode={patientData.opdMode}
              onClinicalStateUpdated={(state) => {
                sessionStorage.setItem('sehat_clinical_state', JSON.stringify(state));
                sessionStorage.setItem('medikiosk_clinical_state', JSON.stringify(state));
              }}
              onFinishIntake={handleFinishIntake}
            />
          </div>
        )}

        {/* TAB 2: AYUSH Dashavidha Pariksha Assessment Panel */}
        {activeTab === 'ayush' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-normal text-slate-950 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>Dashavidha Pariksha & Ahara-Vihara Assessment</span>
                </h2>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  CCRAS & Ministry of Ayush standardized 10-fold clinical constitutional intake.
                </p>
              </div>

              <span className="text-[11px] font-normal bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                Ayurvedic OPD Protocol
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prakriti */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-xs font-medium text-slate-900 block">
                  {AYUSH_DASHAPARIKSHA_FRAMEWORK.prakriti.title}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AYUSH_DASHAPARIKSHA_FRAMEWORK.prakriti.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleParikshaSelect('prakriti', opt.id)}
                      className={`p-2 rounded-xl text-xs text-left border transition cursor-pointer ${
                        ayushAssessments.prakriti === opt.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-medium text-[11px] truncate">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vikriti */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-xs font-medium text-slate-900 block">
                  {AYUSH_DASHAPARIKSHA_FRAMEWORK.vikriti.title}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AYUSH_DASHAPARIKSHA_FRAMEWORK.vikriti.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleParikshaSelect('vikriti', opt.id)}
                      className={`p-2 rounded-xl text-xs text-left border transition cursor-pointer ${
                        ayushAssessments.vikriti === opt.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-medium text-[11px] truncate">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ahara Shakti */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-xs font-medium text-slate-900 block">
                  {AYUSH_DASHAPARIKSHA_FRAMEWORK.ahara_shakti.title}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AYUSH_DASHAPARIKSHA_FRAMEWORK.ahara_shakti.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleParikshaSelect('ahara_shakti', opt.id)}
                      className={`p-2 rounded-xl text-xs text-left border transition cursor-pointer ${
                        ayushAssessments.ahara_shakti === opt.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-medium text-[11px] truncate">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vyayama Shakti */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-xs font-medium text-slate-900 block">
                  {AYUSH_DASHAPARIKSHA_FRAMEWORK.vyayama_shakti.title}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {AYUSH_DASHAPARIKSHA_FRAMEWORK.vyayama_shakti.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleParikshaSelect('vyayama_shakti', opt.id)}
                      className={`p-2 rounded-xl text-xs text-center border transition cursor-pointer ${
                        ayushAssessments.vyayama_shakti === opt.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-medium text-[11px] truncate">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ahara & Vihara Routine Assessment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                  Ahara Assessment (Dietary Patterns & Timings)
                </label>
                <textarea
                  rows="2"
                  value={ayushAssessments.aharaHabits}
                  onChange={(e) => setAyushAssessments((p) => ({ ...p, aharaHabits: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                  Vihara Assessment (Sleep, Stress, Physical Activity)
                </label>
                <textarea
                  rows="2"
                  value={ayushAssessments.viharaHabits}
                  onChange={(e) => setAyushAssessments((p) => ({ ...p, viharaHabits: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Document Upload & Live OCR Extraction Panel */}
        {activeTab === 'documents' && (
          <div>
            <div className="text-center mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Module B: Physical Prescription & Lab Report Digitization
              </span>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                AI extracts dosages, flags abnormal lab ranges, and constructs an interactive medical timeline.
              </p>
            </div>

            <DocumentUploadZone
              onFilesSelected={(files) => setUploadedFiles(files)}
              onOcrExtracted={(data) => setOcrData(data)}
            />
          </div>
        )}
      </div>

      {/* Action Footer Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/patient/register')}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-normal text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Check-in</span>
        </button>

        <button
          onClick={handleFinishIntake}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-normal text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-sm"
        >
          <span>Complete Intake & Push to Physician HIS</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PatientIntakeView;
