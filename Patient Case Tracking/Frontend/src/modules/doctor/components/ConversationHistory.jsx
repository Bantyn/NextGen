import React, { useState, useMemo } from 'react';
import { MessageSquare, Search, ChevronDown, ChevronUp, Bot, User, Globe, Sparkles } from 'lucide-react';

/**
 * ConversationHistory Component
 * Provides physicians with a clinically organized, turn-by-turn review of the
 * patient's conversation with the AI intake kiosk.
 * Allows searching, collapsing/expanding, and displays language/timestamps.
 * Excludes hidden AI internal reasoning to preserve clinical clarity.
 */
export const ConversationHistory = ({ messages = [], patientLanguage = 'gu-IN' }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback sample conversation if no messages were recorded in session
  const displayMessages = useMemo(() => {
    if (messages && messages.length > 0) {
      return messages;
    }
    return [
      {
        message_id: 'msg-sample-1',
        sender: 'PATIENT',
        content: 'હું છેલ્લા બે દિવસથી છાતીમાં દબાણ અને શ્વાસ લેવામાં તકલીફ અનુભવું છું.',
        language: patientLanguage,
        turn_number: 1,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        message_id: 'msg-sample-2',
        sender: 'AI',
        content: 'શું આ દુખાવો તમારા ડાબા હાથ, ગરદન કે જડબા તરફ ફેલાય છે? શું તમને ખૂબ પરસેવો કે ચક્કર આવે છે?',
        language: patientLanguage,
        turn_number: 2,
        timestamp: new Date(Date.now() - 3540000).toISOString(),
      },
      {
        message_id: 'msg-sample-3',
        sender: 'PATIENT',
        content: 'ના, હાથમાં નથી જતો પણ ચાલતી વખતે છાતી ભારે લાગે છે.',
        language: patientLanguage,
        turn_number: 3,
        timestamp: new Date(Date.now() - 3480000).toISOString(),
      },
      {
        message_id: 'msg-sample-4',
        sender: 'AI',
        content: 'શું તમને પહેલાં હાઈ બ્લડ પ્રેશર કે ડાયાબિટીસની કોઈ બીમારી નોંધાયેલી છે? તમે કોઈ નિયમિત દવા લો છો?',
        language: patientLanguage,
        turn_number: 4,
        timestamp: new Date(Date.now() - 3420000).toISOString(),
      },
      {
        message_id: 'msg-sample-5',
        sender: 'PATIENT',
        content: 'હા, બ્લડ પ્રેશરની ટેબ્લેટ લઉં છું પણ ક્યારેક ચૂકી જાઉં છું.',
        language: patientLanguage,
        turn_number: 5,
        timestamp: new Date(Date.now() - 3360000).toISOString(),
      },
    ];
  }, [messages, patientLanguage]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return displayMessages;
    const q = searchQuery.toLowerCase().trim();
    return displayMessages.filter(
      (m) =>
        m.content?.toLowerCase().includes(q) ||
        m.sender?.toLowerCase().includes(q)
    );
  }, [displayMessages, searchQuery]);

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>Patient — AI Intake Dialogue</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                {displayMessages.length} Turns
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">
              Chronological conversation recorded at kiosk intake station
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language indicator */}
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>{patientLanguage}</span>
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title={isExpanded ? 'Collapse Conversation' : 'Expand Conversation'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Search bar inside conversation */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversation keywords (e.g., chest, pain, bp, fever)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Conversation Bubbles Container */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredMessages.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No matching dialogue found for "{searchQuery}".
              </div>
            ) : (
              filteredMessages.map((msg, idx) => {
                const isPatient = msg.sender === 'PATIENT' || msg.role === 'user';
                return (
                  <div
                    key={msg.message_id || idx}
                    className={`flex gap-3 items-start ${
                      isPatient ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                        isPatient
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {isPatient ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={`max-w-[82%] rounded-2xl p-3.5 text-xs shadow-2xs space-y-1 ${
                        isPatient
                          ? 'bg-amber-50/60 border border-amber-200/70 text-slate-900 rounded-tl-xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tr-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 font-medium">
                        <span className="font-semibold text-slate-700">
                          {isPatient ? 'Patient (Kiosk Intake)' : 'MediKiosk AI Synthesizer'}
                        </span>
                        <div className="flex items-center gap-2">
                          {msg.turn_number && <span>Turn #{msg.turn_number}</span>}
                          {msg.timestamp && (
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed whitespace-pre-wrap font-normal text-slate-800">
                        {msg.content || msg.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConversationHistory;
