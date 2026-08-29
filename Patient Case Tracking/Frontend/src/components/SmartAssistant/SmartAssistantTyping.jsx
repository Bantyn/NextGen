import React from 'react';
import { Bot } from 'lucide-react';

/**
 * SmartAssistantTyping Component
 * Shimmering loading indicator while assistant reasons over MongoDB knowledge tools.
 */
export const SmartAssistantTyping = () => {
  return (
    <div className="flex items-start gap-2.5 max-w-[85%] self-start animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 mt-0.5">
        <Bot className="w-4 h-4" />
      </div>

      <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-slate-100/90 border border-slate-200/80 text-slate-800 text-xs shadow-2xs">
        <div className="flex items-center gap-1.5 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce"></div>
          <span className="text-[11px] text-slate-500 font-normal ml-2">Consulting knowledge base...</span>
        </div>
      </div>
    </div>
  );
};

export default SmartAssistantTyping;
