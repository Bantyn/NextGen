import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

/**
 * MedicalDocuments Component
 * Displays uploaded diagnostic reports, OCR extraction status, and extracted clinical values.
 */
export const MedicalDocuments = ({ documents = [] }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-900">
              Diagnostic Reports & Documents (0)
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-400 py-3 text-center">
          No medical records or previous prescriptions uploaded by the patient.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-900">
            Uploaded Reports & AI OCR Extraction ({documents.length})
          </h3>
        </div>
        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
          OCR Processed & Structured
        </span>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
          >
            {/* Document Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-900 font-mono">
                    {doc.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {doc.type} • {doc.date} • {doc.fileSize}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{doc.status}</span>
                </span>
              </div>
            </div>

            {/* Extracted Lab / Diagnostic Values */}
            {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200/60">
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
                  <span>AI Extracted Parameters</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400 font-normal lowercase">Needs doctor review</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {Object.entries(doc.extractedData).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2 rounded-lg bg-white border border-slate-200/70 flex items-center justify-between"
                    >
                      <span className="text-slate-600 text-[11px] font-normal">{key}:</span>
                      <strong className="text-slate-900 font-medium text-[11px] ml-2 text-right">
                        {val}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicalDocuments;
