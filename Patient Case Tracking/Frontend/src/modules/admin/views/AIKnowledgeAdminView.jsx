import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, HelpCircle, AlertCircle, PhoneCall } from 'lucide-react';
import AdminTable from '../components/AdminTable';
import AdminModal from '../components/AdminModal';
import adminApiService from '../services/adminApiService';

export const AIKnowledgeAdminView = () => {
  const [category, setCategory] = useState('faq'); // 'faq' | 'symptom' | 'website' | 'contact'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    category: 'General OPD',
    keywords: '',
  });

  const fetchKnowledge = async (cat = category) => {
    try {
      setLoading(true);
      const res = await adminApiService.getAIKnowledge(cat);
      setItems(res.data || []);
    } catch (err) {
      console.error('Error fetching knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge(category);
  }, [category]);

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newFaq,
        keywords: newFaq.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      };
      await adminApiService.saveAIKnowledge(category, payload);
      setAddModalOpen(false);
      setNewFaq({ question: '', answer: '', category: 'General OPD', keywords: '' });
      fetchKnowledge(category);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const columns = [
    {
      header: category === 'faq' ? 'Question' : category === 'symptom' ? 'Symptom Key' : 'Topic',
      key: 'title',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">
            {row.question || row.symptom_key || row.topic || row.department}
          </span>
          <span className="block text-[10px] text-slate-400 font-mono">
            {row.faq_id || row._id}
          </span>
        </div>
      ),
    },
    {
      header: category === 'faq' ? 'Category' : 'Context',
      key: 'category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
          {row.category || row.severity || 'Hospital System'}
        </span>
      ),
    },
    {
      header: 'AI Response Content',
      key: 'content',
      render: (row) => (
        <span className="text-slate-600 line-clamp-2 text-xs">
          {row.answer || row.advice || row.content || row.phone}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">AI Knowledge Base Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate clinical guidance, hospital services, and FAQ rules retrieved by the conversational Smart Assistant.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Knowledge Record</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'faq', label: 'Hospital FAQs', icon: HelpCircle },
          { id: 'symptom', label: 'Symptom Guidance', icon: AlertCircle },
          { id: 'website', label: 'Website Help', icon: BookOpen },
          { id: 'contact', label: 'Hospital Contacts', icon: PhoneCall },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = category === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AdminTable
        columns={columns}
        data={items}
        loading={loading}
        emptyTitle="No Knowledge Records"
        emptyDescription="Add institutional knowledge to empower the Smart AI Assistant."
      />

      {/* Add Knowledge Modal */}
      <AdminModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add AI Knowledge Record"
        description="Provide accurate institutional guidance that will be injected into AI prompt context."
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
              onClick={handleSaveRecord}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 cursor-pointer"
            >
              Save to Knowledge Base
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveRecord} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {category === 'faq' ? 'Question' : 'Topic / Key'}
            </label>
            <input
              type="text"
              required
              value={newFaq.question}
              onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
              placeholder={category === 'faq' ? 'e.g. What are the hospital OPD timings?' : 'e.g. Fever guidance'}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <input
              type="text"
              value={newFaq.category}
              onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">AI Verified Answer / Guidance</label>
            <textarea
              required
              rows={3}
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              placeholder="e.g. OPD registrations are open Monday through Saturday from 8:00 AM to 1:00 PM."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Search Keywords (Comma separated)</label>
            <input
              type="text"
              value={newFaq.keywords}
              onChange={(e) => setNewFaq({ ...newFaq, keywords: e.target.value })}
              placeholder="opd, timing, hours, doctor, registration"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default AIKnowledgeAdminView;
