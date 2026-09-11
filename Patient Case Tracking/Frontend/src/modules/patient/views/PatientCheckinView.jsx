import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  ShieldCheck,
  Volume2,
  CheckCircle2,
  ArrowRight,
  User,
  Phone,
  Sparkles,
  Lock,
  HeartPulse,
  Leaf,
} from 'lucide-react';

/**
 * PatientCheckinView Component — Step 1: Identify & DPDP Act 2023 Consent (Module D)
 * Seamless ABHA ID verification, multilingual audio-guided consent, and clinical pathway selection.
 */
export const PatientCheckinView = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: 'Male',
    preferredLanguage: 'gu-IN',
    abhaId: '',
    opdMode: 'AYUSH', // 'AYUSH' | 'ALLOPATHIC'
    consentEhr: true,
    consentAiVoice: true,
    consentAbhaSync: true,
  });

  const [isAudioConsentPlaying, setIsAudioConsentPlaying] = useState(false);
  const [isQrScanning, setIsQrScanning] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Simulate ABHA QR scan auto-fill
  const handleScanAbhaQr = () => {
    setIsQrScanning(true);
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        fullName: 'Rameshchandra Patel',
        phone: '9825012345',
        age: '49',
        gender: 'Male',
        abhaId: '91-4432-8812-9901',
      }));
      setIsQrScanning(false);
    }, 900);
  };

  // Audio-guided consent for low-literacy patients
  const playAudioConsent = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsAudioConsentPlaying(true);

    const consentText =
      formData.preferredLanguage === 'gu-IN'
        ? 'નમસ્તે. સેહત પ્લેટફોર્મ તમારા અવાજ અને દસ્તાવેજોનું વિશ્લેષણ કરીને ડૉક્ટર માટે મેડિકલ સમરી તૈયાર કરે છે. તમારો ડેટા સુરક્ષિત છે અને માત્ર આ તપાસ પૂરતો જ ઉપયોગમાં લેવાશે. જો તમે સંમત હોવ તો આગળ વધો.'
        : formData.preferredLanguage === 'hi-IN'
        ? 'नमस्ते। सेहत आपके वॉइस और मेडिकल रिपोर्ट्स का सुरक्षित विश्लेषण करके डॉक्टर के लिए क्लिनिकल हिस्ट्री तैयार करता है। आपका डेटा पूरी तरह सुरक्षित है। आगे बढ़ने के लिए सहमति दें।'
        : 'Welcome to Sehat. We securely capture your voice history and medical documents to prepare an automated clinical summary for your physician under the DPDP Act 2023.';

    const utterance = new SpeechSynthesisUtterance(consentText);
    utterance.lang = formData.preferredLanguage;
    utterance.rate = 0.92;
    utterance.onend = () => setIsAudioConsentPlaying(false);
    utterance.onerror = () => setIsAudioConsentPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      alert('Please enter your full name and phone number.');
      return;
    }
    if (!formData.consentAiVoice) {
      alert('Consent for AI clinical processing is required to proceed.');
      return;
    }

    const sessionId = `SESSION_${Date.now().toString().slice(-6)}`;
    const sessionPayload = {
      ...formData,
      sessionId,
      checkinTime: new Date().toLocaleTimeString(),
    };

    sessionStorage.setItem('patient_session', JSON.stringify(sessionPayload));
    navigate('/patient/intake');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-sky-50 text-sky-700 ring-1 ring-sky-200 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>DPDP Act 2023 & ABDM FHIR Compliant</span>
        </div>
        <p className="text-sm font-normal text-slate-500 mb-1">Step 1 of 4 • Identify & Consent</p>
        <h1 className="text-3xl sm:text-4xl font-normal text-slate-950 tracking-tight">
          Patient Check-In & ABHA ID
        </h1>
        <p className="text-sm font-normal text-slate-500 mt-2 max-w-md mx-auto">
          Authenticate your identity, select your preferred language, and grant consent for clinical history intake.
        </p>
      </div>

      {/* Main Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] space-y-6"
      >
        {/* Preferred Language & OPD Pathway Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
              Preferred Language (ભાષા)
            </label>
            <select
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="gu-IN">Gujarati (ગુજરાતી)</option>
              <option value="hi-IN">Hindi (हिंदी)</option>
              <option value="en-IN">English</option>
              <option value="mr-IN">Marathi (मराठी)</option>
              <option value="ta-IN">Tamil (தமிழ்)</option>
              <option value="te-IN">Telugu (తెలుగు)</option>
              <option value="bn-IN">Bengali (বাংলা)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
              Clinical Pathway
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, opdMode: 'AYUSH' }))}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-normal border transition cursor-pointer ${
                  formData.opdMode === 'AYUSH'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400/40 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>AYUSH OPD</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, opdMode: 'ALLOPATHIC' }))}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-normal border transition cursor-pointer ${
                  formData.opdMode === 'ALLOPATHIC'
                    ? 'bg-sky-50 border-sky-300 text-sky-800 ring-1 ring-sky-400/40 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-sky-600" />
                <span>General OPD</span>
              </button>
            </div>
          </div>
        </div>

        {/* ABHA ID Scanner Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 to-slate-50 border border-sky-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-900">ABHA Health Card / QR</div>
              <p className="text-[11px] text-slate-500 font-normal">
                Scan your Ayushman Bharat Health Account QR for 1-tap demographic fill
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleScanAbhaQr}
            disabled={isQrScanning}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-normal text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 transition cursor-pointer shadow-2xs"
          >
            {isQrScanning ? (
              <span>Scanning ABHA...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Simulate ABHA Scan</span>
              </>
            )}
          </button>
        </div>

        {/* Full Name & ABHA ID Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
              ABHA Address / ID
            </label>
            <input
              type="text"
              name="abhaId"
              value={formData.abhaId}
              onChange={handleChange}
              placeholder="e.g. 91-4432-8812-9901 or name@abdm"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-mono font-normal focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Phone, Age & Gender Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
              Age (Years)
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g. 48"
              min="1"
              max="120"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="Male">Male (પુરુષ)</option>
              <option value="Female">Female (સ્ત્રી)</option>
              <option value="Other">Other (અન્ય)</option>
            </select>
          </div>
        </div>

        {/* Module D — DPDP Act 2023 & ABDM Granular Consent Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-medium text-slate-900 uppercase tracking-wider">
                Consent & Privacy Declaration (DPDP Act 2023)
              </span>
            </div>

            <button
              type="button"
              onClick={playAudioConsent}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isAudioConsentPlaying ? 'Playing Consent Audio...' : 'Audio Explanation'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
            I hereby authorize Sehat to process my spoken symptom answers, digitize previous clinical reports, and compile an EHR summary for my treating physician. Temporary audio streams are purged immediately upon session completion.
          </p>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-normal text-slate-700">
              <input
                type="checkbox"
                name="consentAiVoice"
                checked={formData.consentAiVoice}
                onChange={handleChange}
                className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                required
              />
              <span>I consent to AI conversational voice intake & clinical history structuring *</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-normal text-slate-700">
              <input
                type="checkbox"
                name="consentAbhaSync"
                checked={formData.consentAbhaSync}
                onChange={handleChange}
                className="w-4 h-4 rounded text-slate-900 accent-slate-900"
              />
              <span>Link generated clinical summary to my ABHA Health Record via ABDM FHIR gateway</span>
            </label>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-full text-sm font-normal text-white bg-slate-950 hover:bg-slate-850 active:scale-98 transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
        >
          <span>Begin Multimodal Clinical Intake</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default PatientCheckinView;
