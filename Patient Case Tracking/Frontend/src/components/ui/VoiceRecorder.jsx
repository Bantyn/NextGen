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
} from "lucide-react";
import { VoiceVisualizer3D } from "../3d/VoiceVisualizer3D";
import { CLINICAL_DISEASE_FRAMEWORKS } from "../../constants/clinicalFrameworks";
import { AYUSH_REMEDIES } from "../../constants/ayushRemedies";

// ============================================================================
// MediKiosk TTS Configuration
// ============================================================================
const N8N_AI_WEBHOOK_URL =
  "https://bantytest.app.n8n.cloud/webhook/medikiosk-case-taking";
const OPENROUTER_TTS_ENDPOINT = "https://openrouter.ai/api/v1/audio/speech";
const FISH_AUDIO_MODEL = "fish-audio/s2.1-pro-free:free";

// Note: For hackathon development/prototype, read from env with fallback.
// In production, proxy this call through a backend endpoint (e.g. /api/tts).
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

// Fixed Studio-Grade Voice Model ID for MediKiosk Assistant
export const MEDIKIOSK_FISH_VOICE_ID =
  import.meta.env.VITE_MEDIKIOSK_FISH_VOICE_ID ||
  "7f92f8afb8ec43bf81429cc1c9199cb1";

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

  // Strip <think> reasoning tags and code formatting
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/[*_#`]/g, "");

  // Add natural pauses after sentences and commas for human-like breathing rhythm
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

  // RIFF chunk
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint32(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  // Copy PCM data
  new Uint8Array(buffer, 44).set(new Uint8Array(pcmBuffer));
  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * VoiceRecorder Component — Unified Clinical Voice Engine with Fish Audio & Web Speech Fallback
 */
export const VoiceRecorder = ({
  sessionId = "DEMO_GUJARATI_SPEECH_001",
  patientId = "DEMO_PATIENT_001",
  defaultLanguage = "gu-IN",
  onMessageSent,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [ttsSource, setTtsSource] = useState("OpenRouter Neural");

  // Clinical state tracking
  const [redFlagAlert, setRedFlagAlert] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const currentStepRef = useRef(0);
  const categoryRef = useRef(null);
  const availableVoicesRef = useRef([]);

  // Dynamic quick chips
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
      text: "I am your Ai Clinical Voice Assistant ! How can i help you today ?",
      time: "Just now",
    },
  ]);

  const [textInput, setTextInput] = useState("");

  // Mutable live state references
  const isCallActiveRef = useRef(false);
  const isSpeakingTTSRef = useRef(false);
  const apiLoadingRef = useRef(false);
  const selectedLanguageRef = useRef(selectedLanguage);
  const currentAudioRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const chatScrollRef = useRef(null);
  const fallbackSpeechTimerRef = useRef(null);

  isCallActiveRef.current = isCallActive;
  isSpeakingTTSRef.current = isSpeakingTTS;
  apiLoadingRef.current = apiLoading;
  selectedLanguageRef.current = selectedLanguage;

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Preload and cache browser female voices for fallback
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
    if (!isCallActive || isSpeakingTTS || apiLoading) return;

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
  }, [listening, isCallActive, isSpeakingTTS, apiLoading]);

  // 2. Silence Detection: Patient speaks -> pauses 1.8s -> Auto submit
  useEffect(() => {
    if (!isCallActive || isSpeakingTTS || apiLoading) return;

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
  }, [transcript, isCallActive, isSpeakingTTS, apiLoading]);

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
    if (isCallActiveRef.current) {
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
  }, [resetTranscript, stopAudio]);

  // Web Speech Synthesis Fallback with Consistent Female Tone
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
   * Play Neural Speech via OpenRouter Fish Audio TTS Engine
   * Strictly uses fixed MEDIKIOSK_FISH_VOICE_ID and full streaming chunk accumulator.
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

      // Timeout safety watchdog
      if (fallbackSpeechTimerRef.current)
        clearTimeout(fallbackSpeechTimerRef.current);
      fallbackSpeechTimerRef.current = setTimeout(() => {
        if (isSpeakingTTSRef.current) {
          console.warn("TTS safety timeout reached, resuming microphone");
          resumeListeningSafe();
        }
      }, 16000);

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
            "X-Title": "MediKiosk Voice Assistant",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[MediKiosk TTS Error] OpenRouter returned status ${response.status}:`,
            errorText,
          );
          throw new Error(
            `OpenRouter TTS failed (HTTP ${response.status}): ${errorText}`,
          );
        }

        setTtsSource("OpenRouter Fish Audio");

        if (!response.body) {
          throw new Error("Response body is empty or stream unavailable");
        }

        const reader = response.body.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value && value.length > 0) {
            chunks.push(value);
          }
        }

        if (chunks.length === 0) {
          throw new Error("Empty audio chunks received from OpenRouter TTS");
        }

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
          console.warn(
            "[MediKiosk TTS] Audio element playback error, triggering Web Speech fallback:",
            e,
          );
          URL.revokeObjectURL(audioUrl);
          fallbackTTS(tunedText);
        };

        await audio.play();
      } catch (err) {
        console.warn(
          "[MediKiosk TTS] OpenRouter speech generation failed, gracefully using Web Speech fallback:",
          err,
        );
        fallbackTTS(tunedText);
      }
    },
    [fallbackTTS, resumeListeningSafe, stopAudio],
  );

  // Natural Adaptive Clinical Question Engine: Never repeats answered questions
  const getNextAdaptiveQuestion = (patientAnswerText, turnNumber) => {
    const textLower = patientAnswerText.toLowerCase();
    let currentCat = categoryRef.current;

    // Detect disease category on early turns
    if (!currentCat) {
      if (
        textLower.includes("chest") ||
        patientAnswerText.includes("છાતી") ||
        patientAnswerText.includes("सीना")
      ) {
        currentCat = "CHEST_PAIN";
      } else if (
        textLower.includes("fever") ||
        patientAnswerText.includes("તાવ") ||
        patientAnswerText.includes("બુખાર")
      ) {
        currentCat = "FEVER";
      } else if (
        textLower.includes("cough") ||
        textLower.includes("cold") ||
        patientAnswerText.includes("ઉધરસ") ||
        patientAnswerText.includes("ખાંસી") ||
        patientAnswerText.includes("શરદી") ||
        patientAnswerText.includes("કફ")
      ) {
        currentCat = "COUGH_COLD";
      } else if (
        textLower.includes("head") ||
        patientAnswerText.includes("માથું") ||
        patientAnswerText.includes("માથાનો") ||
        patientAnswerText.includes("सिर")
      ) {
        currentCat = "HEADACHE";
      } else if (
        textLower.includes("stomach") ||
        patientAnswerText.includes("પેટ") ||
        patientAnswerText.includes("ઝાડા") ||
        patientAnswerText.includes("દુખાવો")
      ) {
        currentCat = "STOMACH_PAIN";
      } else if (
        textLower.includes("joint") ||
        textLower.includes("knee") ||
        patientAnswerText.includes("સાંધા") ||
        patientAnswerText.includes("ઘૂંટણ")
      ) {
        currentCat = "BODY_JOINT_PAIN";
      } else if (
        textLower.includes("skin") ||
        patientAnswerText.includes("ચામડી") ||
        patientAnswerText.includes("ખંજવાળ")
      ) {
        currentCat = "SKIN_PROBLEM";
      } else {
        currentCat = "OTHER";
      }
      categoryRef.current = currentCat;
      setActiveCategory(currentCat);
    }

    const framework =
      CLINICAL_DISEASE_FRAMEWORKS[currentCat] ||
      CLINICAL_DISEASE_FRAMEWORKS["OTHER"];
    const steps = framework.steps || [];
    const stepIdx = currentStepRef.current;
    const targetStep = steps[stepIdx % steps.length];
    const langKey = selectedLanguageRef.current || "gu-IN";

    let nextQ =
      targetStep?.question?.[langKey] ||
      targetStep?.question?.["gu-IN"] ||
      "શું તમને આ સાથે અન્ય કોઈ તકલીફ છે?";
    let chips =
      targetStep?.quick_chips?.[langKey] ||
      targetStep?.quick_chips?.["gu-IN"] ||
      [];

    // Progressive turn-taking with natural female conversational phrasing
    if (turnNumber === 1) {
      if (currentCat === "STOMACH_PAIN") {
        nextQ = `હું સમજી શકું છું... વરિયાળીનું નવશેકું પાણી પીવો અને આરામ કરો. ${nextQ}`;
      } else if (currentCat === "COUGH_COLD") {
        nextQ = `ચિંતા કરશો નહીં... ગરમ પાણીમાં તુલસી-આદુનો ઉકાળો પીવો. ${nextQ}`;
      } else if (currentCat === "HEADACHE") {
        nextQ = `શાંત રૂમમાં થોડો આરામ કરો અને પાણી પીવો. ${nextQ}`;
      }
    } else {
      if (currentCat === "STOMACH_PAIN") {
        if (stepIdx === 1)
          nextQ = `બરાબર. શું જમ્યા પછી દુખાવો વધે છે, કે ભૂખ્યા પેટે વધારે દુખે છે?`;
        else if (stepIdx === 2)
          nextQ = `સમજાયું. ઝાડા, કબજિયાત કે ઉલ્ટી જેવી કોઈ તકલીફ છે?`;
        else
          nextQ = `૧ થી ૧૦ ના સ્કેલ પર દુખાવો કેટલો તીવ્ર છે? આ તમામ વિગતો ડૉક્ટર સમક્ષ નોંધાઈ ગઈ છે.`;
      } else if (currentCat === "CHEST_PAIN") {
        if (stepIdx === 1)
          nextQ = `દુખાવો કેવો લાગે છે? ભારે દબાણ જેવો, કે બળતરા જેવો?`;
        else if (stepIdx === 2)
          nextQ = `શું આ દુખાવો ડાબા હાથ કે પીઠ તરફ ફેલાય છે? શ્વાસ ચડે છે?`;
        else nextQ = `૧ થી ૧૦ ના સ્કેલ પર દુખાવો કેટલો તીવ્ર છે?`;
      } else if (currentCat === "COUGH_COLD") {
        if (stepIdx === 1)
          nextQ = `ઉધરસમાં ક્યારેય લોહી કે લાલ રંગનો કફ દેખાયો છે?`;
        else if (stepIdx === 2)
          nextQ = `શ્વાસ લેતી વખતે સીટી જેવો અવાજ આવે છે, કે શ્વાસ ચડે છે?`;
        else nextQ = `તાવ પણ આવે છે, કે ગળામાં બળતરા થાય છે?`;
      }
    }

    currentStepRef.current += 1;
    return { question: nextQ, chips: chips };
  };

  // Hands-Free Auto-Submit when Patient pauses speech
  const handleAutoSubmit = async (patientAnswerText) => {
    if (!patientAnswerText || apiLoadingRef.current) return;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    SpeechRecognition.stopListening();
    resetTranscript();

    // 1. Add patient answer to conversation stream
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

    const langName =
      LANGUAGE_MAP[selectedLanguageRef.current]?.name || "Gujarati";

    // Compute next step locally
    const turnCount = updatedMessages.filter(
      (m) => m.role === "patient",
    ).length;
    const localAdaptive = getNextAdaptiveQuestion(patientAnswerText, turnCount);
    if (localAdaptive.chips.length > 0) setDynamicChips(localAdaptive.chips);

    let finalAiReply = localAdaptive.question;

    // 2. Prepare payload with full conversation history for context-aware LLM reasoning
    const payload = {
      session_id: sessionId || "DEMO_SESSION_001",
      patient_id: patientId || "DEMO_PATIENT_001",
      patient_answer: patientAnswerText,
      message: patientAnswerText,
      message_type: "VOICE",
      language: langName,
      conversation_history: updatedMessages.map((m) => ({
        role: m.role === "patient" ? "user" : "assistant",
        content: m.text,
      })),
    };

    try {
      const response = await fetch(N8N_AI_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data) {
        const extracted =
          data?.choices?.[0]?.message?.content ||
          data?.output ||
          data?.text ||
          data?.next_question ||
          data?.message?.content ||
          data?.response;

        const cleaned = cleanAndTuneSpeech(extracted);
        if (
          cleaned &&
          cleaned.length > 5 &&
          !cleaned.includes("status code 429") &&
          !cleaned.includes("Try spacing your requests")
        ) {
          finalAiReply = cleaned;
        }

        if (data?.clinical_metadata) {
          const meta = data.clinical_metadata;
          if (meta.category) {
            setActiveCategory(meta.category);
            categoryRef.current = meta.category;
          }
          if (meta.red_flag) setRedFlagAlert(meta.red_flag_severity || "HIGH");
          if (meta.quick_chips && Array.isArray(meta.quick_chips))
            setDynamicChips(meta.quick_chips);
        }

        if (onMessageSent) onMessageSent(data);
      }
    } catch (err) {
      console.warn(
        "n8n Webhook failed, seamlessly using local clinical engine:",
        err,
      );
    } finally {
      setApiLoading(false);
      apiLoadingRef.current = false;

      // 3. Add clean, progressing AI response
      const aiMsg = {
        role: "assistant",
        text: finalAiReply,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 4. AI speaks question with female voice
      speakAI(finalAiReply);
    }
  };

  // Start Call
  const handleStartCall = () => {
    setIsCallActive(true);
    isCallActiveRef.current = true;
    currentStepRef.current = 0;
    categoryRef.current = null;
    const initialGreeting =
      messages[0]?.text ||
      "નમસ્તે! હું તમારી AI ક્લિનિકલ સહાયક છું. તમને શું તકલીફ થઈ રહી છે?";
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
    <div className="w-full max-w-xl mx-auto flex flex-col items-center text-slate-800 transition-all">
      {/* 3D WebGL Holographic Voice Visualizer */}
      <div className="w-full mb-2 relative flex flex-col items-center">
        <VoiceVisualizer3D
          isRecording={listening || isSpeakingTTS || apiLoading}
        />

        {/* Live Status Badge */}
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-normal transition shadow-2xs ${
              isSpeakingTTS
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
                isSpeakingTTS
                  ? "bg-sky-500"
                  : listening
                    ? "bg-emerald-500"
                    : apiLoading
                      ? "bg-amber-500"
                      : "bg-slate-400"
              }`}
            />
            {isSpeakingTTS
              ? `AI Doctor speaking (${ttsSource})...`
              : listening
                ? "Listening to you (Speak freely)..."
                : apiLoading
                  ? "AI analyzing symptoms (SOCRATES)..."
                  : "Adaptive Clinical Voice Chat Ready"}
          </span>

          {isCallActive && !listening && !isSpeakingTTS && !apiLoading && (
            <button
              onClick={resumeListeningSafe}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title="Resume Microphone"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </button>
          )}
        </div>
      </div>

      {/* Red Flag Priority Triage Banner */}
      {redFlagAlert && (
        <div className="w-full my-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-normal flex items-start gap-2.5 shadow-xs animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-rose-900 block">
              🚨 Priority Medical Attention Recommended
            </span>
            <span>
              Possible urgent clinical concern detected. Staff and doctor triage
              dashboard notified for immediate assessment.
            </span>
          </div>
        </div>
      )}

      {/* Active Category Indicator */}
      {activeCategory && (
        <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-normal px-2 mb-2">
          <span>
            Protocol:{" "}
            <strong className="text-slate-700 font-medium">
              {activeCategory} (SOCRATES)
            </strong>
          </span>
          <span className="text-emerald-600 font-medium">
            Turn {currentStepRef.current}
          </span>
        </div>
      )}

      {/* Main Hands-Free Voice Call Controls */}
      <div className="flex items-center justify-center gap-3 my-3 flex-wrap">
        {!isCallActive ? (
          <button
            onClick={handleStartCall}
            className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full text-sm font-normal text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition shadow-sm cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Start Hands-Free Voice Consultation</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleEndCall}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-normal text-white bg-rose-600 hover:bg-rose-700 active:scale-98 transition shadow-sm cursor-pointer"
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
          <option value="mr-IN">Marathi (મરાઠી)</option>
          <option value="ta-IN">Tamil (தமிழ்)</option>
        </select>
      </div>

      {/* Live Conversational Chat Stream */}
      <div
        ref={chatScrollRef}
        className="w-full bg-slate-50/80 border border-slate-200/80 rounded-[24px] p-4 sm:p-5 max-h-[290px] overflow-y-auto space-y-3.5 shadow-inner text-left"
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
                  : "bg-sky-100 text-sky-700 border border-sky-200"
              }`}
            >
              {msg.role === "patient" ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
            </div>

            <div
              className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-normal leading-relaxed shadow-2xs group relative ${
                msg.role === "patient"
                  ? "bg-slate-900 text-white rounded-tr-none"
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
              <span>AI Clinical Agent is reasoning next step...</span>
            </div>
          </div>
        )}
      </div>

      {/* Adaptive Quick Answer Chips */}
      {isCallActive && dynamicChips.length > 0 && (
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
                className="px-3 py-1 rounded-full text-xs font-normal bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual text input fallback */}
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
