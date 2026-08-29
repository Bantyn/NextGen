import React from 'react';
import { Bot, User, AlertTriangle, ShieldCheck, Pill, Phone, Sparkles } from 'lucide-react';

/**
 * Helper to render basic markdown formatting cleanly without heavy dependencies
 */
function renderFormattedContent(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let clean = line.trim();

    // Headings
    if (clean.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-xs font-semibold text-slate-900 mt-2 mb-1">
          {clean.replace(/^###\s*/, '')}
        </h4>
      );
    }
    if (clean.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-sm font-semibold text-slate-950 mt-2 mb-1">
          {clean.replace(/^##\s*/, '')}
        </h3>
      );
    }

    // Bullet points
    if (clean.startsWith('• ') || clean.startsWith('- ') || clean.startsWith('* ')) {
      const content = clean.replace(/^[•\-\*]\s*/, '');
      return (
        <li key={idx} className="text-xs text-slate-700 ml-3 list-disc leading-relaxed">
          {renderInlineFormatting(content)}
        </li>
      );
    }

    if (!clean) {
      return <div key={idx} className="h-1.5" />;
    }

    return (
      <p key={idx} className="text-xs text-slate-700 leading-relaxed mb-1">
        {renderInlineFormatting(clean)}
      </p>
    );
  });
}

function renderInlineFormatting(str) {
  // Bold formatting: **bold**
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * SmartAssistantMessage Component
 */
export const SmartAssistantMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isUrgent = message.urgent;
  const data = message.data;

  return (
    <div
      className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] ${
        isUser ? 'self-end flex-row-reverse' : 'self-start flex-row'
      } animate-fade-in`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
          isUser
            ? 'bg-slate-900 text-white'
            : isUrgent
            ? 'bg-rose-100 border border-rose-200 text-rose-700'
            : 'bg-sky-100 border border-sky-200 text-sky-700'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Bubble */}
      <div
        className={`px-4 py-3 rounded-2xl text-xs space-y-2 shadow-2xs ${
          isUser
            ? 'bg-slate-950 text-white rounded-tr-xs'
            : isUrgent
            ? 'bg-rose-50/90 border border-rose-200 text-rose-950 rounded-tl-xs'
            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
        }`}
      >
        {/* Urgent Emergency Alert Banner */}
        {isUrgent && (
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-rose-200 text-rose-800 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Emergency Medical Guidance</span>
          </div>
        )}

        {/* Message Content */}
        <div className="space-y-1">{renderFormattedContent(message.content)}</div>

        {/* Structured Medicine Details Card (if returned by tool) */}
        {!isUser && Array.isArray(data) && data.length > 0 && data[0]?.generic_name && (
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded-xl">
            <div className="flex items-center gap-1 text-sky-700 font-medium">
              <Pill className="w-3.5 h-3.5" />
              <span>Verified Database Record ({data[0].name})</span>
            </div>
            {data[0].dosage_forms && (
              <div className="text-slate-600">
                <span className="font-medium text-slate-800">Forms: </span>
                {data[0].dosage_forms.join(', ')}
              </div>
            )}
            {data[0].storage_instructions && (
              <div className="text-slate-600">
                <span className="font-medium text-slate-800">Storage: </span>
                {data[0].storage_instructions}
              </div>
            )}
          </div>
        )}

        {/* Medical Safety Disclaimer for Assistant */}
        {!isUser && (message.requires_doctor || isUrgent) && (
          <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Informational guide only. Consult a physician for definitive medical decisions.</span>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[9px] pt-0.5 text-right ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
          {message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default SmartAssistantMessage;
