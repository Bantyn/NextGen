import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  AlertCircle,
  Clock,
  Pill,
  Activity,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

/**
 * DocumentUploadZone Component — Module B: Medical Document Digitization & Intelligence
 * Handles physical prescriptions, lab reports, and discharge summaries with OCR extraction,
 * abnormal lab value highlighting, and chronological medical timeline.
 */
export const DocumentUploadZone = ({ onFilesSelected, onOcrExtracted }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  // Extracted Structured Medical Intelligence
  const [extractedEntities, setExtractedEntities] = useState({
    medications: [
      { name: 'Tab Metformin', dosage: '500 mg', freq: '1-0-1 after food', indication: 'Type 2 Diabetes' },
      { name: 'Tab Telmisartan', dosage: '40 mg', freq: '1-0-0 morning', indication: 'Hypertension' },
      { name: 'Cap Omeprazole', dosage: '20 mg', freq: '1-0-0 before food', indication: 'Gastritis' }
    ],
    labResults: [
      { test: 'HbA1c (Glycated Hemoglobin)', value: '8.9 %', refRange: '4.0 - 5.6 %', isAbnormal: true, flag: 'HIGH' },
      { test: 'Fasting Blood Sugar (FBS)', value: '162 mg/dL', refRange: '70 - 100 mg/dL', isAbnormal: true, flag: 'HIGH' },
      { test: 'Serum Creatinine', value: '0.9 mg/dL', refRange: '0.6 - 1.2 mg/dL', isAbnormal: false, flag: 'NORMAL' },
      { test: 'Total Cholesterol', value: '215 mg/dL', refRange: '< 200 mg/dL', isAbnormal: true, flag: 'ELEVATED' }
    ],
    timeline: [
      { date: '12 Jan 2026', type: 'Lab Report', source: 'Apex Diagnostics', summary: 'Elevated fasting blood sugar & HbA1c 8.9%' },
      { date: '04 Nov 2025', type: 'Prescription', source: 'City Civil Hospital OPD', summary: 'Started on Metformin 500mg & Telmisartan 40mg' },
      { date: '18 Aug 2024', type: 'Discharge Summary', source: 'Sterling Hospital', summary: 'Acute Viral Gastroenteritis - conservative recovery' }
    ]
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const updated = [...files, ...newFiles];
      setFiles(updated);
      if (onFilesSelected) onFilesSelected(updated);
      simulateOcrProcessing(updated);
    }
  };

  const simulateOcrProcessing = (currentFiles) => {
    setIsProcessingOcr(true);
    setTimeout(() => {
      setIsProcessingOcr(false);
      if (onOcrExtracted) onOcrExtracted(extractedEntities);
    }, 1200);
  };

  const handleLoadSampleReport = () => {
    const sampleFile = {
      name: 'Dr_Patel_Prescription_&_Lab_Report.pdf',
      size: 420000,
      type: 'application/pdf',
    };
    const updated = [...files, sampleFile];
    setFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);
    simulateOcrProcessing(updated);
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);
  };

  return (
    <div className="w-full space-y-6">
      {/* Drag & Drop Upload Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            const updated = [...files, ...newFiles];
            setFiles(updated);
            if (onFilesSelected) onFilesSelected(updated);
            simulateOcrProcessing(updated);
          }
        }}
        className={`border-2 border-dashed rounded-[24px] p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-slate-800 bg-slate-100/70'
            : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
        }`}
        onClick={() => document.getElementById('file-upload-input').click()}
      >
        <input
          id="file-upload-input"
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-11 h-11 mx-auto mb-2.5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
          <UploadCloud className="w-5 h-5 text-slate-700" />
        </div>
        <p className="text-sm font-normal text-slate-900">
          Upload or Scan Previous Prescriptions & Lab Reports
        </p>
        <p className="text-xs text-slate-400 font-normal mt-0.5">
          Camera snapshot, images (PNG, JPG) or PDF files up to 15MB
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLoadSampleReport();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 transition cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Load Sample Prescription (1-Click Test)</span>
          </button>
        </div>
      </div>

      {/* Uploaded File Tags */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Attached Documents ({files.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 text-xs font-normal text-slate-800 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div className="truncate">
                    <div className="truncate font-medium text-slate-900">{file.name}</div>
                    <span className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OCR Processing Banner */}
      {isProcessingOcr && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-normal flex items-center gap-3 animate-pulse">
          <Sparkles className="w-4 h-4 text-sky-600 animate-spin" />
          <span>Document-AI pipeline is performing Multilingual OCR & Entity Extraction...</span>
        </div>
      )}

      {/* Module B: Structured Medical Intelligence Extraction Results */}
      {files.length > 0 && !isProcessingOcr && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Document-AI Extracted Intelligence
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-normal">
              High Confidence OCR (98.4%)
            </span>
          </div>

          {/* 1. Prescribed Medications */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <div className="text-xs font-medium text-slate-900 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-slate-700" />
              <span>Extracted Current Medications & Dosages</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {extractedEntities.medications.map((med, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-normal">
                  <div className="font-medium text-slate-900">{med.name} ({med.dosage})</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{med.freq}</div>
                  <span className="inline-block mt-1 text-[10px] text-slate-400">{med.indication}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Lab Results with Abnormal Value Highlighting */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <div className="text-xs font-medium text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-600" />
                <span>Lab Investigations (Abnormal Values Flagged)</span>
              </div>
              <span className="text-[11px] text-rose-600 font-normal">3 Out-of-Range</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {extractedEntities.labResults.map((lab, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs font-normal flex items-center justify-between ${
                    lab.isAbnormal
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-medium">{lab.test}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Ref: {lab.refRange}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-medium text-sm">{lab.value}</div>
                    {lab.isAbnormal ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full mt-0.5">
                        <AlertCircle className="w-3 h-3" /> {lab.flag}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                        NORMAL
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Chronological Medical Timeline */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <div className="text-xs font-medium text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-700" />
              <span>Chronological Medical Timeline for Physician</span>
            </div>

            <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {extractedEntities.timeline.map((item, i) => (
                <div key={i} className="relative text-xs font-normal">
                  <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900 ring-2 ring-white" />
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{item.date}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item.type}</span>
                    <span className="text-[11px] text-slate-400 truncate">• {item.source}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadZone;
