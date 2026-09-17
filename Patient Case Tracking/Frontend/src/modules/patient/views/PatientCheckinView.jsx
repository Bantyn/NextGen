import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  Lock,
  HeartPulse,
  Leaf,
  Loader2,
  RotateCcw,
  Mic,
  MicOff,
  Check,
  X,
  QrCode,
  ChevronDown,
  Stethoscope,
} from 'lucide-react';
import { registerAndCheckinPatient } from '../services/patientDashboardService';
import { VirusBackground3D } from '../../../components/3d/VirusBackground3D';
import apiClient from '../../../core/api/apiClient';

// ============================================================================
// Sehat TTS Configuration
// ============================================================================
const PREFERRED_TTS_ENGINE = import.meta.env.VITE_TTS_ENGINE || "openrouter";
const OPENROUTER_TTS_ENDPOINT = "https://openrouter.ai/api/v1/audio/speech";
const FISH_AUDIO_MODEL = import.meta.env.VITE_FISH_AUDIO_MODEL || "fish-audio/s2.1-pro";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const SEHAT_FISH_VOICE_ID = import.meta.env.VITE_SEHAT_FISH_VOICE_ID || "7f92f8afb8ec43bf81429cc1c9199cb1";

function pcmToWavBlob(pcmBuffer, sampleRate = 44100) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint32(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);

  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(new Uint8Array(pcmBuffer));
  return new Blob([buffer], { type: "audio/wav" });
}

// Recognized languages with native script & localized greeting
const LANGUAGES = [
  { id: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', greeting: 'નમસ્તે, આપનું સેહત કિયોસ્કમાં સ્વાગત છે.' },
  { id: 'hi-IN', name: 'Hindi', native: 'हिंदी', greeting: 'नमस्ते, आपका सेहत कियोस्क में स्वागत है.' },
  { id: 'en-IN', name: 'English', native: 'English', greeting: 'Welcome to Sehat AI Clinical Kiosk.' },
  { id: 'mr-IN', name: 'Marathi', native: 'મરાઠી', greeting: 'नमस्कार, સેહેત કિયોસ્ક માં આપનું સ્વાગત છે.' },
  { id: 'ta-IN', name: 'Tamil', native: 'தமிழ்', greeting: 'வணக்கம், சேஹத் கியோஸ்க்கிற்கு வரவேற்கிறோம்.' },
  { id: 'te-IN', name: 'Telugu', native: 'తెలుగు', greeting: 'నమస్కారం, సెహత్ కియోస్క్‌కి స్వాగతం.' },
  { id: 'bn-IN', name: 'Bengali', native: 'বাংলা', greeting: 'নমস্কার, সেহত কিয়স্কে আপনাকে স্বাগতম.' },
];

// AYUSH Systems
const AYUSH_SYSTEMS = [
  { id: 'AYURVEDA', name: 'Ayurveda', native: 'आयुर्वेद', desc: 'Dosha balance & herbal therapeutics' },
  { id: 'YOGA_NATUROPATHY', name: 'Yoga & Naturopathy', native: 'योग एवं प्राकृतिक चिकित्सा', desc: 'Pranayama & lifestyle balance' },
  { id: 'UNANI', name: 'Unani', native: 'यूनानी', desc: 'Mizaj diagnosis & herbal science' },
  { id: 'SIDDHA', name: 'Siddha', native: 'सिद्ध', desc: 'Traditional Tamil medicine' },
  { id: 'HOMOEOPATHY', name: 'Homoeopathy', native: 'होम्योपैथी', desc: 'Constitutional individual care' },
  { id: 'SOWA_RIGPA', name: 'Sowa-Rigpa', native: 'सोवा-रिग्पा', desc: 'Tibetan & Himalayan pulse science' },
];

// General Specializations
const GENERAL_SPECS = [
  'General Medicine',
  'Family Medicine',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'ENT (Ear, Nose, Throat)',
  'Gynecology & Obstetrics',
];

export const PatientCheckinView = () => {
  const navigate = useNavigate();

  // Step 0: Welcome, 1: Language, 2: ABHA, 3: Name, 4: Demographics, 5: Mobile, 6: OPD, 7: Consent, 8: Final Ready
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    preferredLanguage: 'gu-IN',
    abhaId: '',
    fullName: '',
    age: '28',
    gender: 'Male',
    bloodGroup: 'UNKNOWN',
    address: '',
    phone: '',
    opdType: 'GENERAL', // 'GENERAL' | 'AYUSH'
    opdMode: 'ALLOPATHIC',
    opdSystem: 'MODERN_MEDICINE',
    medicalSpecialization: 'General Medicine',
    consentEhr: true,
    consentAiVoice: true,
    consentAbhaSync: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingAbha, setIsFetchingAbha] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [audioSpeechActive, setAudioSpeechActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEditSelector, setShowEditSelector] = useState(false);
  const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState(false);

  const speechRecognitionRef = useRef(null);
  const specDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (specDropdownRef.current && !specDropdownRef.current.contains(event.target)) {
        setIsSpecDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage('');
  };

  // Keyboard navigation: Enter to advance
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (currentStep < 8) {
          handleNextStep();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, formData]);

  // Helper to clean and tune speech text
  const cleanAndTuneSpeech = (raw) => {
    if (!raw) return "";
    let text = String(raw);
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
    text = text.replace(/```[\s\S]*?```/g, "");
    text = text.replace(/[*_#`]/g, "");
    text = text.replace(/([.!?])\s*/g, "$1 ");
    text = text.replace(/([,;])\s*/g, "$1 ");
    return text.trim();
  };

  const isOpenRouterRateLimited = () => {
    try {
      const lastKey = localStorage.getItem("sehat_openrouter_last_key");
      const lastModel = localStorage.getItem("sehat_openrouter_last_model");
      if (lastKey !== OPENROUTER_API_KEY || lastModel !== FISH_AUDIO_MODEL) {
        localStorage.setItem("sehat_openrouter_last_key", OPENROUTER_API_KEY);
        localStorage.setItem("sehat_openrouter_last_model", FISH_AUDIO_MODEL);
        localStorage.removeItem("sehat_openrouter_disabled");
        sessionStorage.removeItem("sehat_openrouter_rate_limit_until");
        return false;
      }
      if (FISH_AUDIO_MODEL.includes(":free")) {
        localStorage.removeItem("sehat_openrouter_disabled");
      }
      if (localStorage.getItem("sehat_openrouter_disabled") === "true") return true;
      const until = sessionStorage.getItem("sehat_openrouter_rate_limit_until");
      return until && Date.now() < Number(until);
    } catch {
      return false;
    }
  };

  const markOpenRouterRateLimited = (reason = "rate_limit") => {
    try {
      if (reason === "no_credits" || reason === "unauthorized") {
        localStorage.setItem("sehat_openrouter_disabled", "true");
      }
      sessionStorage.setItem("sehat_openrouter_rate_limit_until", String(Date.now() + 24 * 60 * 60 * 1000));
    } catch {}
  };

  // Multilingual Speech Synthesis via OpenRouter TTS
  const speakText = async (text, langCode) => {
    const tunedText = cleanAndTuneSpeech(text);
    if (!tunedText) return;
    
    setAudioSpeechActive(true);

    const fallbackToBrowser = () => {
      if (!('speechSynthesis' in window)) {
        setAudioSpeechActive(false);
        return;
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(tunedText);
      window.__activeCheckinUtterance = utterance;
      const targetLang = langCode || formData.preferredLanguage || 'gu-IN';
      
      const LANGUAGE_MAP = {
        "gu-IN": { bcp47: "gu-IN" },
        "hi-IN": { bcp47: "hi-IN" },
        "en-IN": { bcp47: "en-IN" },
        "mr-IN": { bcp47: "mr-IN" },
        "ta-IN": { bcp47: "ta-IN" },
        "te-IN": { bcp47: "te-IN" },
        "bn-IN": { bcp47: "bn-IN" },
      };
      
      const bcp47 = LANGUAGE_MAP[targetLang]?.bcp47 || targetLang || "gu-IN";
      utterance.lang = bcp47;
      utterance.rate = 0.94;
      utterance.pitch = 0.90; // Deep, mature male clinical voice pitch

      const voices = window.speechSynthesis.getVoices();
      const langPrefix = bcp47.split("-")[0].toLowerCase();
      const langFull = bcp47.toLowerCase();

      const matchingVoices = voices.filter((v) => {
        const vLang = (v.lang || "").toLowerCase().replace("_", "-");
        return vLang === langFull || vLang.startsWith(langPrefix);
      });

      const isExplicitMale = (v) =>
        /male|madhur|prabhat|niranjan|mohan|rohit|ravi|david|mark|george|guy|james|richard/i.test(v.name);
      const isNotFemale = (v) =>
        !/female|kalpana|zira|swara|samantha|heera|kavya|shruti|veena|neerja|anjali|priya/i.test(v.name);

      let chosenVoice = null;
      if (matchingVoices.length > 0) {
        chosenVoice = matchingVoices.find(isExplicitMale) || matchingVoices.find(isNotFemale) || matchingVoices[0];
      }
      if (!chosenVoice) {
        chosenVoice = voices.find(isExplicitMale);
      }
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.onend = () => {
        window.__activeCheckinUtterance = null;
        setAudioSpeechActive(false);
      };
      utterance.onerror = () => {
        window.__activeCheckinUtterance = null;
        setAudioSpeechActive(false);
      };
      window.speechSynthesis.speak(utterance);
    };

    if (PREFERRED_TTS_ENGINE !== 'openrouter' || !OPENROUTER_API_KEY || isOpenRouterRateLimited()) {
      fallbackToBrowser();
      return;
    }

    try {
      const payload = {
        model: FISH_AUDIO_MODEL,
        input: tunedText,
        voice: SEHAT_FISH_VOICE_ID,
        response_format: 'mp3',
      };

      const response = await fetch(OPENROUTER_TTS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin || 'http://localhost:5173',
          'X-Title': 'Sehat Voice Assistant',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402 || response.status === 401) {
          markOpenRouterRateLimited(response.status === 402 ? "no_credits" : "rate_limit");
        }
        fallbackToBrowser();
        return;
      }

      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.length > 0) chunks.push(value);
      }

      if (chunks.length === 0) throw new Error('Empty audio');

      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const buffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }

      const contentType = response.headers.get('content-type') || '';
      let audioBlob;
      if (contentType.includes('audio/pcm') || contentType.includes('pcm')) {
        let sampleRate = FISH_AUDIO_MODEL.includes("fish") ? 44100 : 24000;
        const rateMatch = contentType.match(/rate=(\d+)/i);
        if (rateMatch) {
          sampleRate = parseInt(rateMatch[1], 10);
        }
        audioBlob = pcmToWavBlob(buffer.buffer, sampleRate);
      } else {
        audioBlob = new Blob([buffer], { type: contentType || 'audio/mpeg' });
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setAudioSpeechActive(false);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        fallbackToBrowser();
      };

      await audio.play();
    } catch (err) {
      console.warn('TTS API failed, falling back to browser:', err);
      fallbackToBrowser();
    }
  };

  const handleAudioGuidance = () => {
    if (audioSpeechActive) {
      window.speechSynthesis.cancel();
      setAudioSpeechActive(false);
      return;
    }

    const lang = formData.preferredLanguage;
    let message = '';

    switch (currentStep) {
      case 0:
        message = lang === 'gu-IN'
          ? 'સેહત કિયોસ્ક માં આપનું સ્વાગત છે. આગળ વધવા માટે ચેક-ઇન શરૂ કરો બટન દબાવો.'
          : lang === 'hi-IN'
          ? 'सेहत कियोस्क में आपका स्वागत है. चेक-इन शुरू करने के लिए बटन दबाएं.'
          : 'Welcome to Sehat Clinical Kiosk. Press Start Check-In to proceed.';
        break;
      case 1:
        message = lang === 'gu-IN'
          ? 'આપ કઈ ભાષામાં વાતચીત કરવા માંગો છો? તમારી ભાષા પસંદ કરો.'
          : lang === 'hi-IN'
          ? 'आप किस भाषा में बात करना चाहते हैं? अपनी भाषा चुनें.'
          : 'Please select your preferred language for consultation.';
        break;
      case 2:
        message = lang === 'gu-IN'
          ? 'જો તમારી પાસે આભા આઈડી હોય તો અહીં દાખલ કરો, અથવા આગળ વધો.'
          : lang === 'hi-IN'
          ? 'यदि आपके पास आभा आईडी है तो यहां दर्ज करें, अथवा आगे बढ़ें.'
          : 'Please enter your ABHA Health ID or skip to enter details manually.';
        break;
      case 3:
        message = lang === 'gu-IN'
          ? 'કૃપા કરીને દર્દીનું પૂરું નામ દાખલ કરો.'
          : lang === 'hi-IN'
          ? 'कृपया मरीज का पूरा नाम दर्ज करें.'
          : 'Please enter the patient full name.';
        break;
      case 4:
        message = lang === 'gu-IN'
          ? 'તમારી ઉંમર અને જાતિ પસંદ કરો.'
          : lang === 'hi-IN'
          ? 'अपनी आयु और लिंग चुनें.'
          : 'Please select your age and gender.';
        break;
      case 5:
        message = lang === 'gu-IN'
          ? 'તમારો દસ અંકનો મોબાઈલ નંબર દાખલ કરો.'
          : lang === 'hi-IN'
          ? 'अपना दस अंकों का मोबाइल नंबर दर्ज करें.'
          : 'Please provide your 10 digit mobile number.';
        break;
      case 6:
        message = lang === 'gu-IN'
          ? 'જનરલ ઓપીડી અથવા આયુષ ઓપીડી વિભાગ પસંદ કરો.'
          : lang === 'hi-IN'
          ? 'जनरल ओपीडी या आयुष ओपीडी विभाग चुनें.'
          : 'Please choose General OPD or AYUSH Integrative OPD.';
        break;
      case 7:
        message = lang === 'gu-IN'
          ? 'સેહત પ્લેટફોર્મ તમારા અવાજનું સુરક્ષિત વિશ્લેષણ કરે છે. આગળ વધવા સંમતિ આપો.'
          : lang === 'hi-IN'
          ? 'सेहत आपके वॉइस का सुरक्षित विश्लेषण करता है. आगे बढ़ने के लिए सहमति दें.'
          : 'Sehat processes your clinical voice history securely under the DPDP Act 2023.';
        break;
      case 8:
        message = lang === 'gu-IN'
          ? 'શું તમે ચેક-અપ શરૂ કરવા માટે તૈયાર છો? હા અથવા ના પસંદ કરો.'
          : lang === 'hi-IN'
          ? 'क्या आप चेक-अप शुरू करने के लिए तैयार हैं? हाँ या नहीं चुनें.'
          : 'Are you ready to start the clinical check-up? Please choose Yes or No.';
        break;
      default:
        break;
    }

    if (message) speakText(message, lang);
  };

  const handleAbhaChange = (val) => {
    updateField('abhaId', val);
    const cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length >= 14 && !formData.fullName) {
      setIsFetchingAbha(true);
      setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          fullName: 'Banty Patel',
          phone: '9876543210',
          age: '28',
          gender: 'Male',
        }));
        setIsFetchingAbha(false);
      }, 700);
    }
  };

  const handleApplyPresetAbha = () => {
    setIsFetchingAbha(true);
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        abhaId: '91-4432-8812-9901',
        fullName: 'Banty Patel',
        phone: '9876543210',
        age: '28',
        gender: 'Male',
      }));
      setIsFetchingAbha(false);
    }, 600);
  };

  const toggleVoiceDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type manually.');
      return;
    }

    if (isVoiceListening) {
      if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
      setIsVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = formData.preferredLanguage || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        updateField('fullName', transcript);
        setIsVoiceListening(false);
      };
      recognition.onerror = () => setIsVoiceListening(false);
      recognition.onend = () => setIsVoiceListening(false);

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice recognition error:', err);
      setIsVoiceListening(false);
    }
  };

  const validateStep = (step) => {
    setErrorMessage('');
    if (step === 3) {
      if (!formData.fullName.trim()) {
        setErrorMessage('Please enter the patient full name to proceed.');
        return false;
      }
    }
    if (step === 4) {
      if (!formData.age || parseInt(formData.age, 10) <= 0) {
        setErrorMessage('Please enter a valid age.');
        return false;
      }
    }
    if (step === 5) {
      const digits = formData.phone.replace(/[^0-9]/g, '');
      if (digits.length < 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return false;
      }
    }
    if (step === 7) {
      if (!formData.consentAiVoice) {
        setErrorMessage('Consent for clinical voice intake is required to proceed.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = async () => {
    if (!validateStep(currentStep)) return;

    // Strict validation on step 5 (Mobile number): Check uniqueness
    if (currentStep === 5) {
      const digits = formData.phone.replace(/[^0-9]/g, '');
      try {
        const checkRes = await apiClient.get(`/patients/check-phone/${digits}`);
        if (checkRes?.data && checkRes.data.available === false) {
          setErrorMessage(
            `A patient is already registered with mobile number +91 ${digits.slice(-10)} (Patient ID: ${checkRes.data.patient_id}). Only one patient can register with a phone number. Please sign in or use a different number.`
          );
          return;
        }
      } catch (err) {
        // Fallback: proceed, backend will strictly reject on final submit if conflict
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 8));
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Final Action: "YES — START CHECK-UP"
  const handleConfirmStartCheckup = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const liveData = await registerAndCheckinPatient(formData);
      const sessionPayload = {
        ...formData,
        patientId: liveData.patientId,
        sessionId: liveData.sessionId,
        tokenNumber: liveData.tokenNumber,
        checkinTime: liveData.checkinTime || new Date().toLocaleTimeString(),
      };

      sessionStorage.setItem('patient_session', JSON.stringify(sessionPayload));
      sessionStorage.setItem('patient_summary', JSON.stringify(sessionPayload));
      sessionStorage.setItem('selected_patient_id', liveData.patientId);

      speakText(
        formData.preferredLanguage === 'gu-IN'
          ? 'તપાસ શરૂ થઈ રહી છે.'
          : formData.preferredLanguage === 'hi-IN'
          ? 'चेक-अप शुरू हो रहा है.'
          : 'Starting clinical intake.',
        formData.preferredLanguage
      );

      setTimeout(() => {
        navigate('/patient/intake');
      }, 500);
    } catch (err) {
      console.warn('[Checkin] Registration error:', err);
      if (err.status === 409 || err.response?.status === 409) {
        const errorMsg = err.response?.data?.message || err.message || 'A patient with this mobile number is already registered.';
        setErrorMessage(errorMsg);
        setCurrentStep(5); // Return directly to Mobile Number step
        return;
      }
      const sessionId = `SESSION_${Date.now().toString().slice(-6)}`;
      const tokenNumber = `TK-${Math.floor(Math.random() * 80 + 101)}`;
      const sessionPayload = {
        ...formData,
        patientId: `PAT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        sessionId,
        tokenNumber,
        checkinTime: new Date().toLocaleTimeString(),
      };
      sessionStorage.setItem('patient_session', JSON.stringify(sessionPayload));
      sessionStorage.setItem('patient_summary', JSON.stringify(sessionPayload));
      navigate('/patient/intake');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 14, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease: 'easeOut' } },
    exit: { opacity: 0, y: -14, scale: 0.99, transition: { duration: 0.18 } },
  };

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900 flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden selection:bg-slate-200">
      {/* 3D Microscopic Virus Background with Parallax (Replacing circular telemetry) */}
      <VirusBackground3D />

      {/* Soft Multi-Color Atmospheric Glow (Exact match to /patient/intake) */}
      <div className="fixed inset-x-0 bottom-0 h-[420px] pointer-events-none overflow-hidden z-0 opacity-70 select-none">
        <div className="absolute -bottom-24 -left-24 w-[480px] h-[380px] bg-amber-100/50 rounded-full blur-[110px]" />
        <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[540px] h-[360px] bg-rose-100/40 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-[500px] h-[400px] bg-sky-100/50 rounded-full blur-[110px]" />
      </div>

      {/* Main Centered Q&A Card */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 py-6 sm:py-10 flex-grow flex flex-col justify-center">
        {/* Step Progress Line */}
        <div className="mb-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{currentStep === 0 ? 'Welcome' : `Step ${currentStep} of 8`}</span>
            <span>{Math.round((currentStep / 8) * 100)}%</span>
          </div>
          <div className="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-slate-900 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 8) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <X className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dynamic Card Container (Theme matching /patient/intake) */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-[28px] p-6 sm:p-10 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.05)]">
          <AnimatePresence mode="wait">
            {/* ========================================================
                STEP 0: WELCOME ("wellcome")
                ======================================================== */}
            {currentStep === 0 && (
              <motion.div
                key="step-0-welcome"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-normal text-slate-950 tracking-tight">
                    Welcome to Sehat
                  </h2>
                  <p className="text-sm text-slate-500 font-light">
                    સેહત કિયોસ્ક માં આપનું સ્વાગત છે • सेहत कियोस्क में आपका स्वागत है
                  </p>
                  <p className="text-sm text-slate-600 pt-1 leading-relaxed">
                    Fast and easy hospital check-in. Answer a few brief questions, and we will prepare your clinical history for the doctor.
                  </p>
                </div>

                {/* Clean Feature List (without badges) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <Volume2 className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-medium text-slate-900">Voice Guided</h4>
                    <p className="text-[11px] text-slate-500">Gujarati, Hindi & English</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <User className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-medium text-slate-900">ABHA Auto-Sync</h4>
                    <p className="text-[11px] text-slate-500">Instant identity lookup</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <HeartPulse className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-medium text-slate-900">Doctor Routing</h4>
                    <p className="text-[11px] text-slate-500">Direct OPD queue entry</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full py-4 rounded-2xl bg-slate-950 hover:bg-slate-850 text-white text-sm font-medium transition active:scale-[0.99] cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Start Check-In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="block text-center text-[11px] text-slate-400 mt-2 font-normal">
                    Press Enter ↵ to begin
                  </span>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                STEP 1: LANGUAGE SELECTION
                ======================================================== */}
            {currentStep === 1 && (
              <motion.div
                key="step-1-language"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Question 1 of 8</span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight">
                    Which language do you prefer to speak in?
                  </h2>
                  <p className="text-xs text-slate-500">
                    આપ કઈ ભાષામાં વાતચીત કરવા માંગો છો? • अपनी भाषा चुनें
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LANGUAGES.map((lang) => {
                    const isSelected = formData.preferredLanguage === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => {
                          updateField('preferredLanguage', lang.id);
                          speakText(lang.greeting, lang.id);
                        }}
                        className={`p-3.5 rounded-2xl text-left border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium">{lang.name}</div>
                          <div className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {lang.native}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-850 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue to ABHA ID</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                STEP 2: ABHA HEALTH ID
                ======================================================== */}
            {currentStep === 2 && (
              <motion.div
                key="step-2-abha"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Question 2 of 8</span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight">
                    Do you have an ABHA Health ID?
                  </h2>
                  <p className="text-xs text-slate-500">
                    આયુષ્માન ભારત હેલ્થ આઈડી (14 અંક) • Entering ABHA auto-fills your identity
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      onChange={(e) => handleAbhaChange(e.target.value)}
                      placeholder="e.g. 91-4432-8812-9901 or name@abdm"
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 transition"
                    />
                    {isFetchingAbha && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-slate-600 bg-slate-200 px-3 py-1 rounded-full animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Fetching...</span>
                      </div>
                    )}
                  </div>

                  {/* <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleApplyPresetAbha}
                      className="text-xs text-slate-700 hover:text-slate-950 underline underline-offset-4 flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Autofill Demo ABHA (91-4432-8812-9901)</span>
                    </button>
                  </div> */}

                  {/* {formData.fullName && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Verified: Auto-filled as {formData.fullName} ({formData.gender}, {formData.age}y)</span>
                    </div>
                  )} */}
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      updateField('abhaId', '');
                      handleNextStep();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  >
                    I don't have an ABHA ID / Skip →
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-850 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue to Name</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                STEP 3: FULL NAME
                ======================================================== */}
            {currentStep === 3 && (
              <motion.div
                key="step-3-name"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Question 3 of 8</span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight">
                    What is the patient's full name?
                  </h2>
                  <p className="text-xs text-slate-500">
                    દર્દીનું પૂરું નામ લખો અથવા બોલો • Type or speak using voice dictation
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full pl-11 pr-14 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 transition"
                    />
                  </div>
                  <span className="block text-[11px] text-slate-400 font-normal">
                    Press Enter ↵ to advance
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-850 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue to Demographics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                STEP 4: DEMOGRAPHICS (AGE & GENDER)
                ======================================================== */}
            {currentStep === 4 && (
              <motion.div
                key="step-4-demographics"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Question 4 of 8</span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight">
                    How old are you, and what is your gender?
                  </h2>
                  <p className="text-xs text-slate-500">
                    તમારી ઉંમર અને જાતિ પસંદ કરો • Age & Gender
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Age */}
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-600 font-medium">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      onChange={(e) => updateField('age', e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-lg font-mono focus:bg-white focus:outline-none focus:border-slate-400 transition"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['18', '28', '35', '48', '62', '75'].map((agePreset) => (
                        <button
                          key={agePreset}
                          type="button"
                          onClick={() => updateField('age', agePreset)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border cursor-pointer ${
                            formData.age === agePreset
                              ? 'bg-slate-950 text-white border-slate-950'
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {agePreset}y
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-600 font-medium">
                      Gender
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'Male', label: 'Male (પુરુષ)' },
                        { id: 'Female', label: 'Female (સ્ત્રી)' },
                        { id: 'Other', label: 'Other (અન્ય)' },
                      ].map((g) => {
                        const isSelected = formData.gender === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => updateField('gender', g.id)}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{g.label}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                  {/* Blood Group */}
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-600 font-medium">
                      Blood Group (రక్తం గ్రూప్)
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => {
                        const isSelected = formData.bloodGroup === bg;
                        return (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => updateField('bloodGroup', bg)}
                            className={`py-2 rounded-xl border text-xs font-mono font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {bg}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField('bloodGroup', 'UNKNOWN')}
                      className={`text-[11px] transition cursor-pointer ${
                        formData.bloodGroup === 'UNKNOWN' ? 'text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Unknown / Not tested
                    </button>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-600 font-medium">
                      Home Address (Optional)
                    </label>
                    <textarea
                      rows={2}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="e.g. B-402, Shivalik Residency, Satellite, Ahmedabad"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 transition resize-none"
                    />
                  </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-850 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue to Mobile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                STEP 5: MOBILE NUMBER
                ======================================================== */}
            {currentStep === 5 && (
              <motion.div
                key="step-5-mobile"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Question 5 of 8</span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight">
                    What is your 10-digit mobile number?
                  </h2>
                  <p className="text-xs text-slate-500">
                    મોબાઈલ નંબર (+91) • Used for digital prescription and OPD queue token
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <div className="absolute left-4 flex items-center gap-1 text-xs font-mono text-slate-500 border-r border-slate-200 pr-2.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      autoFocus
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="98765 43210"
                      className="w-full pl-20 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 transition"
                    />
                  </div>
                  <span className="block text-[11px] text-slate-400 font-normal">
                    Press Enter ↵ to advance
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-850 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue to OPD Pathway</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                STEP 6: CLINICAL OPD PATHWAY
                ======================================================== */}
            {currentStep === 6 && (
              <motion.div
                key="step-6-opd"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Question 6 of 8</span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight">
                    Which OPD department would you like to visit?
                  </h2>
                  <p className="text-xs text-slate-500">
                    ઓપીડી વિભાગ પસંદ કરો • Select General Allopathic or AYUSH Integrative OPD
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        opdType: 'GENERAL',
                        opdMode: 'ALLOPATHIC',
                        opdSystem: 'MODERN_MEDICINE',
                        medicalSpecialization: 'General Medicine',
                      }))
                    }
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer space-y-1.5 ${
                      formData.opdType === 'GENERAL'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HeartPulse className="w-4 h-4" />
                        <span className="text-sm font-medium">General OPD</span>
                      </div>
                      {formData.opdType === 'GENERAL' && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <p className={`text-xs ${formData.opdType === 'GENERAL' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Modern medicine (MBBS / MD) for fever, acute infections, diagnostics, and primary care.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        opdType: 'AYUSH',
                        opdMode: 'AYUSH',
                        opdSystem: 'AYURVEDA',
                        medicalSpecialization: 'Ayurveda',
                      }))
                    }
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer space-y-1.5 ${
                      formData.opdType === 'AYUSH'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4" />
                        <span className="text-sm font-medium">AYUSH OPD</span>
                      </div>
                      {formData.opdType === 'AYUSH' && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <p className={`text-xs ${formData.opdType === 'AYUSH' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Traditional systems (Ayurveda, Yoga, Unani, Siddha, Homoeopathy, Sowa-Rigpa).
                    </p>
                  </button>
                </div>

                {/* Sub-Specialization Selector */}
                {formData.opdType === 'GENERAL' ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Select Medical Specialization:
                    </label>

                    {/* Custom Styled Dropdown Container */}
                    <div className="relative" ref={specDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsSpecDropdownOpen((prev) => !prev)}
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border transition-colors duration-200 flex items-center justify-between text-left cursor-pointer shadow-xs ${
                          isSpecDropdownOpen
                            ? 'border-slate-950'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-medium text-slate-900">
                          {formData.medicalSpecialization || 'General Medicine'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                            isSpecDropdownOpen ? 'rotate-180 text-slate-950' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Options Menu */}
                      <AnimatePresence>
                        {isSpecDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 2 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12, ease: 'easeOut' }}
                            className="absolute left-0 right-0 z-50 mt-1 max-h-44 sm:max-h-48 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl p-1 space-y-0.5"
                          >
                            {GENERAL_SPECS.map((spec) => {
                              const isSelected = formData.medicalSpecialization === spec;
                              return (
                                <button
                                  key={spec}
                                  type="button"
                                  onClick={() => {
                                    updateField('medicalSpecialization', spec);
                                    setIsSpecDropdownOpen(false);
                                  }}
                                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 flex items-center justify-between text-left cursor-pointer ${
                                    isSelected
                                      ? 'bg-slate-950 text-white shadow-xs'
                                      : 'text-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{spec}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Choose AYUSH Discipline:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AYUSH_SYSTEMS.map((sys) => {
                        const isSel = formData.opdSystem === sys.id;
                        return (
                          <button
                            key={sys.id}
                            type="button"
                            onClick={() => {
                              setFormData((p) => ({
                                ...p,
                                opdSystem: sys.id,
                                medicalSpecialization: sys.name,
                              }));
                            }}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              isSel
                                ? 'bg-slate-950 text-white border-slate-950'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="text-xs font-medium">{sys.name}</div>
                            <div className={`text-[10px] ${isSel ? 'text-slate-300' : 'text-slate-400'}`}>
                              {sys.native}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-850 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue to Consent</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                STEP 7: DPDP CONSENT
                ======================================================== */}
            {currentStep === 7 && (
              <motion.div
                key="step-7-consent"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Question 7 of 8</span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight">
                    Do you grant consent for AI-assisted voice check-up?
                  </h2>
                  <p className="text-xs text-slate-500">
                    DPDP એક્ટ 2023 અને ડેટા સુરક્ષા સંમતિ • Digital Personal Data Protection
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-medium text-slate-900">Privacy & Consent Notice</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    I authorize Sehat to transcribe spoken symptoms and prepare a clinical summary for my treating physician. Voice recordings are processed securely and deleted upon consultation completion.
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={formData.consentAiVoice}
                        onChange={(e) => updateField('consentAiVoice', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-950 accent-slate-950"
                      />
                      <span>I consent to AI conversational voice intake & clinical structuring *</span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={formData.consentAbhaSync}
                        onChange={(e) => updateField('consentAbhaSync', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-950 accent-slate-950"
                      />
                      <span>Link consultation record with my ABHA Health Locker via ABDM FHIR</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-850 text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Continue to Final Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                STEP 8: FINAL STAGE — "READY TO START CHECK UP : YES OR NO"
                ======================================================== */}
            {currentStep === 8 && (
              <motion.div
                key="step-8-final-ready"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Final Stage • Step 8 of 8</span>
                  <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight">
                    Ready to start check up : Yes or No?
                  </h2>
                  <p className="text-xs text-slate-500">
                    તપાસ શરૂ કરવા માટે તૈયાર છો? • Please verify your check-in details below
                  </p>
                </div>

                {/* Summary Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Patient Name</span>
                      <span className="text-base font-medium text-slate-950">{formData.fullName || 'Patient User'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Demographics</span>
                      <span className="text-xs font-medium text-slate-700">
                        {formData.gender}, {formData.age} Years
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-200/80 pb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Mobile Number</span>
                      <span className="font-mono text-slate-800">{formData.phone || '9876543210'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">ABHA ID</span>
                      <span className="font-mono text-slate-800">
                        {formData.abhaId || 'Direct Kiosk Patient'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Language</span>
                      <span className="text-slate-800">
                        {LANGUAGES.find((l) => l.id === formData.preferredLanguage)?.name || 'Gujarati'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">OPD Pathway</span>
                      <span className="text-slate-900 font-medium">
                        {formData.opdType === 'AYUSH'
                          ? `AYUSH (${formData.opdSystem})`
                          : `General (${formData.medicalSpecialization})`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Consent Verified</span>
                    </span>
                    <span>Ready for clinical intake</span>
                  </div>
                </div>

                {/* Edit Jump Selector if User Clicks NO */}
                {showEditSelector && (
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 animate-fadeIn">
                    <span className="text-xs font-medium text-slate-800 block">
                      Which answer would you like to edit?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {[
                        { label: 'Language', step: 1 },
                        { label: 'ABHA ID', step: 2 },
                        { label: 'Full Name', step: 3 },
                        { label: 'Age & Gender', step: 4 },
                        { label: 'Mobile Number', step: 5 },
                        { label: 'OPD Pathway', step: 6 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setShowEditSelector(false);
                            setCurrentStep(item.step);
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-center transition cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* The User's Explicit Request: "Ready start check up : yes or nor" */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* NO, EDIT DETAILS */}
                    <button
                      type="button"
                      onClick={() => setShowEditSelector((prev) => !prev)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>NO, EDIT DETAILS</span>
                    </button>

                    {/* YES, START CHECK-UP */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmStartCheckup}
                      className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-850 text-white text-sm font-medium transition active:scale-[0.99] cursor-pointer shadow-xs flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Starting Check-Up...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>YES, START CHECK-UP</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      ← Back to Previous Step
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
};

export default PatientCheckinView;
