import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye,
  FileText,
  Clock,
  Check,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  getDoctorReports,
  verifyDoctorReport,
} from '../services/doctorDashboardService';

export const DoctorReportsView = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDoctorReports(search);
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load doctor reports:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchReports, 200);
    return () => clearTimeout(timer);
  }, [fetchReports]);

  const handleVerify = async (reportId) => {
    try {
      setVerifying(true);
      await verifyDoctorReport(reportId, verificationNotes);
      fetchReports();
      if (selectedReport?.documentId === reportId) {
        setSelectedReport({
          ...selectedReport,
          isVerified: true,
          verificationNotes: verificationNotes || 'Verified by physician',
        });
      }
      alert('Diagnostic report verified successfully.');
    } catch (err) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Diagnostic Reports & AI Laboratory Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Digitized lab investigations, optical character recognition findings, and physician verification logs.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search report, patient, test name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
          />
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading diagnostic reports...</div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No diagnostic documents found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <div
              key={r.documentId || r.id}
              className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-md transition space-y-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{r.name}</h3>
                      <span className="text-[10px] text-slate-400">{r.patientName}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      r.isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.isVerified ? 'VERIFIED' : 'NEEDS REVIEW'}
                  </span>
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    Physician Clinical Digest
                  </div>
                  <p className="line-clamp-2 leading-relaxed text-[11px] text-slate-800">{r.clinicalSummary}</p>
                </div>

                {/* Extracted Investigations Preview */}
                {r.labInvestigations?.length > 0 && (
                  <div className="mt-2.5 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Observed Lab Values ({r.labInvestigations.length})
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1 text-[11px]">
                      {r.labInvestigations.slice(0, 2).map((lab, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
                          <span className="text-slate-700 font-medium truncate max-w-[140px]">{lab.test_name}</span>
                          <span className={`font-bold ${lab.flag === 'HIGH' ? 'text-rose-600' : 'text-slate-900'}`}>
                            {lab.observed_value} {lab.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <span className="text-[10px] text-slate-400">OCR: {r.confidence}% confidence</span>
                <button
                  onClick={() => {
                    setSelectedReport(r);
                    setVerificationNotes(r.verificationNotes || '');
                  }}
                  className="px-3 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                >
                  Inspect & Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Inspection Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedReport.name}</h3>
                <span className="text-xs text-slate-500">Patient: {selectedReport.patientName}</span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs custom-scrollbar">
              {/* Clinical Digest */}
              <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-100 space-y-1">
                <strong className="text-sky-950 font-bold block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  AI Clinical Digest
                </strong>
                <p className="text-sky-900 leading-relaxed text-[11px]">{selectedReport.clinicalSummary}</p>
              </div>

              {/* Lab Investigations Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Detailed Laboratory Investigations</h4>
                {selectedReport.labInvestigations?.length === 0 ? (
                  <p className="text-slate-400 py-2">No individual tabular lab parameters extracted.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Test Name</th>
                          <th className="p-2.5">Observed</th>
                          <th className="p-2.5">Reference Range</th>
                          <th className="p-2.5 text-right">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReport.labInvestigations.map((l, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-medium text-slate-800">{l.test_name}</td>
                            <td className="p-2.5 font-bold text-slate-900">{l.observed_value} {l.unit}</td>
                            <td className="p-2.5 text-slate-500">{l.reference_range || 'Standard'}</td>
                            <td className="p-2.5 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  l.flag === 'HIGH'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {l.flag || 'NORMAL'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Doctor Verification Notes Input */}
              <div className="space-y-1.5 pt-2">
                <label className="block font-bold text-slate-800">Doctor Verification Notes</label>
                <textarea
                  rows={2}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Confirm accuracy of extracted parameters, add clinical annotations..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              {selectedReport.url ? (
                <a
                  href={selectedReport.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Original Document</span>
                </a>
              ) : (
                <span className="text-xs text-slate-400">Scanned PDF verified</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={verifying || selectedReport.isVerified}
                  onClick={() => handleVerify(selectedReport.documentId)}
                  className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{selectedReport.isVerified ? 'Verified' : verifying ? 'Verifying...' : 'Sign & Verify Report'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorReportsView;
