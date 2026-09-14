import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Columns3,
  Table as TableIcon,
  Search,
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sparkles,
  User,
  ExternalLink,
  Eye,
  Pill,
} from 'lucide-react';
import {
  getDoctorPipeline,
  updateCaseWorkflowStatus,
  subscribeDoctorDashboard,
} from '../services/doctorDashboardService';

// The 7 canonical clinical workflow stages specified in the Sehat Doctor Portal Upgrade
const PIPELINE_STAGES = [
  { id: 'registered', title: 'Registered', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'waiting', title: 'Waiting', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'ai_intake', title: 'AI Intake', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'triage', title: 'Triage', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'consultation', title: 'Consultation', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'prescription', title: 'Prescription', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'completed', title: 'Completed', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export const DoctorLiveOPDView = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState({
    registered: [],
    waiting: [],
    ai_intake: [],
    triage: [],
    consultation: [],
    prescription: [],
    completed: [],
  });
  const [counts, setCounts] = useState({
    all: 0,
    registered: 0,
    waiting: 0,
    ai_intake: 0,
    triage: 0,
    consultation: 0,
    prescription: 0,
    completed: 0,
    priority: 0,
  });

  // Drag-and-drop state
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [triageConfirmModal, setTriageConfirmModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [updatingCaseId, setUpdatingCaseId] = useState(null);

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDoctorPipeline(searchQuery, activeFilter);
      if (res?.pipeline) {
        setPipelineData(res.pipeline);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to load doctor pipeline:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPipeline();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchPipeline]);

  // Polling every 12 seconds for live OPD changes
  useEffect(() => {
    const interval = setInterval(fetchPipeline, 12000);
    const unsubscribe = subscribeDoctorDashboard(() => {
      fetchPipeline();
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchPipeline]);

  // Handle Drag Start
  const handleDragStart = (e, card, sourceStage) => {
    setDraggedCard({ card, sourceStage });
    e.dataTransfer.setData('text/plain', card.caseId || card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle Drag Over column
  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  // Handle Drag Leave
  const handleDragLeave = (e, stageId) => {
    if (dragOverStage === stageId) {
      setDragOverStage(null);
    }
  };

  // Execute Backend Status Update with Rollback on Failure
  const executeStageTransition = async (caseId, targetStage, previousStage) => {
    setUpdatingCaseId(caseId);
    setErrorMessage(null);

    // Optimistic UI state update
    setPipelineData((prev) => {
      const next = { ...prev };
      let movedCard = null;
      for (const [st, cards] of Object.entries(next)) {
        const foundIdx = cards.findIndex((c) => (c.caseId || c.id) === caseId);
        if (foundIdx !== -1) {
          movedCard = { ...cards[foundIdx], stage: targetStage };
          next[st] = cards.filter((_, idx) => idx !== foundIdx);
          break;
        }
      }
      if (movedCard && next[targetStage]) {
        next[targetStage] = [movedCard, ...next[targetStage]];
      }
      return next;
    });

    try {
      await updateCaseWorkflowStatus(caseId, targetStage);
      // Refresh to ensure exact counts & server state
      fetchPipeline();
    } catch (err) {
      console.error('Failed to update stage in backend:', err);
      setErrorMessage(`Move failed: The patient status could not be updated (${err.message}).`);
      // Revert optimistic update
      fetchPipeline();
    } finally {
      setUpdatingCaseId(null);
      setDraggedCard(null);
      setDragOverStage(null);
      setTriageConfirmModal(null);
    }
  };

  // Handle Drop on Column
  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedCard) return;
    const { card, sourceStage } = draggedCard;
    if (sourceStage === targetStage) return;

    // Triage Alert Protection:
    // If card has active Red Flag / Emergency triage and is being moved to a lower stage, require confirmation
    const isDemotingEmergency =
      card.isRedFlag &&
      (targetStage === 'waiting' || targetStage === 'registered');

    if (isDemotingEmergency) {
      setTriageConfirmModal({
        card,
        targetStage,
        sourceStage,
      });
      return;
    }

    await executeStageTransition(card.caseId || card.id, targetStage, sourceStage);
  };

  // Filtered lists for Table View
  const allCasesList = useMemo(() => {
    const list = [];
    Object.values(pipelineData).forEach((cards) => {
      if (Array.isArray(cards)) list.push(...cards);
    });
    return list;
  }, [pipelineData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Live OPD Clinical Pipeline</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time outpatient consultation pipeline. Drag patient cards across stages to advance clinical encounter workflow.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <button
            onClick={() => fetchPipeline()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
            title="Refresh pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-slate-950 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Pipeline Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-950 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchPipeline()}
            className="px-2.5 py-1 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Dynamic Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({counts.all || 0})
          </button>
          <button
            onClick={() => setActiveFilter('waiting')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeFilter === 'waiting'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Waiting ({counts.waiting || 0})
          </button>
          <button
            onClick={() => setActiveFilter('triage')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeFilter === 'triage'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Triage Alerts ({counts.priority || counts.triage || 0})
          </button>
          <button
            onClick={() => setActiveFilter('consultation')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeFilter === 'consultation'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            In Consultation ({counts.consultation || 0})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Completed ({counts.completed || 0})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, token, complaint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Kanban Pipeline Board View */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4 custom-scrollbar -mx-4 sm:-mx-8 px-4 sm:px-8">
          <div className="flex gap-4 min-w-[1400px] items-start">
            {PIPELINE_STAGES.map((stage) => {
              const cards = pipelineData[stage.id] || [];
              const isOver = dragOverStage === stage.id;
              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={(e) => handleDragLeave(e, stage.id)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={`w-72 shrink-0 rounded-2xl flex flex-col transition-all duration-200 ${
                    isOver
                      ? 'bg-sky-50/80 ring-2 ring-sky-500/40 shadow-md'
                      : 'bg-slate-100/70 border border-slate-200/80'
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{stage.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stage.badgeColor}`}
                      >
                        {cards.length}
                      </span>
                    </div>
                    {stage.id === 'consultation' && (
                      <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.5 rounded-md">Active</span>
                    )}
                  </div>

                  {/* Column Drop Area & Cards */}
                  <div className="p-2.5 space-y-2.5 min-h-[480px] max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                    {cards.length === 0 ? (
                      <div className="h-40 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-3 text-slate-400">
                        <span className="text-xs font-normal">No patients</span>
                        <span className="text-[10px] text-slate-400 mt-1">Drag a card here</span>
                      </div>
                    ) : (
                      cards.map((card) => {
                        const isDragging = draggedCard?.card?.id === (card.caseId || card.id);
                        const isUpdating = updatingCaseId === (card.caseId || card.id);
                        return (
                          <div
                            key={card.caseId || card.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, card, stage.id)}
                            className={`group relative p-3.5 bg-white rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-md select-none ${
                              card.isRedFlag
                                ? 'border-rose-300 ring-1 ring-rose-500/20 bg-gradient-to-br from-rose-50/30 to-white'
                                : 'border-slate-200/90 hover:border-slate-300'
                            } ${isDragging ? 'opacity-40 scale-95' : ''} ${isUpdating ? 'animate-pulse' : ''}`}
                          >
                            {/* Card Top: Token & Priority */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                  #{card.token}
                                </span>
                                {card.opdType === 'AYUSH' && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    AYUSH
                                  </span>
                                )}
                              </div>

                              {card.isRedFlag ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                                  <ShieldAlert className="w-3 h-3" />
                                  EMERGENCY
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                    card.priority === 'High Priority'
                                      ? 'bg-amber-100 text-amber-800'
                                      : card.priority === 'Moderate'
                                      ? 'bg-sky-50 text-sky-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {card.priority}
                                </span>
                              )}
                            </div>

                            {/* Patient Demographics */}
                            <div className="mt-2">
                              <div className="text-xs font-bold text-slate-900 hover:text-sky-600 transition">
                                {card.patientName}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {card.age} yrs • {card.gender}
                              </div>
                            </div>

                            {/* AI Chief Complaint */}
                            <div className="mt-2.5 p-2 bg-slate-50/90 rounded-lg border border-slate-100 text-[11px] text-slate-700 line-clamp-2">
                              <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-sky-500" />
                                AI Chief Complaint
                              </div>
                              {card.chiefComplaint}
                            </div>

                            {/* Metadata Badges: Reports & Wait Time */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span className="flex items-center gap-1 text-slate-600">
                                <FileText className="w-3 h-3 text-slate-400" />
                                Reports: <strong>{card.reportsCount || 1}</strong>
                              </span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {card.waitTime}
                              </span>
                            </div>

                            {/* Quick Action Button */}
                            <div className="mt-3 pt-2 flex items-center justify-between gap-1.5">
                              <button
                                onClick={() => navigate(`/doctor/cases/${card.sessionId || card.caseId || card.id}`)}
                                className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                              >
                                <span>Open Case</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 4. Tabular List View */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">OPD Type</th>
                <th className="py-3 px-4">Chief Complaint</th>
                <th className="py-3 px-4">Workflow Stage</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Waiting</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allCasesList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No clinical cases matching your search criteria.
                  </td>
                </tr>
              ) : (
                allCasesList.map((item) => (
                  <tr key={item.caseId || item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{item.token}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.patientName}</div>
                      <div className="text-[11px] text-slate-500">{item.age} yrs • {item.gender}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {item.opdType || 'GENERAL'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                      {item.chiefComplaint}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        {item.stage || 'waiting'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.isRedFlag ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          EMERGENCY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                          {item.priority}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {item.waitTime}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/doctor/cases/${item.sessionId || item.caseId || item.id}`)}
                        className="px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                      >
                        Open Case
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Triage Alert Protection Confirmation Modal */}
      {triageConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Triage Alert</h3>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  🔴 High Priority Case Protection
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Patient <strong>{triageConfirmModal.card.patientName}</strong> (#{triageConfirmModal.card.token}) has an active
              emergency triage red-flag:
              <br />
              <em className="text-slate-800 block mt-1 p-2 bg-rose-50 rounded-lg border border-rose-100">
                "{triageConfirmModal.card.chiefComplaint}"
              </em>
              <br />
              Moving this case to <strong>{triageConfirmModal.targetStage.toUpperCase()}</strong> will maintain the underlying clinical alert but advance workflow.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setTriageConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const { card, targetStage, sourceStage } = triageConfirmModal;
                  executeStageTransition(card.caseId || card.id, targetStage, sourceStage);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer shadow-xs"
              >
                Continue Moving Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorLiveOPDView;
