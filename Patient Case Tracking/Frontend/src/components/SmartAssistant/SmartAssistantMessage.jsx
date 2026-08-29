import React from 'react';
import { Bot, User, AlertTriangle, ShieldCheck, Pill, Phone, Sparkles, CheckCircle2, Info } from 'lucide-react';

/**
 * Helper to render clean markdown formatting matching HomeView editorial typography
 */
function renderFormattedContent(text) {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
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
  });
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

/**
 * SmartAssistantMessage Component
 * Styled in sync with HomeView cards and badge elements.
 */
export const SmartAssistantMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isUrgent = message.urgent;
  const data = message.data;

  return (
    <div
      className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[88%] ${
        isUser ? 'self-end flex-row-reverse' : 'self-start flex-row'
      } animate-fade-in`}
    >
      {/* Avatar Icon matching HomeView Module Icon Boxes */}
      <div
        className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border ${
          isUser
            ? 'bg-slate-950 text-white border-slate-800'
            : isUrgent
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-sky-50 text-sky-700 border-sky-200'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Bubble matching HomeView Card Glassmorphism */}
      <div
        className={`px-4 py-3.5 rounded-[22px] text-xs space-y-2.5 shadow-2xs ${
          isUser
            ? 'bg-slate-950 text-white rounded-tr-xs font-normal'
            : isUrgent
            ? 'bg-rose-50/95 border border-rose-200 text-rose-950 rounded-tl-xs'
            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
        }`}
      >
        {/* Urgent Emergency Alert Banner */}
        {isUrgent && (
          <div className="flex items-center gap-2 pb-2 mb-1 border-b border-rose-200 text-rose-800 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs">Immediate Medical Attention Recommended</span>
          </div>
        )}

        {/* Message Content */}
        <div className="space-y-1 text-left">{renderFormattedContent(message.content)}</div>

        {/* Structured Medicine Details Card (HomeView Module B/C Card Style) */}
        {!isUser && Array.isArray(data) && data.length > 0 && data[0]?.generic_name && (
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-2 text-[11px] bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sky-800 font-medium">
                <Pill className="w-3.5 h-3.5 text-sky-600" />
                <span>{data[0].name} ({data[0].generic_name})</span>
              </div>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-medium">
                {data[0].category || 'Medicine'}
              </span>
            </div>

            {data[0].dosage_forms && (
              <div className="text-slate-600 font-normal">
                <span className="font-medium text-slate-800">Dosage Forms: </span>
                {data[0].dosage_forms.join(', ')}
              </div>
            )}
            {data[0].storage_instructions && (
              <div className="text-slate-600 font-normal">
                <span className="font-medium text-slate-800">Storage: </span>
                {data[0].storage_instructions}
              </div>
            )}
          </div>
        )}

        {/* Medical Safety Disclaimer */}
        {!isUser && (message.requires_doctor || isUrgent) && (
          <div className="mt-2 pt-2 border-t border-slate-100/90 flex items-center gap-1.5 text-[10px] text-slate-400 font-normal text-left">
            <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Informational guidance from verified database. Always consult your OPD physician.</span>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[9px] pt-0.5 text-right font-normal ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
          {message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default SmartAssistantMessage;
