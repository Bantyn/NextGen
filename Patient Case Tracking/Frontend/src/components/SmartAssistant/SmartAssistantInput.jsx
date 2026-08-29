import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles } from 'lucide-react';

/**
 * SmartAssistantInput Component
 * Input bar styled to match HomeView.jsx's interactive voice intake design.
 */
export const SmartAssistantInput = ({ onSendMessage, disabled, language = 'English' }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize SpeechRecognition
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
    <div className="p-3.5 bg-white/95 border-t border-slate-200/80 backdrop-blur-md rounded-b-[32px]">
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-50 border border-slate-200/90 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all shadow-2xs">
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleListen}
          disabled={disabled}
          title={isListening ? 'Stop listening' : 'Speak message'}
          className={`p-2.5 rounded-full transition-all cursor-pointer ${
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
              ? 'Listening to voice...'
              : language === 'Hindi'
              ? 'यहाँ पूछें (जैसे: पेरासिटामोल के उपयोग क्या हैं?)...'
              : language === 'Gujarati'
              ? 'અહીં પૂછો (જેમ કે: દવા કે લક્ષણો વિશે)...'
              : 'Ask a question or request guidance...'
          }
          className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-normal focus:outline-none"
        />

        {/* Send Button matching HomeView CTA style */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="p-2.5 rounded-full text-white bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950 transition-all cursor-pointer active:scale-95 shadow-2xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between px-3 pt-1.5 text-[10px] text-slate-400 font-normal">
        <span>Press Enter to send</span>
        <span>MediKiosk Verified Knowledge Base</span>
      </div>
    </div>
  );
};

export default SmartAssistantInput;
