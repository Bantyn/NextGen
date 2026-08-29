import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles } from 'lucide-react';

/**
 * SmartAssistantInput Component
 * Text & Voice input bar with Web Speech STT integration and quick send.
 */
export const SmartAssistantInput = ({ onSendMessage, disabled, language = 'English' }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      const langMap = {
        English: 'en-IN',
        Hindi: 'hi-IN',
        Gujarati: 'gu-IN',
      };
      recognition.lang = langMap[language] || 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 bg-white/95 border-t border-slate-200/80 backdrop-blur-md rounded-b-3xl">
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-50 border border-slate-200/90 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleListen}
          disabled={disabled}
          title={isListening ? 'Stop listening' : 'Speak message'}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-xs'
              : 'text-slate-500 hover:text-sky-600 hover:bg-slate-200/60'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening...'
              : language === 'Hindi'
              ? 'यहाँ पूछें (जैसे: पेरासिटामोल क्या है?)...'
              : language === 'Gujarati'
              ? 'અહીં પૂછો (જેમ કે: દવા કે લક્ષણો વિશે)...'
              : 'Ask a question or request guidance...'
          }
          className="flex-1 bg-transparent px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="p-2 rounded-xl text-white bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 transition-all cursor-pointer active:scale-95 shadow-2xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-slate-400">
        <span>Press Enter to send</span>
        <span>MediKiosk Verified Knowledge</span>
      </div>
    </div>
  );
};

export default SmartAssistantInput;
