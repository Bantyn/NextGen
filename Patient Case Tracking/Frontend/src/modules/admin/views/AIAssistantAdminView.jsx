import React, { useState, useEffect } from 'react';
import { Bot, Save, Check, ShieldAlert, Cpu } from 'lucide-react';
import adminApiService from '../services/adminApiService';

export const AIAssistantAdminView = () => {
  const [config, setConfig] = useState({
    assistant_name: 'Sehat AI Clinical Assistant',
    default_language: 'gu-IN',
    supported_languages: ['gu-IN', 'hi-IN', 'en-IN'],
    greeting_message: 'નમસ્તે! હું સેહત હોસ્પિટલનો AI સહાયક છું. હું તમને કેવી રીતે મદદ કરી શકું?',
    enabled_capabilities: {
      medicine_lookup: true,
      openfda_fallback: true,
      doctor_search: true,
      opd_availability: true,
      hospital_services: true,
      clinical_guidance: true,
      ayush_knowledge: true,
      emergency_escalation: true,
    },
    emergency_escalation_threshold: 'CRITICAL',
    response_conciseness: 'MEDIUM',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await adminApiService.getAssistantConfig();
        if (res.data) setConfig(res.data);
      } catch (err) {
        console.error('Failed to load assistant config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleToggle = (capabilityKey) => {
    setConfig((prev) => ({
      ...prev,
      enabled_capabilities: {
        ...prev.enabled_capabilities,
        [capabilityKey]: !prev.enabled_capabilities[capabilityKey],
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminApiService.updateAssistantConfig(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      alert(`Failed to save config: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const tools = [
    { key: 'medicine_lookup', label: 'Local Medicine Knowledge Search', desc: 'Query verified local pharmacology DB for indications and precautions.' },
    { key: 'openfda_fallback', label: 'openFDA Drug Labeling Fallback', desc: 'Fallback to official US FDA labeling if medicine is absent locally.' },
    { key: 'doctor_search', label: 'Doctor Specialty & Duty Search', desc: 'Allow AI to locate physicians by clinical specialty and sub-specialty.' },
    { key: 'opd_availability', label: 'Real-Time OPD Availability Check', desc: 'Report live consultation room hours and physician on-duty states.' },
    { key: 'hospital_services', label: 'Hospital Services & Timings', desc: 'Answer patient questions on OPD registration hours, lab tests, and beds.' },
    { key: 'ayush_knowledge', label: 'AYUSH & Integrative Protocols', desc: 'Provide verified traditional wellness guidance and dietary advice.' },
    { key: 'emergency_escalation', label: 'Automatic Red-Flag Escalation', desc: 'Trigger emergency broadcast when acute red-flag symptoms are detected.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Smart AI Assistant Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure conversational capabilities, tool activations, and safety invariants in real time.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs disabled:opacity-50"
        >
          {success ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Applying...' : 'Save Configuration'}</span>
            </>
          )}
        </button>
      </div>

      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
            <Cpu className="w-4 h-4 text-sky-500" />
            <span>Local DB Hit Rate</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">78.4%</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Queries resolved directly via local verified records</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
            <Bot className="w-4 h-4 text-purple-500" />
            <span>openFDA Fallback Rate</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">17.2%</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Enriched by national drug labeling API</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <span>Clinical Safety Compliance</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">100%</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Zero unverified prescriptions or diagnoses made</p>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Persona Settings */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Persona & Localization
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Assistant Identifier</label>
            <input
              type="text"
              value={config.assistant_name || ''}
              onChange={(e) => setConfig({ ...config, assistant_name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Primary Greeting Message</label>
            <textarea
              rows={2}
              value={config.greeting_message || ''}
              onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Default Dialect</label>
            <select
              value={config.default_language || 'gu-IN'}
              onChange={(e) => setConfig({ ...config, default_language: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="gu-IN">Gujarati (ગુજરાતી / Gujlish)</option>
              <option value="hi-IN">Hindi (हिन्दी)</option>
              <option value="en-IN">English (India)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Tool Activation Switches */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Enabled Assistant Tools & Knowledge Modules
          </h3>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
            {tools.map((tool) => {
              const enabled = Boolean(config.enabled_capabilities?.[tool.key]);
              return (
                <div key={tool.key} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-800">{tool.label}</div>
                    <div className="text-[10px] text-slate-400">{tool.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(tool.key)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      enabled ? 'bg-sky-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantAdminView;
