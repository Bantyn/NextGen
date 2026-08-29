import React, { useState, useEffect } from 'react';
import { SmartAssistantButton } from './SmartAssistantButton';
import { SmartAssistantPanel } from './SmartAssistantPanel';
import { sendAssistantMessage } from '../../services/smartAssistantService';

const STORAGE_KEY = 'medikiosk_smart_assistant_messages';

/**
 * SmartAssistant Master Component
 * Site-wide intelligent assistant available across all pages.
 */
export const SmartAssistant = ({ defaultRole = 'PATIENT' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    return sessionStorage.getItem('medikiosk_language') || 'English';
  });

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [
      {
        role: 'assistant',
        content: 'Hello! I am your **MediKiosk Smart AI Assistant**. How may I assist you with website navigation, medicine details, or nominal symptom guidance today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgent: false,
        requires_doctor: false,
      },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Update initial greeting when language changes
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    sessionStorage.setItem('medikiosk_language', newLang);

    let greeting = 'Hello! I am your MediKiosk Smart AI Assistant. How may I help you today?';
    if (newLang === 'Hindi') {
      greeting = 'नमस्ते! मैं आपका MediKiosk स्मार्ट AI सहायक हूँ। आज मैं वेबसाइट नेविगेशन, दवाइयों की जानकारी या सामान्य स्वास्थ्य सलाह में आपकी क्या मदद कर सकता हूँ?';
    } else if (newLang === 'Gujarati') {
      greeting = 'નમસ્તે! હું તમારો MediKiosk સ્માર્ટ AI સહાયક છું. આજે હું વેબસાઇટ નેવિગેશન, દવાઓની માહિતી કે સામાન્ય સ્વાસ્થ્ય માર્ગદર્શનમાં તમારી શું મદદ કરી શકું?';
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgent: false,
        requires_doctor: false,
      },
    ]);
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setUnreadCount(0);
  };

  const handleClearChat = () => {
    let greeting = 'Chat history cleared. How may I assist you now?';
    if (language === 'Hindi') greeting = 'बातचीत साफ कर दी गई है। अब मैं आपकी क्या सहायता कर सकता हूँ?';
    if (language === 'Gujarati') greeting = 'સંવાદ સાફ કરવામાં આવ્યો છે. હવે હું તમારી શું મદદ કરી શકું?';

    const initial = [
      {
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgent: false,
        requires_doctor: false,
      },
    ];
    setMessages(initial);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  };

  const handleSendMessage = async (userText) => {
    if (!userText || !userText.trim()) return;

    const userMsg = {
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const historyForContext = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await sendAssistantMessage({
      message: userText.trim(),
      language,
      userContext: {
        user_id: 'web-user',
        role: defaultRole,
        session_id: 'session-' + (sessionStorage.getItem('medikiosk_patient_phone') || 'global'),
      },
      conversationHistory: historyForContext,
    });

    setIsLoading(false);

    const assistantMsg = {
      role: 'assistant',
      content: response.message || "I'm sorry, I could not process your query. Please try again.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      urgent: Boolean(response.urgent),
      requires_doctor: Boolean(response.requires_doctor),
      data: response.data || null,
      intent: response.intent || 'GENERAL',
      animate: true,
    };

    setMessages((prev) => [...prev, assistantMsg]);

    if (!isOpen) {
      setUnreadCount((c) => c + 1);
    }
  };

  return (
    <>
      <SmartAssistantButton isOpen={isOpen} onClick={handleToggle} unreadCount={unreadCount} />

      <SmartAssistantPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    </>
  );
};

export default SmartAssistant;
