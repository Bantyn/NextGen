import React, { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, Bookmark, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { getPrescriptionTemplates } from '../services/doctorDashboardService';

/**
 * PrescriptionBuilder Component
 * Interactive physician prescription module for structured medication entry.
 * Allows adding/removing medications and applying pre-saved clinical templates.
 */
export const PrescriptionBuilder = ({
  prescriptions = [],
  onPrescriptionsChange,
  isEditing = true,
}) => {
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Fetch saved prescription templates for fast insertion
  useEffect(() => {
    if (templateModalOpen && templates.length === 0) {
      setLoadingTemplates(true);
      getPrescriptionTemplates()
        .then((data) => setTemplates(data || []))
        .catch((err) => console.error('Failed to load templates:', err))
        .finally(() => setLoadingTemplates(false));
    }
  }, [templateModalOpen, templates.length]);

  const handleAddMedicine = () => {
    const newMedicine = {
      medicine_name: '',
      generic_name: '',
      dosage: '1 tablet',
      frequency: 'Twice daily (BD)',
      route: 'Oral',
      duration: '5 days',
      before_after_food: 'AFTER_FOOD',
      instructions: 'Take with warm water',
    };
    onPrescriptionsChange([...prescriptions, newMedicine]);
  };

  const handleRemoveMedicine = (index) => {
    const updated = prescriptions.filter((_, idx) => idx !== index);
    onPrescriptionsChange(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = prescriptions.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onPrescriptionsChange(updated);
  };

  const handleApplyTemplate = (template) => {
    if (!template || !template.medicines) return;
    // Map template medicines to prescription format
    const formatted = template.medicines.map((m) => ({
      medicine_name: m.medicine_name || '',
      generic_name: m.generic_name || '',
      dosage: m.dosage || '1 tablet',
      frequency: m.frequency || 'Twice daily (BD)',
      route: m.route || 'Oral',
      duration: m.duration || '5 days',
      before_after_food: m.before_after_food || 'AFTER_FOOD',
      instructions: m.instructions || '',
    }));
    onPrescriptionsChange([...prescriptions, ...formatted]);
    setTemplateModalOpen(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header with Title and Template Trigger */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>Structured Prescription Builder</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                {prescriptions.length} Meds
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">
              Doctor-authorized medicinal therapy and regimen
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              <span>Apply Template</span>
            </button>

            <button
              type="button"
              onClick={handleAddMedicine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medicine</span>
            </button>
          </div>
        )}
      </div>

      {/* Prescription Medication Items */}
      {prescriptions.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Pill className="w-6 h-6 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">No medications prescribed yet.</p>
          <p className="text-[11px] text-slate-400">
            Click "Add Medicine" or select a pre-saved regimen via "Apply Template".
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((med, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 transition"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>Rx Item #{idx + 1}</span>
                </span>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMedicine(idx)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Remove medicine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Medicine input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                    Medicine / Brand Name *
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g., Amoxicillin 500mg"
                    value={med.medicine_name || ''}
                    onChange={(e) => handleFieldChange(idx, 'medicine_name', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                    Generic Composition
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g., Amoxicillin Trihydrate"
                    value={med.generic_name || ''}
                    onChange={(e) => handleFieldChange(idx, 'generic_name', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                    Dosage & Form
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g., 500mg / 1 tablet"
                    value={med.dosage || ''}
                    onChange={(e) => handleFieldChange(idx, 'dosage', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                    Frequency
                  </label>
                  <select
                    disabled={!isEditing}
                    value={med.frequency || 'Twice daily (BD)'}
                    onChange={(e) => handleFieldChange(idx, 'frequency', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Once daily (OD)">Once daily (OD)</option>
                    <option value="Twice daily (BD)">Twice daily (BD)</option>
                    <option value="Three times daily (TDS)">Three times daily (TDS)</option>
                    <option value="Four times daily (QID)">Four times daily (QID)</option>
                    <option value="At bedtime (HS)">At bedtime (HS)</option>
                    <option value="As needed (SOS)">As needed (SOS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                    Route
                  </label>
                  <select
                    disabled={!isEditing}
                    value={med.route || 'Oral'}
                    onChange={(e) => handleFieldChange(idx, 'route', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Topical">Topical</option>
                    <option value="Sublingual">Sublingual</option>
                    <option value="Intravenous (IV)">Intravenous (IV)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="e.g., 5 days"
                    value={med.duration || ''}
                    onChange={(e) => handleFieldChange(idx, 'duration', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                    Timing
                  </label>
                  <select
                    disabled={!isEditing}
                    value={med.before_after_food || 'AFTER_FOOD'}
                    onChange={(e) => handleFieldChange(idx, 'before_after_food', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="AFTER_FOOD">After Food</option>
                    <option value="BEFORE_FOOD">Before Food</option>
                    <option value="WITH_FOOD">With Food</option>
                    <option value="EMPTY_STOMACH">Empty Stomach</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                  Specific Patient Instructions (Pathya / Regimen)
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  placeholder="e.g., Take with warm water. Avoid sour foods and heavy curd at night."
                  value={med.instructions || ''}
                  onChange={(e) => handleFieldChange(idx, 'instructions', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Picker Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Select Prescription Template</h3>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Choose a standard clinical protocol to insert pre-configured medicines directly into this patient's prescription.
            </p>

            {loadingTemplates ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No templates saved yet. You can create templates in the Prescription Templates tab.
              </div>
            ) : (
              <div className="space-y-2.5">
                {templates.map((tpl) => (
                  <div
                    key={tpl.template_id || tpl._id}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 transition cursor-pointer text-left space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{tpl.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {tpl.category}
                      </span>
                    </div>
                    {tpl.notes && <p className="text-[11px] text-slate-500">{tpl.notes}</p>}
                    <div className="text-[10px] text-sky-700 font-medium flex items-center gap-1 pt-1">
                      <Sparkles className="w-3 h-3 text-sky-500" />
                      <span>{tpl.medicines?.length || 0} medications configured</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionBuilder;
