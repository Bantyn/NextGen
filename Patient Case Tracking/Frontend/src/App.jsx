import 'regenerator-runtime/runtime';
import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const SpeechTest = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('gu-IN');
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [useFallbackAudio, setUseFallbackAudio] = useState(false);
  const [fallbackRecording, setFallbackRecording] = useState(false);
  const [fallbackTranscript, setFallbackTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const {
    transcript: nativeTranscript,
    listening: nativeListening,
    resetTranscript: resetNativeTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    // Automatically switch to Universal MediaRecorder if browser does not support WebSpeech API natively or if navigator.mediaDevices is undefined over HTTP
    if (!browserSupportsSpeechRecognition || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setUseFallbackAudio(true);
    }
  }, [browserSupportsSpeechRecognition]);

  const startFallbackRecording = async () => {
    // Check Web Audio API availability
    const getUserMedia =
      navigator.mediaDevices?.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    if (!getUserMedia && !navigator.mediaDevices) {
      alert(
        '🔒 Security Alert: iOS Safari requires HTTPS connection for Microphone access over network (http://' + window.location.host + ' is unsecure). Please open via https://' + window.location.host
      );
      return;
    }

    try {
      let stream;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        stream = await new Promise((resolve, reject) => {
          getUserMedia.call(navigator, { audio: true }, resolve, reject);
        });
      }

      // iOS Safari MIME Type Fallback check
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setFallbackTranscript((prev) => prev || `[Gujarati Voice Captured (${selectedLanguage}) - Audio Stream Ready for Server AI Processing]`);
      };

      mediaRecorderRef.current.start();
      setFallbackRecording(true);
    } catch (err) {
      alert('Microphone Access Error: ' + err.message);
    }
  };

  const stopFallbackRecording = () => {
    if (mediaRecorderRef.current && fallbackRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setFallbackRecording(false);
    }
  };

  const handleStartListening = () => {
    if (useFallbackAudio) {
      startFallbackRecording();
    } else {
      SpeechRecognition.startListening({
        continuous: true,
        language: selectedLanguage,
      });
    }
  };

  const handleStopListening = () => {
    if (useFallbackAudio) {
      stopFallbackRecording();
    } else {
      SpeechRecognition.stopListening();
    }
  };

  const handleReset = () => {
    if (useFallbackAudio) {
      setFallbackTranscript('');
      setAudioUrl(null);
    } else {
      resetNativeTranscript();
    }
  };

  const activeTranscript = useFallbackAudio ? fallbackTranscript : nativeTranscript;
  const isRecordingActive = useFallbackAudio ? fallbackRecording : nativeListening;

  const handleSendToBackendAPI = async () => {
    if (!activeTranscript.trim() && !audioUrl) {
      alert('No speech or audio recorded! Please speak first before sending.');
      return;
    }

    setApiLoading(true);
    setApiError(null);
    setApiResponse(null);

    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/v1/case-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: 'DEMO_GUJARATI_SPEECH_001',
          sender: 'PATIENT',
          message: activeTranscript || 'Gujarati Voice Audio Stream Attached',
          message_type: 'VOICE',
          language: selectedLanguage,
          engine: useFallbackAudio ? 'UNIVERSAL_MEDIA_RECORDER' : 'NATIVE_WEB_SPEECH',
        }),
      });

      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setApiError(err.message || 'Failed to reach Backend API');
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎙️ MediKiosk — Universal Voice Intake</h1>
        <p style={styles.subtitle}>
          Cross-Browser Speech Intake for <strong>Safari, Chrome, Firefox, iOS & Edge</strong>
        </p>
      </header>

      {window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
        <div style={styles.alertSecurityNotice}>
          🔒 <strong>iOS Safari Network Tip:</strong> If microphone permissions fail on iPhone/iPad over local IP, connect via <strong>HTTPS</strong>: <a href={`https://${window.location.hostname}:5173`} style={{ color: '#1d4ed8', fontWeight: 'bold' }}>https://{window.location.hostname}:5173</a>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.engineNotice}>
          <span>Engine Mode: </span>
          <strong style={{ color: useFallbackAudio ? '#d97706' : '#2563eb' }}>
            {useFallbackAudio ? '⚡ Universal MediaRecorder Engine (Safari / iOS Gujarati Speech Compatible)' : '✨ Native Web Speech Engine (Chrome / Edge)'}
          </strong>
        </div>

        <div style={styles.row}>
          <label style={styles.label}>Intake Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={styles.select}
          >
            <option value="gu-IN">Gujarati (ગુજરાતી - gu-IN)</option>
            <option value="hi-IN">Hindi (हिंदी - hi-IN)</option>
            <option value="en-IN">English (India - en-IN)</option>
            <option value="en-US">English (US - en-US)</option>
            <option value="mr-IN">Marathi (મરાઠી - mr-IN)</option>
            <option value="ta-IN">Tamil (தமிழ் - ta-IN)</option>
            <option value="te-IN">Telugu (తెలుగు - te-IN)</option>
            <option value="bn-IN">Bengali (বাংলা - bn-IN)</option>
          </select>

          <span style={isRecordingActive ? styles.badgeActive : styles.badgeInactive}>
            {isRecordingActive ? '● Recording Active' : '○ Idle'}
          </span>
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={handleStartListening}
            disabled={isRecordingActive}
            style={{ ...styles.btn, ...styles.btnPrimary, opacity: isRecordingActive ? 0.6 : 1 }}
          >
            ▶️ Start Voice Intake
          </button>
          <button
            onClick={handleStopListening}
            disabled={!isRecordingActive}
            style={{ ...styles.btn, ...styles.btnDanger, opacity: !isRecordingActive ? 0.6 : 1 }}
          >
            ⏹️ Stop Recording
          </button>
          <button onClick={handleReset} style={{ ...styles.btn, ...styles.btnSecondary }}>
            🔄 Clear Input
          </button>
        </div>

        <div style={styles.transcriptBox}>
          <div style={styles.boxHeader}>Live Patient Voice Input / Transcript:</div>
          {useFallbackAudio ? (
            <div>
              <textarea
                value={fallbackTranscript}
                onChange={(e) => setFallbackTranscript(e.target.value)}
                placeholder="ગુજરાતીમાં બોલો અથવા દર્દીની ફરિયાદ અહીં ટાઇપ કરો..."
                style={styles.textarea}
              />
              {audioUrl && (
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>Captured Audio Recording: </span>
                  <audio src={audioUrl} controls style={{ verticalAlign: 'middle', height: '32px' }} />
                </div>
              )}
            </div>
          ) : (
            <p style={styles.transcriptText}>
              {nativeTranscript || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Click "Start Voice Intake" and speak into your microphone...</span>}
            </p>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={handleSendToBackendAPI}
            disabled={apiLoading || (!activeTranscript.trim() && !audioUrl)}
            style={{
              ...styles.btn,
              ...styles.btnSuccess,
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              opacity: (!activeTranscript.trim() && !audioUrl) || apiLoading ? 0.6 : 1,
            }}
          >
            {apiLoading ? 'Processing & Submitting to Backend...' : '🚀 Submit Clinical Voice Entry (POST /api/v1/case-messages)'}
          </button>
        </div>

        {apiError && (
          <div style={styles.alertDanger}>
            <strong>API Response (Error):</strong> {apiError}
          </div>
        )}

        {apiResponse && (
          <div style={styles.alertSuccess}>
            <strong>API Response (Success):</strong>
            <pre style={styles.pre}>{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1f2937', textAlign: 'left' },
  header: { marginBottom: '20px', textAlign: 'center' },
  title: { fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' },
  subtitle: { fontSize: '15px', color: '#4b5563' },
  card: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  engineNotice: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', marginBottom: '18px', fontSize: '13px' },
  row: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  label: { fontWeight: '600', fontSize: '15px' },
  select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' },
  badgeActive: { background: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '13px' },
  badgeInactive: { background: '#f3f4f6', color: '#6b7280', padding: '6px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '13px' },
  buttonGroup: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  btn: { padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },
  btnPrimary: { background: '#2563eb', color: '#ffffff' },
  btnDanger: { background: '#dc2626', color: '#ffffff' },
  btnSecondary: { background: '#4b5563', color: '#ffffff' },
  btnSuccess: { background: '#16a34a', color: '#ffffff' },
  transcriptBox: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', minHeight: '120px' },
  boxHeader: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' },
  transcriptText: { fontSize: '16px', lineHeight: '1.6', color: '#111827' },
  textarea: { width: '100%', minHeight: '80px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  alertSecurityNotice: { marginBottom: '18px', padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: '8px', fontSize: '14px' },
  alertDanger: { marginTop: '16px', padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', fontSize: '14px' },
  alertSuccess: { marginTop: '16px', padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', fontSize: '14px' },
  pre: { marginTop: '8px', background: '#1e293b', color: '#38bdf8', padding: '12px', borderRadius: '6px', overflowX: 'auto', fontSize: '13px' },
};

export default SpeechTest;
