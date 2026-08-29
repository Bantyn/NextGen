import React from 'react';
import { HelpCircle, Pill, Thermometer, Phone, QrCode } from 'lucide-react';

/**
 * SmartAssistantQuickActions Component
 * Styled in sync with HomeView.jsx's pill action badges.
 */
export const SmartAssistantQuickActions = ({ onSelectAction, disabled }) => {
  const actions = [
    { id: 'website_help', label: 'Website Guide', icon: HelpCircle, text: 'How do I start a patient intake session?' },
    { id: 'medicine_help', label: 'Medicine Helper', icon: Pill, text: 'What is Paracetamol used for?' },
    { id: 'symptom_help', label: 'Cold & Cough Care', icon: Thermometer, text: 'What nominal home care is allowed for a mild cold?' },
    { id: 'contact_help', label: 'Hospital Contacts', icon: Phone, text: 'What are the hospital emergency and helpline contacts?' },
    { id: 'abha_help', label: 'What is ABHA?', icon: QrCode, text: 'What is ABHA and why should I link it at MediKiosk?' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2.5 px-1 scrollbar-none">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAction(act.text)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-normal text-slate-700 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Icon className="w-3 h-3 text-sky-600 shrink-0" />
            <span>{act.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SmartAssistantQuickActions;
