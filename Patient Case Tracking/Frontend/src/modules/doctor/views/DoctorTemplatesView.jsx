import React, { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, CheckCircle2, Copy } from 'lucide-react';
import {
  getPrescriptionTemplates,
  savePrescriptionTemplate,
  deletePrescriptionTemplate,
} from '../services/doctorDashboardService';

export const DoctorTemplatesView = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General OPD');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([
    {
      medicine_name: '',
      generic_name: '',
      dosage: '1 tablet',
      frequency: 'Twice daily (BD)',
      duration: '5 days',
      instructions: 'Take after meals with warm water',
      before_after_food: 'AFTER_FOOD',
    },
  ]);
  const [toast, setToast] = useState('');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await getPrescriptionTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        medicine_name: '',
        generic_name: '',
        dosage: '1 tablet',
        frequency: 'Twice daily (BD)',
        duration: '5 days',
        instructions: 'Take after meals',
        before_after_food: 'AFTER_FOOD',
      },
    ]);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleRemoveMedicineRow = (index) => {
    if (medicines.length <= 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || medicines.some((m) => !m.medicine_name.trim())) {
      alert('Please provide a template title and medication names.');
      return;
    }

    try {
      await savePrescriptionTemplate({
        title,
        category,
        notes,
        medicines,
      });
      setToast('Prescription template saved successfully!');
      setTimeout(() => setToast(''), 2500);
      setModalOpen(false);
      setTitle('');
      setNotes('');
      setMedicines([
        {
          medicine_name: '',
          generic_name: '',
          dosage: '1 tablet',
          frequency: 'Twice daily (BD)',
          duration: '5 days',
          instructions: 'Take after meals',
          before_after_food: 'AFTER_FOOD',
        },
      ]);
      fetchTemplates();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prescription template?')) return;
    try {
      await deletePrescriptionTemplate(id);
      fetchTemplates();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Physician Prescription Templates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-configured clinical regimens and standard dosages for 1-click application during patient encounters.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Template</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading prescription templates...</div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No prescription templates found. Click "Create New Template" above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => (
            <div
              key={tpl.template_id || tpl._id}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    {tpl.category || 'General Medicine'}
                  </span>
                  {tpl.doctor_id !== 'SYSTEM' && (
                    <button
                      onClick={() => handleDelete(tpl.template_id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">{tpl.title}</h3>
                {tpl.notes && (
                  <p className="text-[11px] text-slate-500 mt-1 font-normal line-clamp-2">
                    {tpl.notes}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Medications ({tpl.medicines?.length || 0})
                  </span>
                  <div className="space-y-1.5">
                    {tpl.medicines?.map((m, idx) => (
                      <div key={idx} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="font-semibold text-slate-800">{m.medicine_name}</div>
                        <div className="text-[10px] text-slate-500">
                          {m.dosage} • {m.frequency} • {m.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                Template ID: {tpl.template_id}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Create Clinical Prescription Template</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Protocol Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Bronchitis Regimen"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Clinical Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Dietary & Lifestyle Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Avoid cold drinks, take steam inhalation twice daily."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Prescribed Medications</span>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="text-xs text-sky-600 font-semibold hover:underline cursor-pointer"
                  >
                    + Add Medicine
                  </button>
                </div>

                {medicines.map((med, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] text-slate-600">Medicine #{idx + 1}</span>
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          className="text-rose-500 text-[11px] hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                        required
                        value={med.medicine_name}
                        onChange={(e) => handleMedicineChange(idx, 'medicine_name', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Generic / Composition"
                        value={med.generic_name}
                        onChange={(e) => handleMedicineChange(idx, 'generic_name', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 1 tab)"
                        value={med.dosage}
                        onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. BD / TDS)"
                        value={med.frequency}
                        onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. 5 days)"
                        value={med.duration}
                        onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-slate-950 text-white font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorTemplatesView;
