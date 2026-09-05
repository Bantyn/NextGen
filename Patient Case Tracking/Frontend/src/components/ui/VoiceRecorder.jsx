import "regenerator-runtime/runtime";
import React, { useState, useEffect, useRef, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  Mic,
  MicOff,
  PhoneOff,
  PhoneCall,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Send,
  RefreshCw,
  Play,
  ShieldAlert,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { VoiceVisualizer3D } from "../3d/VoiceVisualizer3D";
import {
  INITIAL_CLINICAL_STATE,
  processPatientClinicalResponse,
} from "../../services/clinicalConversationEngine";

// ============================================================================
// Sehat TTS Configuration
// ============================================================================
const OPENROUTER_TTS_ENDPOINT = "https://openrouter.ai/api/v1/audio/speech";
const FISH_AUDIO_MODEL = "fish-audio/s2.1-pro-free:free";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";

export const SEHAT_FISH_VOICE_ID =
  import.meta.env.VITE_SEHAT_FISH_VOICE_ID ||
  import.meta.env.VITE_MEDIKIOSK_FISH_VOICE_ID ||
  "7f92f8afb8ec43bf81429cc1c9199cb1";
export const MEDIKIOSK_FISH_VOICE_ID = SEHAT_FISH_VOICE_ID;

const LANGUAGE_MAP = {
  "gu-IN": { name: "Gujarati", bcp47: "gu-IN" },
  "hi-IN": { name: "Hindi", bcp47: "hi-IN" },
  "en-IN": { name: "English", bcp47: "en-IN" },
  "mr-IN": { name: "Marathi", bcp47: "mr-IN" },
  "ta-IN": { name: "Tamil", bcp47: "ta-IN" },
  "te-IN": { name: "Telugu", bcp47: "te-IN" },
  "bn-IN": { name: "Bengali", bcp47: "bn-IN" },
};

/**
 * Clean and tune AI text for expressive, human-like clinical speech prosody
 */
function cleanAndTuneSpeech(raw) {
  if (!raw) return "";
  let text = String(raw);

  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/[*_#`]/g, "");

  text = text.replace(/([.!?])\s*/g, "$1 ");
  text = text.replace(/([,;])\s*/g, "$1 ");

  return text.trim();
}

/**
 * Converts raw 16-bit PCM buffer (44.1kHz 1-channel) to playable WAV Blob
 */
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

/**
 * VoiceRecorder Component — Unified Adaptive Clinical Voice & Touch Engine
 */
export const VoiceRecorder = ({
  sessionId = "DEMO_GUJARATI_SPEECH_001",
  patientId = "DEMO_PATIENT_001",
  defaultLanguage = "gu-IN",
  opdMode = "GENERAL",
  onMessageSent,
  onClinicalStateUpdated,
  onFinishIntake,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [ttsSource, setTtsSource] = useState("OpenRouter Neural");

  // Dynamic Clinical State Memory
  const [clinicalState, setClinicalState] = useState(INITIAL_CLINICAL_STATE);
  const [redFlagAlert, setRedFlagAlert] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("IN_PROGRESS");
  const [historyCompleted, setHistoryCompleted] = useState(false);

  const availableVoicesRef = useRef([]);

  // Initial multilingual dynamic chips
  const [dynamicChips, setDynamicChips] = useState([
    "છાતીમાં દુખાવો થાય છે",
    "તાવ અને ધ્રુજારી આવે છે",
    "ખાંસી અને કફ છે",
    "પેટમાં દુખાવો થાય છે",
    "માથું ખૂબ દુખે છે",
    "સાંધા અને ઘૂંટણમાં દુખાવો",
  ]);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        defaultLanguage === "gu-IN"
          ? "નમસ્તે! હું તમારી AI ક્લિનિકલ સહાયક છું. તમને આજે કઈ તકલીફ થઈ રહી છે?"
          : defaultLanguage === "hi-IN"
          ? "नमस्ते! मैं आपकी AI क्लिनिकल सहायक हूँ। आपको आज क्या परेशानी हो रही है?"
          : "Hello! I am your AI Clinical Assistant. What symptoms are you experiencing today?",
      time: "Just now",
    },
  ]);

  const [textInput, setTextInput] = useState("");

  // Mutable live state references
  const isCallActiveRef = useRef(false);
  const isSpeakingTTSRef = useRef(false);
  const apiLoadingRef = useRef(false);
  const selectedLanguageRef = useRef(selectedLanguage);
  const clinicalStateRef = useRef(clinicalState);
  const currentAudioRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const chatScrollRef = useRef(null);
  const fallbackSpeechTimerRef = useRef(null);

  isCallActiveRef.current = isCallActive;
  isSpeakingTTSRef.current = isSpeakingTTS;
  apiLoadingRef.current = apiLoading;
  selectedLanguageRef.current = selectedLanguage;
  clinicalStateRef.current = clinicalState;

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Preload and cache browser voices for fallback
  useEffect(() => {
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        availableVoicesRef.current = window.speechSynthesis.getVoices();
      }
    };
    loadVoices();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Update initial chip language on change
  useEffect(() => {
    if (messages.length === 1) {
      if (selectedLanguage === "hi-IN") {
        setDynamicChips([
          "सीने में दर्द हो रहा है",
          "बुखार और कंपकंपी है",
          "खांसी और कफ है",
          "पेट में दर्द है",
          "सिर में तेज दर्द है",
          "जोड़ों और घुटनों में दर्द",
        ]);
        setMessages([
          {
            role: "assistant",
            text: "नमस्ते! मैं आपकी AI क्लिनिकल सहायक हूँ। आपको आज क्या परेशानी हो रही है?",
            time: "Just now",
          },
        ]);
      } else if (selectedLanguage === "en-IN") {
        setDynamicChips([
          "I have chest pain",
          "I have fever and chills",
          "Cough and cold",
          "Stomach pain",
          "Severe headache",
          "Joint and body aches",
        ]);
        setMessages([
          {
            role: "assistant",
            text: "Hello! I am your AI Clinical Assistant. What symptoms are you experiencing today?",
            time: "Just now",
          },
        ]);
      } else {
        setDynamicChips([
          "છાતીમાં દુખાવો થાય છે",
          "તાવ અને ધ્રુજારી આવે છે",
          "ખાંસી અને કફ છે",
          "પેટમાં દુખાવો થાય છે",
          "માથું ખૂબ દુખે છે",
          "સાંધા અને ઘૂંટણમાં દુખાવો",
        ]);
        setMessages([
          {
            role: "assistant",
            text: "નમસ્તે! હું તમારી AI ક્લિનિકલ સહાયક છું. તમને આજે કઈ તકલીફ થઈ રહી છે?",
            time: "Just now",
          },
        ]);
      }
    }
  }, [selectedLanguage]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, transcript, apiLoading]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      SpeechRecognition.stopListening();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (fallbackSpeechTimerRef.current)
        clearTimeout(fallbackSpeechTimerRef.current);
    };
  }, []);

  // 1. Keepalive Watchdog: If call is active, keep mic listening
  useEffect(() => {
    if (
      !isCallActive ||
      isSpeakingTTS ||
      apiLoading ||
      sessionStatus === "URGENT_REVIEW_REQUIRED" ||
      historyCompleted
    )
      return;

    if (!listening) {
      const keepAliveTimeout = setTimeout(() => {
        if (
          isCallActiveRef.current &&
          !isSpeakingTTSRef.current &&
          !apiLoadingRef.current
        ) {
          try {
            SpeechRecognition.startListening({
              continuous: true,
              language: selectedLanguageRef.current,
            });
          } catch (err) {
            console.warn("SpeechRecognition keepalive error:", err);
          }
        }
      }, 350);

      return () => clearTimeout(keepAliveTimeout);
    }
  }, [listening, isCallActive, isSpeakingTTS, apiLoading, sessionStatus, historyCompleted]);

  // 2. Silence Detection: Patient speaks -> pauses 1.8s -> Auto submit
  useEffect(() => {
    if (
      !isCallActive ||
      isSpeakingTTS ||
      apiLoading ||
      sessionStatus === "URGENT_REVIEW_REQUIRED" ||
      historyCompleted
    )
      return;

    if (transcript.trim()) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      silenceTimerRef.current = setTimeout(() => {
        const text = transcript.trim();
        if (
          text.length > 2 &&
          isCallActiveRef.current &&
          !apiLoadingRef.current
        ) {
          handleAutoSubmit(text);
        }
      }, 1800);
    }
  }, [transcript, isCallActive, isSpeakingTTS, apiLoading, sessionStatus, historyCompleted]);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (fallbackSpeechTimerRef.current)
      clearTimeout(fallbackSpeechTimerRef.current);
    setIsSpeakingTTS(false);
    isSpeakingTTSRef.current = false;
  }, []);

  // Safe resume mic listening
  const resumeListeningSafe = useCallback(() => {
    stopAudio();
    if (
      isCallActiveRef.current &&
      sessionStatus !== "URGENT_REVIEW_REQUIRED" &&
      !historyCompleted
    ) {
      resetTranscript();
      setTimeout(() => {
        if (
          isCallActiveRef.current &&
          !isSpeakingTTSRef.current &&
          !apiLoadingRef.current
        ) {
          try {
            SpeechRecognition.startListening({
              continuous: true,
              language: selectedLanguageRef.current,
            });
          } catch (e) {
            console.warn("Resume mic error:", e);
          }
        }
      }, 250);
    }
  }, [resetTranscript, stopAudio, sessionStatus, historyCompleted]);

  // Web Speech Synthesis Fallback
  const fallbackTTS = useCallback(
    (text) => {
      const cleanText = cleanAndTuneSpeech(text);
      if (!("speechSynthesis" in window) || !cleanText) {
        resumeListeningSafe();
        return;
      }

      setTtsSource("Browser Web Speech");
      stopAudio();
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLang = selectedLanguageRef.current || "gu-IN";
      utterance.lang = LANGUAGE_MAP[targetLang]?.bcp47 || "gu-IN";
      utterance.rate = 0.92;
      utterance.pitch = 1.18;

      const voices =
        availableVoicesRef.current.length > 0
          ? availableVoicesRef.current
          : window.speechSynthesis.getVoices();

      const femaleVoice =
        voices.find(
          (v) =>
            v.lang.startsWith(utterance.lang.substring(0, 2)) &&
            (v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("kalpana") ||
              v.name.toLowerCase().includes("zira") ||
              v.name.toLowerCase().includes("swara") ||
              v.name.toLowerCase().includes("samantha") ||
              v.name.toLowerCase().includes("heera") ||
              v.name.toLowerCase().includes("kavya") ||
              v.name.toLowerCase().includes("shruti") ||
              v.name.toLowerCase().includes("google")),
        ) ||
        voices.find(
          (v) =>
            v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("zira") ||
            v.name.toLowerCase().includes("kalpana") ||
            v.name.toLowerCase().includes("samantha"),
        );

      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onstart = () => {
        setIsSpeakingTTS(true);
        isSpeakingTTSRef.current = true;
      };

      utterance.onend = () => {
        resumeListeningSafe();
      };

      utterance.onerror = (err) => {
        console.warn("Web Speech Synthesis error:", err);
        resumeListeningSafe();
      };

      window.speechSynthesis.speak(utterance);
    },
    [resumeListeningSafe, stopAudio],
  );

  /**
   * Play Neural Speech via OpenRouter Fish Audio TTS Engine with Web Speech Fallback
   */
  const speakAI = useCallback(
    async (text) => {
      const tunedText = cleanAndTuneSpeech(text);
      if (!tunedText) {
        resumeListeningSafe();
        return;
      }

      stopAudio();
      SpeechRecognition.stopListening();
      setIsSpeakingTTS(true);
      isSpeakingTTSRef.current = true;

      if (fallbackSpeechTimerRef.current)
        clearTimeout(fallbackSpeechTimerRef.current);
      fallbackSpeechTimerRef.current = setTimeout(() => {
        if (isSpeakingTTSRef.current) {
          console.warn("TTS safety watchdog timer reached, resuming microphone");
          resumeListeningSafe();
        }
      }, 16000);

      if (!OPENROUTER_API_KEY) {
        fallbackTTS(tunedText);
        return;
      }

      try {
        const payload = {
          model: FISH_AUDIO_MODEL,
          input: tunedText,
          voice: "alloy",
          response_format: "mp3",
        };

        const response = await fetch(OPENROUTER_TTS_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin || "http://localhost:5173",
            "X-Title": "Sehat Voice Assistant",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter TTS status ${response.status}`);
        }

        setTtsSource("OpenRouter Fish Audio");

        const reader = response.body.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value && value.length > 0) chunks.push(value);
        }

        if (chunks.length === 0) throw new Error("Empty audio chunks");

        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, offset);
          offset += chunk.length;
        }

        const contentType = response.headers.get("content-type") || "";
        let audioBlob;
        if (contentType.includes("audio/pcm") || contentType.includes("pcm")) {
          audioBlob = pcmToWavBlob(buffer.buffer, 44100);
        } else {
          audioBlob = new Blob([buffer], { type: contentType || "audio/mpeg" });
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onplay = () => {
          setIsSpeakingTTS(true);
          isSpeakingTTSRef.current = true;
        };

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resumeListeningSafe();
        };

        audio.onerror = (e) => {
          URL.revokeObjectURL(audioUrl);
          fallbackTTS(tunedText);
        };

        await audio.play();
      } catch (err) {
        fallbackTTS(tunedText);
      }
    },
    [fallbackTTS, resumeListeningSafe, stopAudio],
  );

  /**
   * Unified Hands-Free Auto-Submit (Voice, Text, and Touch Chips)
   */
  const handleAutoSubmit = async (patientAnswerText) => {
    if (!patientAnswerText || apiLoadingRef.current) return;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    SpeechRecognition.stopListening();
    resetTranscript();

    // 1. Add patient answer to chat stream
    const userMsg = {
      role: "patient",
      text: patientAnswerText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    setApiLoading(true);
    apiLoadingRef.current = true;
    setApiError(null);

    const turnCount = updatedMessages.filter((m) => m.role === "patient").length;

    try {
      // 2. Process via ClinicalConversationEngine
      const engineResult = await processPatientClinicalResponse({
        patientText: patientAnswerText,
        clinicalState: clinicalStateRef.current,
        language: selectedLanguageRef.current,
        opdMode,
        conversationHistory: updatedMessages.map((m) => ({
          role: m.role === "patient" ? "user" : "assistant",
          content: m.text,
        })),
        turnCount,
      });

      console.log("[ClinicalConversationEngine Result]:", engineResult);

      if (engineResult.success) {
        const nextState = engineResult.clinical_state_update || clinicalStateRef.current;
        setClinicalState(nextState);
        clinicalStateRef.current = nextState;

        if (onClinicalStateUpdated) onClinicalStateUpdated(nextState);

        // A. RED FLAG DETECTED -> Immediate Emergency Stop
        if (engineResult.red_flag?.detected) {
          setIsCallActive(false);
          isCallActiveRef.current = false;
          setRedFlagAlert(engineResult.red_flag);
          setSessionStatus("URGENT_REVIEW_REQUIRED");
          setDynamicChips([]);

          if (engineResult.doctor_alert) {
            sessionStorage.setItem(
              "sehat_doctor_alert",
              JSON.stringify(engineResult.doctor_alert)
            );
            sessionStorage.setItem(
              "medikiosk_doctor_alert",
              JSON.stringify(engineResult.doctor_alert)
            );
          }

          const aiMsg = {
            role: "assistant",
            text: engineResult.assistant_message,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isRedFlag: true,
          };
          setMessages((prev) => [...prev, aiMsg]);
          speakAI(engineResult.assistant_message);
          return;
        }

        // B. CLINICAL HISTORY COMPLETED
        if (engineResult.history_complete) {
          setHistoryCompleted(true);
          setSessionStatus("READY_FOR_SUMMARY");
          setDynamicChips([]);

          const aiMsg = {
            role: "assistant",
            text: engineResult.assistant_message,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isComplete: true,
          };
          setMessages((prev) => [...prev, aiMsg]);
          speakAI(engineResult.assistant_message);
          return;
        }

        // C. NORMAL ADAPTIVE QUESTIONING
        if (engineResult.quick_chips && engineResult.quick_chips.length > 0) {
          setDynamicChips(engineResult.quick_chips);
        }

        const aiMsg = {
          role: "assistant",
          text: engineResult.assistant_message,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        speakAI(engineResult.assistant_message);
      }
    } catch (err) {
      console.error("[Clinical Engine Error]:", err);
      setApiError("Connection glitch, please continue speaking or type.");
    } finally {
      setApiLoading(false);
      apiLoadingRef.current = false;
    }
  };

  // Start Call
  const handleStartCall = () => {
    setIsCallActive(true);
    isCallActiveRef.current = true;
    setRedFlagAlert(null);
    setSessionStatus("IN_PROGRESS");
    const initialGreeting = messages[0]?.text || "Hello! What symptoms are you experiencing today?";
    speakAI(initialGreeting);
  };

  // End Call
  const handleEndCall = () => {
    setIsCallActive(false);
    isCallActiveRef.current = false;
    stopAudio();
    SpeechRecognition.stopListening();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (fallbackSpeechTimerRef.current)
      clearTimeout(fallbackSpeechTimerRef.current);
    resetTranscript();
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center text-slate-800 transition-all font-sans">
      {/* 3D WebGL Holographic Voice Visualizer */}
      <div className="w-full mb-2 relative flex flex-col items-center">
        <VoiceVisualizer3D
          isRecording={listening || isSpeakingTTS || apiLoading}
        />

        {/* Live Status Badge */}
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-normal transition shadow-2xs ${
              sessionStatus === "URGENT_REVIEW_REQUIRED"
                ? "bg-rose-100 text-rose-900 border border-rose-300 font-semibold"
                : historyCompleted
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold"
                : isSpeakingTTS
                ? "bg-sky-50 text-sky-700 ring-1 ring-sky-400/40 animate-pulse"
                : listening
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-400/40 animate-pulse"
                : apiLoading
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-400/40 animate-pulse"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sessionStatus === "URGENT_REVIEW_REQUIRED"
                  ? "bg-rose-600 animate-ping"
                  : historyCompleted
                  ? "bg-emerald-600"
                  : isSpeakingTTS
                  ? "bg-sky-500"
                  : listening
                  ? "bg-emerald-500"
                  : apiLoading
                  ? "bg-amber-500"
                  : "bg-slate-400"
              }`}
            />
            {sessionStatus === "URGENT_REVIEW_REQUIRED"
              ? "🚨 Urgent Triage Review Flagged"
              : historyCompleted
              ? "✓ Clinical History Complete"
              : isSpeakingTTS
              ? `AI Clinical Assistant speaking (${ttsSource})...`
              : listening
              ? "Listening to you (Speak freely)..."
              : apiLoading
              ? "AI reasoning clinical context & red flags..."
              : "Adaptive Clinical Voice & Touch Ready"}
          </span>

          {isCallActive && !listening && !isSpeakingTTS && !apiLoading && !historyCompleted && (
            <button
              onClick={resumeListeningSafe}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title="Resume Microphone"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RED FLAG PRIORITY EMERGENCY TRIAGE BANNER */}
      {/* ========================================================================= */}
      {redFlagAlert && (
        <div className="w-full my-3 p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 text-xs shadow-md space-y-2 animate-pulse text-left">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>URGENT CLINICAL REVIEW REQUIRED</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed font-medium">
            {redFlagAlert.reason || "Patient reported symptoms requiring immediate physician assessment."}
          </p>
          <div className="text-[11px] text-rose-700 bg-rose-100/70 p-2 rounded-xl border border-rose-200">
            <strong>Emergency Protocol Active:</strong> Routine intake stopped. Clinical case flagged for Doctor Triage Station.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HISTORY COMPLETE SUCCESS BANNER */}
      {/* ========================================================================= */}
      {historyCompleted && (
        <div className="w-full my-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs shadow-xs space-y-2.5 text-left">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Clinical Pre-Consultation History Recorded</span>
            </div>
            <button
              onClick={onFinishIntake}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition cursor-pointer shadow-xs"
            >
              <span>Proceed to Summary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-emerald-800 font-normal">
            All key symptoms, duration, severity, and medical history have been synthesized into your clinical draft for the doctor.
          </p>
        </div>
      )}

      {/* Main Hands-Free Voice Call Controls */}
      {!historyCompleted && sessionStatus !== "URGENT_REVIEW_REQUIRED" && (
        <div className="flex items-center justify-center gap-3 my-3 flex-wrap">
          {!isCallActive ? (
            <button
              onClick={handleStartCall}
              className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition shadow-sm cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Start Hands-Free Voice Consultation</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleEndCall}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:scale-98 transition shadow-sm cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Voice Call</span>
              </button>

              {isSpeakingTTS && (
                <button
                  onClick={stopAudio}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-normal text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Interrupt AI</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Language Selector */}
      <div className="text-xs text-slate-400 font-normal mb-3 flex items-center gap-2">
        <span>Language:</span>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="border-b border-slate-200 bg-transparent text-slate-700 text-xs font-normal focus:outline-none cursor-pointer"
        >
          <option value="gu-IN">Gujarati (ગુજરાતી)</option>
          <option value="hi-IN">Hindi (हिंदी)</option>
          <option value="en-IN">English</option>
          <option value="mr-IN">Marathi (मराठी)</option>
          <option value="ta-IN">Tamil (தமிழ்)</option>
        </select>
      </div>

      {/* Live Conversational Chat Stream */}
      <div
        ref={chatScrollRef}
        className="w-full bg-slate-50/80 border border-slate-200/80 rounded-[24px] p-4 sm:p-5 max-h-[300px] overflow-y-auto space-y-3.5 shadow-inner text-left"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${
              msg.role === "patient" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "patient"
                  ? "bg-slate-900 text-white"
                  : msg.isRedFlag
                  ? "bg-rose-600 text-white"
                  : "bg-sky-100 text-sky-700 border border-sky-200"
              }`}
            >
              {msg.role === "patient" ? (
                <User className="w-3.5 h-3.5" />
              ) : msg.isRedFlag ? (
                <ShieldAlert className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
            </div>

            <div
              className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-normal leading-relaxed shadow-2xs group relative ${
                msg.role === "patient"
                  ? "bg-slate-900 text-white rounded-tr-none"
                  : msg.isRedFlag
                  ? "bg-rose-50 text-rose-950 border border-rose-300 rounded-tl-none font-medium"
                  : "bg-white text-slate-900 border border-slate-200/90 rounded-tl-none"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1">{msg.text}</p>
                {msg.role === "assistant" && (
                  <button
                    onClick={() => speakAI(msg.text)}
                    disabled={isSpeakingTTS}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer shrink-0 opacity-80 hover:opacity-100"
                    title="Re-play Speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span
                className={`block text-[10px] mt-1 ${
                  msg.role === "patient"
                    ? "text-slate-400 text-right"
                    : "text-slate-400"
                }`}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {/* Live speech transcription bubble */}
        {listening && transcript && (
          <div className="flex items-start gap-2.5 flex-row-reverse">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <div className="max-w-[82%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-normal bg-slate-800 text-slate-200 rounded-tr-none border border-slate-700">
              <p>
                {transcript}{" "}
                <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse ml-0.5" />
              </p>
              <span className="block text-[10px] text-slate-400 mt-1 text-right">
                Listening...
              </span>
            </div>
          </div>
        )}

        {/* AI Loading indicator */}
        {apiLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 animate-spin">
              <Loader2 className="w-3.5 h-3.5" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl text-xs font-normal bg-white border border-slate-200 text-slate-500 rounded-tl-none flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>AI Clinical Engine is reasoning next question...</span>
            </div>
          </div>
        )}
      </div>

      {/* Adaptive Contextual Answer Chips */}
      {!historyCompleted && sessionStatus !== "URGENT_REVIEW_REQUIRED" && dynamicChips.length > 0 && (
        <div className="w-full mt-3">
          <div className="text-[11px] text-slate-400 font-normal mb-1.5 text-left">
            Or tap quick answer:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
            {dynamicChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleAutoSubmit(chip)}
                disabled={apiLoading || isSpeakingTTS}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual text input fallback */}
      {!historyCompleted && sessionStatus !== "URGENT_REVIEW_REQUIRED" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (textInput.trim()) {
              handleAutoSubmit(textInput.trim());
              setTextInput("");
            }
          }}
          className="w-full mt-4 flex items-center gap-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type or speak symptoms in your language..."
            className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || apiLoading}
            className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center disabled:opacity-40 transition cursor-pointer shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Error Feedback */}
      {apiError && (
        <div className="w-full mt-3 p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-700 text-xs font-normal text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
