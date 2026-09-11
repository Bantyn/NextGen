import React, { useState, useEffect } from 'react';
import { Pill, Search, Download, Plus, Trash2, CheckCircle2, Globe, ShieldAlert } from 'lucide-react';
import AdminTable from '../components/AdminTable';
import AdminFilters from '../components/AdminFilters';
import AdminModal from '../components/AdminModal';
import adminApiService from '../services/adminApiService';

export const MedicinesAdminView = () => {
  const [activeSubTab, setActiveSubTab] = useState('local'); // 'local' | 'openfda'
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // openFDA Search State
  const [fdaQuery, setFdaQuery] = useState('');
  const [fdaLoading, setFdaLoading] = useState(false);
  const [fdaResult, setFdaResult] = useState(null);
  const [fdaError, setFdaError] = useState('');
  const [importedSuccess, setImportedSuccess] = useState('');

  // Add Medicine Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    generic_name: '',
    purpose: '',
    category: 'Allopathic Medication',
    dosage_forms: ['Tablet'],
    precautions_and_warnings: ['Consult doctor before administering during pregnancy.'],
    requires_prescription: true,
  });

  const fetchMedicines = async (query = search, pageNum = page) => {
    try {
      setLoading(true);
      const res = await adminApiService.getMedicines({ page: pageNum, limit: 15, search: query });
      setMedicines(res.data || []);
      setTotalPages(res.meta?.total_pages || 1);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      console.error('Error loading medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'local') {
      const timer = setTimeout(() => {
        fetchMedicines(search, 1);
        setPage(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, activeSubTab]);

  const handleSearchFDA = async (e) => {
    e.preventDefault();
    if (!fdaQuery.trim()) return;
    try {
      setFdaLoading(true);
      setFdaError('');
      setFdaResult(null);
      setImportedSuccess('');
      const res = await adminApiService.searchOpenFDA(fdaQuery.trim());
      if (res.data && res.data.found && res.data.fda_record) {
        setFdaResult(res.data.fda_record);
      } else {
        setFdaError(`No openFDA labeling record found for "${fdaQuery}". Try searching generic chemical name (e.g. Amoxicillin, Ibuprofen).`);
      }
    } catch (err) {
      setFdaError(`openFDA request failed: ${err.message}`);
    } finally {
      setFdaLoading(false);
    }
  };

  const handleImportFDA = async () => {
    if (!fdaResult) return;
    try {
      setFdaLoading(true);
      await adminApiService.importOpenFDAMedicine(fdaResult);
      setImportedSuccess(`Successfully imported "${fdaResult.name}" into Sehat Local Knowledge DB!`);
      setTimeout(() => {
        fetchMedicines();
      }, 500);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setFdaLoading(false);
    }
  };

  const handleSaveNewMed = async (e) => {
    e.preventDefault();
    try {
      await adminApiService.saveMedicine(newMed);
      setAddModalOpen(false);
      setNewMed({
        name: '',
        generic_name: '',
        purpose: '',
        category: 'Allopathic Medication',
        dosage_forms: ['Tablet'],
        precautions_and_warnings: ['Consult doctor before administering during pregnancy.'],
        requires_prescription: true,
      });
      fetchMedicines();
    } catch (err) {
      alert(`Failed to save medicine: ${err.message}`);
    }
  };

  const handleDeleteMed = async (medId) => {
    if (!window.confirm('Are you sure you want to remove this medicine record?')) return;
    try {
      await adminApiService.deleteMedicine(medId);
      fetchMedicines();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const localColumns = [
    {
      header: 'Medicine Name',
      key: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.name}</span>
          <span className="block text-[10px] text-slate-400 font-mono">{row.medicine_id}</span>
        </div>
      ),
    },
    {
      header: 'Generic Name',
      key: 'generic_name',
      render: (row) => <span className="font-medium text-slate-700">{row.generic_name}</span>,
    },
    {
      header: 'Therapeutic Purpose',
      key: 'purpose',
      render: (row) => <span className="text-slate-600 line-clamp-1">{row.purpose}</span>,
    },
    {
      header: 'Category',
      key: 'category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-100">
          {row.category || 'Medication'}
        </span>
      ),
    },
    {
      header: 'Rx Required',
      key: 'requires_prescription',
      render: (row) => (
        <span className={`text-[10px] font-semibold ${row.requires_prescription ? 'text-amber-600' : 'text-slate-500'}`}>
          {row.requires_prescription ? 'Rx Mandatory' : 'OTC Available'}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <button
          onClick={() => handleDeleteMed(row.medicine_id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
          title="Delete medicine record"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Medicine Knowledge & openFDA Gateway</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage local verified clinical pharmacology catalog and sync with official openFDA labeling.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('local')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'local'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Local Catalog ({total})
          </button>
          <button
            onClick={() => setActiveSubTab('openfda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'openfda'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span>openFDA Live Import</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'local' ? (
        <>
          <AdminFilters
            search={search}
            onSearchChange={setSearch}
            placeholder="Search medicine catalog by brand, generic, or purpose..."
            actions={
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            }
          />

          <AdminTable
            columns={localColumns}
            data={medicines}
            loading={loading}
            emptyTitle="No Medicines in Catalog"
            emptyDescription="Add a medicine manually or import directly from openFDA."
            pagination={{
              page,
              totalPages,
              total,
              onPageChange: (p) => {
                setPage(p);
                fetchMedicines(search, p);
              },
            }}
          />
        </>
      ) : (
        /* openFDA Search & 1-Click Import View */
        <div className="space-y-4">
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Search Official openFDA Drug Labeling Database
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-normal">
              Directly query the FDA national drug directory and import verified pharmacology records with clinical indications into Sehat.
            </p>

            <form onSubmit={handleSearchFDA} className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={fdaQuery}
                onChange={(e) => setFdaQuery(e.target.value)}
                placeholder="Enter drug generic or brand name (e.g. Amoxicillin, Metformin, Paracetamol)..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="submit"
                disabled={fdaLoading}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {fdaLoading ? 'Searching...' : 'Search FDA'}
              </button>
            </form>

            {fdaError && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
                {fdaError}
              </div>
            )}

            {importedSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{importedSuccess}</span>
              </div>
            )}
          </div>

          {fdaResult && (
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    openFDA Official Labeling
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{fdaResult.name}</h3>
                  <div className="text-xs text-slate-500">
                    Generic: <strong>{fdaResult.generic_name}</strong>
                  </div>
                </div>
                <button
                  onClick={handleImportFDA}
                  disabled={fdaLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Import into Local Database</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <strong className="block text-slate-800 font-semibold">Purpose & Indications:</strong>
                  <p className="text-slate-600 leading-relaxed">
                    {fdaResult.purpose || fdaResult.general_usage_info || 'Indicated as per official FDA prescription packaging.'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <strong className="block text-slate-800 font-semibold">Dosage Forms:</strong>
                  <div className="flex flex-wrap gap-1.5">
                    {fdaResult.dosage_forms?.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-700">
                        {f}
                      </span>
                    )) || <span>Standard oral preparation</span>}
                  </div>
                </div>
              </div>

              {fdaResult.precautions_and_warnings && fdaResult.precautions_and_warnings.length > 0 && (
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Precautions & Boxed Warnings</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    {fdaResult.precautions_and_warnings.slice(0, 3).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Medicine Modal */}
      <AdminModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Medicine to Sehat Knowledge Base"
        description="Register a verified clinical medicine record for intake and AI lookups."
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNewMed}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 cursor-pointer"
            >
              Save Medicine
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveNewMed} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Medicine Name (Brand or Common)</label>
            <input
              type="text"
              required
              value={newMed.name}
              onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
              placeholder="e.g. Paracetamol 500mg"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Generic Name</label>
            <input
              type="text"
              required
              value={newMed.generic_name}
              onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })}
              placeholder="e.g. Acetaminophen"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Purpose / Indication</label>
            <textarea
              required
              value={newMed.purpose}
              onChange={(e) => setNewMed({ ...newMed, purpose: e.target.value })}
              placeholder="e.g. Antipyretic and analgesic indicated for mild-to-moderate fever and body ache."
              rows={2}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={newMed.category}
              onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="Allopathic Medication">Allopathic Medication</option>
              <option value="Ayurvedic Preparation">Ayurvedic Preparation</option>
              <option value="Homeopathic Remedy">Homeopathic Remedy</option>
              <option value="Dietary Supplement">Dietary Supplement</option>
            </select>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default MedicinesAdminView;
