import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Volume2,
  ShieldCheck,
  FileCheck2,
  QrCode,
  HeartPulse,
  Leaf,
  Clock,
  Sparkles,
} from 'lucide-react';

/**
 * PatientSuccessView Component — Step 4: Summarize & Route (Module C & D)
 * Displays OPD queue token, FHIR bundle push status, ABHA link confirmation,
 * and regional audio summary playback.
 */
export const PatientSuccessView = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    fullName: 'Ramesh Patel',
    phone: '9876543210',
    sessionId: 'SESSION_448102',
    preferredLanguage: 'gu-IN',
    opdMode: 'AYUSH',
    abhaId: '91-4432-8812-9901',
    uploadedCount: 1,
    intakeTime: new Date().toLocaleTimeString(),
  });

  const [isPlayingAudioSummary, setIsPlayingAudioSummary] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('patient_summary');
    if (saved) {
      try {
        setSummary(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse summary:', err);
      }
    }
  }, []);

  const tokenNumber = `TK-${Math.floor(Math.random() * 80 + 101)}`;

  const playAudioSummary = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlayingAudioSummary(true);

    const lang = summary.preferredLanguage || 'gu-IN';
    const text =
      lang === 'gu-IN'
        ? `નમસ્તે શ્રીમાન ${summary.fullName}. તમારી ક્લિનિકલ વિગતો ડૉક્ટરની કન્સલ્ટેશન સ્ક્રીન પર મોકલી દેવાઈ છે. તમારો ટોકન નંબર ${tokenNumber} છે. કૃપા કરીને રૂમ નંબર 104 ની બહાર પ્રતીક્ષા કરો.`
        : `नमस्ते श्री ${summary.fullName}. आपका स्वास्थ्य विवरण डॉक्टर के परामर्श डैशबोर्ड पर भेज दिया गया है। आपका टोकन नंबर ${tokenNumber} है।`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.92;
    utterance.onend = () => setIsPlayingAudioSummary(false);
    utterance.onerror = () => setIsPlayingAudioSummary(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 text-center">
      {/* Success Badge */}
      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-xs">
        <Check className="w-7 h-7 stroke-[2.5]" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Pushed to HIS & ABHA Personal Health Record</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-normal text-slate-950 tracking-tight mb-1.5">
        Intake Completed Successfully
      </h1>
      <p className="text-sm font-normal text-slate-500 max-w-md mx-auto mb-6">
        Your structured clinical history and digitized records are now live on the physician's OPD consultation screen.
      </p>

      {/* OPD Queue Token Card */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.05)] text-left space-y-6 mb-6">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Live OPD Token Number
            </div>
            <div className="text-3xl sm:text-4xl font-normal text-slate-950 mt-0.5 tracking-tight">
              {tokenNumber}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Assigned Consultation
            </div>
            <div className="text-base font-normal text-slate-800 mt-0.5 flex items-center gap-1.5 justify-end">
              {summary.opdMode === 'AYUSH' ? (
                <>
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>Room 104 (Ayush OPD)</span>
                </>
              ) : (
                <>
                  <HeartPulse className="w-4 h-4 text-sky-600" />
                  <span>Room 202 (General OPD)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Patient Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-normal text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Patient Name</span>
            <span className="text-slate-900 font-medium text-sm truncate block">{summary.fullName}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">ABHA ID</span>
            <span className="font-mono text-slate-900 text-xs truncate block">{summary.abhaId || 'Linked'}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Check-in Time</span>
            <span className="text-slate-900 font-medium">{summary.intakeTime}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Reports Attached</span>
            <span className="text-slate-900 font-medium">{summary.uploadedCount || 1} Document(s)</span>
          </div>
        </div>

        {/* Audio Confirmation & ABDM FHIR Link Badge */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-normal text-slate-700">
            <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>FHIR Bundle (v4.0.1) generated & ready for Physician review</span>
          </div>

          <button
            type="button"
            onClick={playAudioSummary}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-normal text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isPlayingAudioSummary ? 'Speaking...' : 'Audio Confirmation (ગુજરાતી)'}</span>
          </button>
        </div>

        {/* Waiting instruction */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs font-normal text-amber-900 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Estimated wait: ~8-12 minutes. Please proceed to the waiting area outside Room 104.</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          onClick={() => navigate(`/doctor/cases/${summary.sessionId}`)}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-normal text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-sm"
        >
          <span>Open Physician Consultation EMR Screen</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/patient/register')}
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full text-sm font-normal text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Patient Intake</span>
        </button>
      </div>
    </div>
  );
};

export default PatientSuccessView;
