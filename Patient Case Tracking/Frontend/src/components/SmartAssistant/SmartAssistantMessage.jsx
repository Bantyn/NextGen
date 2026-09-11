import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  AlertTriangle,
  ShieldCheck,
  Pill,
  Phone,
  Sparkles,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  MapPin,
  Users,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';

/**
 * Helper to render clean markdown formatting matching HomeView editorial typography
 */
function renderFormattedContent(text, isStreaming = false) {
  if (!text) return null;

  const lines = text.split('\n');
  return (
    <div className={isStreaming ? 'gpt-word-stream' : ''}>
      {lines.map((line, idx) => {
        let clean = line.trim();

        // Headings
        if (clean.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-medium text-slate-950 mt-2 mb-1">
              {clean.replace(/^###\s*/, '')}
            </h4>
          );
        }
        if (clean.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm font-medium text-slate-950 mt-2.5 mb-1">
              {clean.replace(/^##\s*/, '')}
            </h3>
          );
        }

        // Bullet points
        if (clean.startsWith('• ') || clean.startsWith('- ') || clean.startsWith('* ')) {
          const content = clean.replace(/^[•\-\*]\s*/, '');
          return (
            <li key={idx} className="text-xs text-slate-600 ml-3 list-disc leading-relaxed font-normal">
              {renderInlineFormatting(content)}
            </li>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(clean)) {
          const content = clean.replace(/^\d+\.\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 font-normal leading-relaxed mb-1">
              <span className="font-medium text-slate-900 shrink-0">•</span>
              <span>{renderInlineFormatting(content)}</span>
            </div>
          );
        }

        if (!clean) {
          return <div key={idx} className="h-1.5" />;
        }

        return (
          <p key={idx} className="text-xs text-slate-700 leading-relaxed font-normal mb-1">
            {renderInlineFormatting(clean)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(str) {
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-medium text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// Module-level registry to guarantee each message animates strictly ONCE in its entire lifecycle
const animatedMessagesRegistry = new Set();

const getMessageKey = (msg) => {
  if (!msg) return '';
  if (msg.id) return String(msg.id);
  return `${msg.role}_${msg.timestamp || ''}_${(msg.content || '').slice(0, 40)}`;
};

/**
 * SmartAssistantMessage Component
 * Enhanced with smooth, soft-fade ChatGPT-style streaming animation.
 */
export const SmartAssistantMessage = ({ message, onActionClick }) => {
  const isUser = message.role === 'user';
  const isUrgent = message.urgent;
  const data = message.data;
  const doctors = message.doctors || (message.data?.doctors) || [];
  const actions = message.actions || [];
  const heatwaveGuidance = message.data?.heatwave_guidance || null;

  const msgKey = getMessageKey(message);
  const alreadyAnimated = animatedMessagesRegistry.has(msgKey);
  const shouldAnimate = !isUser && message.animate === true && !alreadyAnimated;

  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : message.content || '');
  const [isTyping, setIsTyping] = useState(shouldAnimate);
  const [isExpanded, setIsExpanded] = useState(false);
  const animIndexRef = useRef(0);

  // Extract structured medicine data if present
  const medData = Array.isArray(data)
    ? data[0]
    : data && (data.medicine_name || data.generic_name || data.name)
    ? data
    : null;

  useEffect(() => {
    if (!shouldAnimate || !message.content) {
      setDisplayedText(message.content || '');
      setIsTyping(false);
      return;
    }

    // Mark as animated immediately so it never re-animates on re-renders or panel toggle
    animatedMessagesRegistry.add(msgKey);
    setDisplayedText('');
    setIsTyping(true);
    animIndexRef.current = 0;

    const fullText = message.content;
    const words = fullText.split(' ');
    const totalWords = words.length;

    // Slower, calm, natural ChatGPT conversational streaming pace (65ms per word)
    const intervalTime = 65;

    const timer = setInterval(() => {
      animIndexRef.current += 1;
      if (animIndexRef.current >= totalWords) {
        setDisplayedText(fullText);
        setIsTyping(false);
        clearInterval(timer);
      } else {
        setDisplayedText(words.slice(0, animIndexRef.current).join(' '));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [message.content, shouldAnimate, msgKey]);

  // Click to instantly skip typing animation
  const handleSkipAnimation = () => {
    if (isTyping) {
      animatedMessagesRegistry.add(msgKey);
      setDisplayedText(message.content || '');
      setIsTyping(false);
    }
  };

  return (
    <div
      className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[88%] ${
        isUser ? 'self-end flex-row-reverse' : 'self-start flex-row'
      } animate-fade-in`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border ${
          isUser
            ? 'bg-white text-slate-700 border-slate-200'
            : isUrgent
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-sky-50 text-sky-700 border-sky-200'
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-slate-700" /> : isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Bubble */}
      <div
        onClick={handleSkipAnimation}
        title={isTyping ? 'Click to show full message' : undefined}
        className={`px-4 py-3.5 rounded-[22px] text-xs space-y-2.5 shadow-2xs transition-all duration-300 ${
          isUser
            ? 'bg-white border border-slate-200/90 text-slate-900 rounded-tr-xs font-normal'
            : isUrgent
            ? 'bg-rose-50/95 border border-rose-200 text-rose-950 rounded-tl-xs'
            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
        } ${isTyping ? 'cursor-pointer' : ''}`}
      >
        {/* Urgent Emergency Alert Banner */}
        {isUrgent && (
          <div className="flex items-center gap-2 pb-2 mb-1 border-b border-rose-200 text-rose-800 font-medium animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs">Immediate Medical Attention Recommended</span>
          </div>
        )}

        {/* Message Content with Soft-Fade Streaming */}
        <div className="space-y-1 text-left transition-opacity duration-300 ease-out">
          {renderFormattedContent(displayedText, isTyping)}
        </div>

        {/* Structured Medicine Details Card (Supports both Local and openFDA verified data) */}
        {!isUser && !isTyping && medData && (medData.generic_name || medData.medicine_name || medData.name) && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2.5 text-[11px] bg-slate-50/95 p-3.5 rounded-2xl border border-slate-200/90 text-left animate-fade-in shadow-2xs">
            {/* Header: Medicine Name & Badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 text-slate-950 font-medium">
                <Pill className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {medData.medicine_name || medData.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    {Array.isArray(medData.generic_name)
                      ? medData.generic_name.join(', ')
                      : medData.generic_name}
                  </div>
                </div>
              </div>

              {/* Verified Source Badge */}
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-medium border ${
                    medData.source === 'openfda'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                      : 'bg-sky-50 text-sky-800 border-sky-200/90'
                  }`}
                >
                  {medData.source === 'openfda' ? 'FDA Drug Labeling' : 'MediKiosk Database'}
                </span>
              </div>
            </div>

            {/* Quick Summary / Indication Preview */}
            {(medData.indications_and_usage?.[0] || medData.purpose?.[0]) && (
              <div className="text-slate-600 font-normal leading-relaxed text-[11px] pt-1 border-t border-slate-150/70">
                <span className="font-medium text-slate-800">Indications: </span>
                {String(medData.indications_and_usage?.[0] || medData.purpose?.[0])
                  .replace(/^(?:INDICATIONS AND USAGE|INDICATIONS & USAGE|PURPOSE)\s*[:-]?\s*/i, '')
                  .slice(0, 160)}
                {(medData.indications_and_usage?.[0] || medData.purpose?.[0])?.length > 160 ? '...' : ''}
              </div>
            )}

            {/* Expandable Label Details */}
            {isExpanded && (
              <div className="space-y-2 pt-2 border-t border-slate-200/70 text-[11px] text-slate-600 animate-fade-in">
                {/* Dosage Forms */}
                {(medData.dosage_form?.length > 0 || medData.dosage_forms?.length > 0) && (
                  <div>
                    <span className="font-medium text-slate-800">Dosage Forms: </span>
                    {(medData.dosage_form || medData.dosage_forms).join(', ')}
                  </div>
                )}

                {/* Key Warnings */}
                {(medData.warnings?.length > 0 || medData.precautions_and_warnings?.length > 0) && (
                  <div>
                    <span className="font-medium text-slate-800">Warnings & Precautions: </span>
                    {String(medData.warnings?.[0] || medData.precautions_and_warnings?.[0])
                      .replace(/^WARNINGS\s*[:-]?\s*/i, '')
                      .slice(0, 180)}...
                  </div>
                )}

                {/* Side Effects */}
                {(medData.adverse_reactions?.length > 0 || medData.common_side_effects?.length > 0) && (
                  <div>
                    <span className="font-medium text-slate-800">Adverse Reactions: </span>
                    {String(medData.adverse_reactions?.[0] || medData.common_side_effects?.join(', '))
                      .replace(/^(?:ADVERSE REACTIONS|ADVERSE EXPERIENCES)\s*[:-]?\s*/i, '')
                      .slice(0, 180)}...
                  </div>
                )}

                {/* Drug Interactions */}
                {medData.drug_interactions?.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-800">Drug Interactions: </span>
                    {String(medData.drug_interactions[0])
                      .replace(/^Drug Interactions\s*[:-]?\s*/i, '')
                      .slice(0, 180)}...
                  </div>
                )}

                {/* Storage */}
                {(medData.storage?.length > 0 || medData.storage_instructions) && (
                  <div>
                    <span className="font-medium text-slate-800">Storage: </span>
                    {String(medData.storage?.[0] || medData.storage_instructions).replace(/^Storage\s*[:-]?\s*/i, '')}
                  </div>
                )}

                {/* Manufacturer */}
                {medData.manufacturer?.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-800">Manufacturer: </span>
                    {medData.manufacturer[0]}
                  </div>
                )}
              </div>
            )}

            {/* Toggle Expand / Collapse Details Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="inline-flex items-center gap-1 text-[10px] text-sky-700 hover:text-sky-900 font-medium cursor-pointer pt-0.5 transition"
            >
              {isExpanded ? (
                <>
                  <span>Hide Labeling Details</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>View Full Labeling Details</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Structured Verified Doctor Recommendation Cards */}
        {!isUser && !isTyping && doctors && doctors.length > 0 && (
          <div className="mt-2.5 space-y-2.5 pt-1 animate-fade-in text-left">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>Verified Doctors & Live OPD Schedule</span>
            </div>

            {doctors.map((doc, idx) => (
              <div
                key={doc.doctor_id || idx}
                className="p-3 bg-slate-50/95 border border-slate-200/90 rounded-2xl space-y-2 text-left shadow-2xs hover:border-sky-300/80 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 leading-snug">
                      {doc.doctor_name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {doc.qualification}
                    </div>
                    <div className="text-[11px] text-sky-800 font-medium mt-0.5">
                      {doc.specialty} • {doc.department}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${
                      doc.available_today
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {doc.available_today ? 'Available Today' : 'Shift Off'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.room}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Next: <strong className="text-slate-800 font-medium">{doc.next_available_slot}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <Users className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Live OPD Queue: <strong className="text-slate-800 font-medium">{doc.queue_position} waiting</strong> (~{doc.estimated_wait_time} wait)</span>
                  </div>
                </div>

                <div className="pt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onActionClick) {
                        onActionClick({
                          type: 'BOOK_APPOINTMENT',
                          doctor_id: doc.doctor_id,
                          doctor_name: doc.doctor_name,
                          label: `Book appointment with ${doc.doctor_name}`,
                        });
                      }
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-medium shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Book Appointment</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onActionClick) {
                        onActionClick({
                          type: 'VIEW_OPD_QUEUE',
                          department: doc.department,
                          label: `View ${doc.specialty} OPD Queue`,
                        });
                      }
                    }}
                    className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3 h-3" />
                    <span>View Queue</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Structured Interactive Action Pills */}
        {!isUser && !isTyping && actions && actions.length > 0 && (
          <div className="mt-2 pt-1 flex items-center gap-1.5 flex-wrap text-left animate-fade-in">
            {actions.map((act, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onActionClick) onActionClick(act);
                }}
                className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white hover:bg-sky-50 text-sky-800 border border-slate-200/90 hover:border-sky-300 shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <span>{act.label}</span>
                <ArrowRight className="w-2.5 h-2.5 text-sky-600" />
              </button>
            ))}
          </div>
        )}

        {/* Medical Safety Disclaimer */}
        {!isUser && !isTyping && (message.requires_doctor || isUrgent || medData || (doctors && doctors.length > 0)) && (
          <div className="mt-2 pt-2 border-t border-slate-100/90 flex items-center gap-1.5 text-[10px] text-slate-400 font-normal text-left animate-fade-in">
            <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              Informational guidance from {medData?.source === 'openfda' ? 'FDA drug labeling' : 'verified database'}. Always consult your OPD physician or pharmacist.
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-[9px] pt-0.5 text-right font-normal text-slate-400">
          {message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default SmartAssistantMessage;
