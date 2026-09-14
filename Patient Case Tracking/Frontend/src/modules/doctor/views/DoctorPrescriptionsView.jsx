import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Plus,
  Trash2,
  FileCheck,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  getPrescriptionTemplates,
  getDoctorPatients,
  savePrescription,
} from '../services/doctorDashboardService';

export const DoctorPrescriptionsView = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('PAT-701A1');
  const [sessionId, setSessionId] = useState('SES-WAIT-01');
  const [medicines, setMedicines] = useState([
    {
      medicine_name: 'Paracetamol 500mg',
      generic_name: 'Acetaminophen',
      dosage: '1 tablet',
      frequency: 'TDS (Thrice Daily)',
      duration: '3 days',
      instructions: 'Take after meals for fever or headache',
      before_after_food: 'AFTER_FOOD',
    },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [tpls, ptsRes] = await Promise.all([
          getPrescriptionTemplates(),
          getDoctorPatients(),
        ]);
        setTemplates(tpls || []);
        if (ptsRes?.patients) setPatients(ptsRes.patients);
      } catch (err) {
        console.error('Failed to load prescription metadata:', err);
      }
    };
    init();
  }, []);

  const handleApplyTemplate = (tplId) => {
    setSelectedTemplate(tplId);
    const tpl = templates.find((t) => t.template_id === tplId || t._id === tplId);
    if (tpl && Array.isArray(tpl.medicines)) {
      setMedicines(
        tpl.medicines.map((m) => ({
          medicine_name: m.medicine_name || m.name,
          generic_name: m.generic_name || '',
          dosage: m.dosage || '1 tablet',
          frequency: m.frequency || 'BD',
          duration: m.duration || '5 days',
          instructions: m.instructions || 'Take as directed',
          before_after_food: m.before_after_food || 'AFTER_FOOD',
        }))
      );
    }
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicine_name: '',
        generic_name: '',
        dosage: '1 tablet',
        frequency: 'BD (Twice Daily)',
        duration: '5 days',
        instructions: 'After meals',
        before_after_food: 'AFTER_FOOD',
      },
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleUpdateMedicine = (idx, field, value) => {
    setMedicines(
      medicines.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (medicines.length === 0 || !medicines[0].medicine_name) {
      alert('Please add at least one valid medication.');
      return;
    }
    try {
      setSaving(true);
      await savePrescription(sessionId, medicines);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert(`Failed to save prescription: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Prescription Builder & Medical Regimens</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure pharmaceutical and AYUSH formulations, load pre-set clinical templates, and digitally record Rx.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Rx</span>
          </button>
          <button
            onClick={() => navigate('/doctor/templates')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manage Templates</span>
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Prescription successfully recorded and synchronized to patient electronic clinical record!</span>
        </div>
      )}

      {/* Prescription Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prescription Editor */}
        <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {/* Patient Selection & Template Autofill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              >
                {patients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.name} ({p.age}y {p.gender[0]}) - {p.patientId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Autofill from Preset Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t.template_id || t._id} value={t.template_id || t._id}>
                    {t.title} ({t.category || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Medicines List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Prescribed Medications ({medicines.length})
              </span>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            {medicines.map((med, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Medicine Brand & Strength (e.g. Amlodipine 5mg / Tulsi Syrup)"
                      value={med.medicine_name}
                      onChange={(e) => handleUpdateMedicine(idx, 'medicine_name', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Remove medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Dosage</span>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                      placeholder="e.g. 1 tablet / 10 ml"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Frequency</span>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                      placeholder="e.g. BD (Twice daily)"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Duration</span>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                      placeholder="e.g. 5 days / 30 days"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Meal Timing</span>
                    <select
                      value={med.before_after_food}
                      onChange={(e) => handleUpdateMedicine(idx, 'before_after_food', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs"
                    >
                      <option value="AFTER_FOOD">After Food</option>
                      <option value="BEFORE_FOOD">Before Food</option>
                      <option value="WITH_FOOD">With Food</option>
                    </select>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={med.instructions}
                    onChange={(e) => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                    placeholder="Patient instructions (e.g. Take with warm water at bedtime)"
                    className="w-full px-3 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{saving ? 'Signing & Saving...' : 'Save & Sign Prescription'}</span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Presets & Guidance */}
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Quick Preset Protocols</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select verified standard clinical protocols for rapid outpatient prescription creation:
            </p>

            <div className="space-y-2 text-xs">
              {templates.slice(0, 4).map((t) => (
                <button
                  key={t.template_id || t._id}
                  type="button"
                  onClick={() => handleApplyTemplate(t.template_id || t._id)}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 transition cursor-pointer"
                >
                  <div className="font-bold text-slate-900 truncate">{t.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{t.category || 'General'} • {t.medicines?.length || 0} Meds</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-sky-900 space-y-1.5">
            <strong className="block text-sky-950 font-bold">Clinical Safety Assurance</strong>
            <p className="text-[11px] leading-relaxed text-sky-800">
              Medicines prescribed here are verified and saved into the patient's authenticated ABHA-compliant electronic health record.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DoctorPrescriptionsView;
