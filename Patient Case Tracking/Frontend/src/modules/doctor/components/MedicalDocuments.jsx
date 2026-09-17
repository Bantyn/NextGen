import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  Download,
  ExternalLink,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';

/**
 * MedicalDocuments Component — Doctor Clinical Workspace View (Section 9)
 * Displays uploaded diagnostic reports, AI clinical summary, critical/abnormal findings,
 * and allows attending physicians to inspect the original medical document to verify extractions.
 */
export const MedicalDocuments = ({ documents = [] }) => {
  const [inspectingDoc, setInspectingDoc] = useState(null);
  const [expandedDocIds, setExpandedDocIds] = useState({});

  const toggleDocExpand = (id) => {
    setExpandedDocIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Diagnostic Reports & Documents (0)
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-400 py-4 text-center">
          No medical records or previous diagnostic investigations uploaded for this encounter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
            Uploaded Documents & AI Clinical Intelligence ({documents.length})
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Multimodal OCR & Clinical Extractions Ready</span>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((doc, idx) => {
          const docId = doc.id || doc.document_id || `doc-${idx}`;
          const isExpanded = expandedDocIds[docId] !== false; // expanded by default

          const findings = doc.importantFindings || doc.important_findings || [];
          const parameters = doc.extractedValues || doc.parameters || doc.extractedData?.lab_results || [];
          const clinicalDigest =
            doc.clinicalSummary?.physician_digest ||
            (typeof doc.clinicalSummary === 'string' ? doc.clinicalSummary : null) ||
            doc.summary;

          const fileUrl = doc.fileUrl || (doc.document_id ? `http://localhost:5000/api/documents/${doc.document_id}/file` : null);

          return (
            <div
              key={docId}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3.5 transition"
            >
              {/* Top Row: Info + Actions */}
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-950 font-mono">
                        {doc.name || doc.title || 'Medical Investigation'}
                      </h4>
                      {doc.extractionConfidence && (
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.2 rounded-full ${
                            doc.extractionConfidence === 'CLEAR'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.extractionConfidence === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {doc.extractionConfidence === 'CLEAR'
                            ? 'High Clarity OCR'
                            : doc.extractionConfidence === 'PARTIAL'
                            ? 'Partial OCR'
                            : 'Uncertain Quality'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {doc.type || 'Diagnostic Report'} • {doc.date || 'Recent'} • {doc.fileSize || 'ABDM'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {fileUrl && (
                    <button
                      type="button"
                      onClick={() => setInspectingDoc({ ...doc, fileUrl })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 transition cursor-pointer shadow-2xs"
                      title="Inspect original document side-by-side"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>Verify Original Document</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleDocExpand(docId)}
                    className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-3 pt-1 border-t border-slate-200/70 text-xs animate-fadeIn">
                  {/* AI Clinical Summary / Physician Digest */}
                  {clinicalDigest && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                        <Stethoscope className="w-3 h-3 text-sky-600" />
                        <span>AI Clinical Summary for Treating Physician</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed">
                        {clinicalDigest}
                      </p>
                    </div>
                  )}

                  {/* Important Findings Callout */}
                  {findings && findings.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                        Significant Findings & Risk Flags
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {findings.map((f, i) => {
                          const isAbnormal =
                            f.status === 'LOW' ||
                            f.status === 'HIGH' ||
                            f.status === 'CRITICAL' ||
                            f.severity === 'CRITICAL' ||
                            f.severity === 'HIGH';
                          return (
                            <div
                              key={i}
                              className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                                isAbnormal
                                  ? 'bg-rose-50/70 border-rose-200 text-rose-950 font-medium'
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              <span className="truncate max-w-[200px]">
                                {isAbnormal ? '🔴 ' : '🟢 '}
                                {f.finding}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-current shrink-0">
                                {f.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Extracted Lab Parameters Table */}
                  {Array.isArray(parameters) && parameters.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                        Extracted Test Observations & Reference Ranges
                      </span>
                      <div className="overflow-x-auto border border-slate-200/90 rounded-xl bg-white">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                            <tr>
                              <th className="p-2.5">Investigation</th>
                              <th className="p-2.5">Observed Value</th>
                              <th className="p-2.5">Ref Interval</th>
                              <th className="p-2.5 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {parameters.map((p, pIdx) => {
                              const alert = p.alert || p.flag === 'LOW' || p.flag === 'HIGH' || p.flag === 'CRITICAL';
                              return (
                                <tr key={pIdx} className={alert ? 'bg-rose-50/40' : ''}>
                                  <td className="p-2.5 font-medium text-slate-900">{p.name || p.param || p.test_name}</td>
                                  <td className="p-2.5 font-mono font-semibold text-slate-900">
                                    {p.value || p.result || `${p.observed_value || ''} ${p.unit || ''}`}
                                  </td>
                                  <td className="p-2.5 font-mono text-slate-500">{p.normalRange || p.reference_range || 'Standard'}</td>
                                  <td className="p-2.5 text-right">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        alert ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {p.status || p.flag || 'Normal'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Fallback for simple key-value extractedData */}
                  {(!Array.isArray(parameters) || parameters.length === 0) &&
                    doc.extractedData &&
                    typeof doc.extractedData === 'object' &&
                    Object.keys(doc.extractedData).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {Object.entries(doc.extractedData).map(([key, val]) => (
                          <div
                            key={key}
                            className="p-2 rounded-lg bg-white border border-slate-200/70 flex items-center justify-between"
                          >
                            <span className="text-slate-600 text-[11px] font-normal">{key}:</span>
                            <strong className="text-slate-900 font-medium text-[11px] ml-2 text-right">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Doctor Side-by-Side Original Document Inspection Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    Physician Document Verification: {inspectingDoc.name || inspectingDoc.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify AI-extracted parameters directly against the original patient uploaded file
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(inspectingDoc.fileUrl, '_blank')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-950 transition cursor-pointer"
                  title="Open in new window"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-100 flex items-center justify-center min-h-[450px]">
              {!inspectingDoc?.fileUrl ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-1">
                  <p className="font-semibold text-slate-800">Document file not found or unavailable.</p>
                  <p className="text-slate-400">The physical medical file could not be located on the server.</p>
                </div>
              ) : (inspectingDoc.type?.includes('pdf') || String(inspectingDoc.fileUrl).toLowerCase().includes('.pdf')) ? (
                <iframe
                  src={inspectingDoc.fileUrl}
                  className="w-full h-[600px] rounded-2xl border border-slate-200 bg-white"
                  title="Doctor Document Verification PDF"
                />
              ) : (
                <img
                  src={inspectingDoc.fileUrl}
                  alt="Original Document"
                  className="max-h-[600px] max-w-full object-contain rounded-2xl shadow-xs"
                />
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
              <span className="text-slate-500 font-medium">
                AI extraction must never replace the original medical document. Verified by treating doctor.
              </span>
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close Verification Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalDocuments;
