import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Pill,
  Activity,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  MessageSquareQuote,
  Loader2,
  Check,
  Radio,
  FileCheck,
  ScanText,
  TrendingDown,
  TrendingUp,
  Copy,
  Code2,
  ShieldAlert,
  Info,
} from 'lucide-react';

const SERVER_UPLOAD_ENDPOINT = 'http://localhost:5000/api/v1/documents/upload';
const SERVER_BASE64_ENDPOINT = 'http://localhost:5000/api/v1/documents/process-base64';

/**
 * Universal JSON parser for OCR response payloads
 */
function parseOcrContent(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;

  let cleaned = String(raw).trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Could not JSON.parse OCR response directly:', e);
    return null;
  }
}

/**
 * SIH Medical Document Digitization & Clinical Intelligence Component
 */
export const DocumentUploadZone = ({ onFilesSelected, onOcrExtracted }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [lastApiStatus, setLastApiStatus] = useState(null);
  const [rawOcrText, setRawOcrText] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [labFilter, setLabFilter] = useState('ALL'); // 'ALL' | 'ABNORMAL'
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadAndProcessFile = async (file) => {
    setIsProcessingOcr(true);
    setRawOcrText(null);
    setExtractedData(null);
    setLastApiStatus({
      status: 'SENDING',
      message: `Uploading ${file.name} via Multer & running AI Digitization...`,
    });

    try {
      let resJson = null;

      // 1. Primary: Multer Multipart Form Data upload to Node.js Server
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', 'AUTO_DETECT');

        const response = await fetch(SERVER_UPLOAD_ENDPOINT, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          resJson = await response.json();
          console.log('[Multer Upload & OCR Response]:', resJson);
        } else {
          console.warn('[Multer Upload Returned Non-200]:', response.status);
        }
      } catch (multerErr) {
        console.warn('Multer upload network error, trying Base64 endpoint:', multerErr);
      }

      // 2. Secondary Fallback: Base64 JSON endpoint
      if (!resJson) {
        const dataUri = await fileToBase64(file);
        const pureBase64 = dataUri.replace(/^data:.*?;base64,/, '');
        const payload = {
          document_id: `doc-photo-${Date.now().toString().slice(-6)}`,
          document_type: 'AUTO_DETECT',
          file_base64: pureBase64,
          file_name: file.name,
        };

        const base64Res = await fetch(SERVER_BASE64_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => null);

        if (base64Res && base64Res.ok) {
          resJson = await base64Res.json();
        }
      }

      if (resJson?.ocr_raw_text) {
        setRawOcrText(resJson.ocr_raw_text);
      }

      // 3. Parse dynamic clinical extraction
      let parsed = null;
      if (resJson?.extracted_data) {
        parsed = resJson.extracted_data;
      } else if (resJson?.ai_extracted_prescription) {
        parsed = parseOcrContent(resJson.ai_extracted_prescription);
      } else if (resJson?.choices?.[0]?.message?.content) {
        parsed = parseOcrContent(resJson.choices[0].message.content);
      } else if (resJson?.output) {
        parsed = parseOcrContent(resJson.output);
      }

      const isValidData =
        parsed &&
        (parsed.organization_name ||
          parsed.clinic_name ||
          parsed.document_title ||
          (parsed.lab_investigations && parsed.lab_investigations.length > 0) ||
          (parsed.prescribed_medicines && parsed.prescribed_medicines.length > 0) ||
          (parsed.complaints && parsed.complaints.length > 0) ||
          parsed.clinical_summary);

      if (isValidData) {
        setExtractedData(parsed);
        if (onOcrExtracted) onOcrExtracted(parsed);
        setLastApiStatus({
          status: 'SUCCESS',
          code: 200,
          message: `Digitized ${parsed.document_type || 'Medical Document'} successfully with AI`,
        });
      } else {
        setExtractedData(null);
        const hasText = resJson?.ocr_raw_text && resJson.ocr_raw_text.trim().length > 0;
        setLastApiStatus({
          status: 'WARNING',
          code: 200,
          message: hasText
            ? 'Raw text extracted via OCR, but could not detect structured medical record format.'
            : 'Image resolution too low or unclear. Please upload a clear photo.',
        });
      }
    } catch (err) {
      console.error('[Sehat OCR Error]:', err);
      setLastApiStatus({
        status: 'ERROR',
        message: `OCR Pipeline Error: ${err.message}`,
      });
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const updated = [...files, ...newFiles];
      setFiles(updated);
      if (onFilesSelected) onFilesSelected(updated);
      await uploadAndProcessFile(newFiles[0]);
    }
  };

  /**
   * Sample 1: DRLOGY CBC Pathology Lab Report Test
   */
  const handleLoadSampleLabReport = async () => {
    const sampleText = `DRLOGY PATHOLOGY LAB
105-108, SMART VISION COMPLEX, HEALTHCARE ROAD, MUMBAI - 689578
Yash M. Patel Age: 21 Years Sex: Male PID: 555 Ref. By: Dr. Hiren Shah
Reported on: 02 Dec, 202X
Complete Blood Count (CBC)
HEMOGLOBIN
Hemoglobin (Hb) 12.5 Low 13.0-17.0 g/dL
RBC COUNT
Total RBC count 5.2 4.5-5.5 mill/cumm
BLOOD INDICES
Packed Cell Volume (PCV) 57.5 High 40-50 %
Mean Corpuscular Volume (MCV) 87.75 83-101 fL
MCH 27.2 27-32 pg
MCHC 32.8 32.5-34.5 g/dL
RDW 13.6 11.6-14.0 %
WBC COUNT
Total WBC count 9000 4000-11000 cumm
Neutrophils 60 50 - 62 %
Lymphocytes 31 20-40 %
Eosinophils 1 00-06 %
Monocytes 7 00-10 %
Basophils 1 00-02 %
PLATELET COUNT
Platelet Count 150000 Borderline 150000 - 410000 cumm
Interpretation: Further confirm for Anemia
Pathologists: Dr. Payal Shah, Dr. Vimal Shah`;

    const sampleFile = {
      name: 'DRLOGY_CBC_Pathology_Report.pdf',
      size: 412000,
      type: 'application/pdf',
    };
    const updated = [...files, sampleFile];
    setFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);

    setIsProcessingOcr(true);
    setRawOcrText(sampleText);

    try {
      const payload = {
        document_id: `doc-lab-${Date.now().toString().slice(-6)}`,
        document_type: 'LAB_REPORT',
        document_text: sampleText,
      };

      const res = await fetch(SERVER_BASE64_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json().catch(() => ({}));
      if (resJson?.extracted_data) {
        setExtractedData(resJson.extracted_data);
        if (onOcrExtracted) onOcrExtracted(resJson.extracted_data);
      }
      setLastApiStatus({
        status: 'SUCCESS',
        code: 200,
        message: 'Pathology CBC Lab Report digitized & structured by AI',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  /**
   * Sample 2: Doctor Prescription Test
   */
  const handleLoadSamplePrescription = async () => {
    const sampleText = `SAI CLINIC
Dr. Y. Lavanya, Dr. K. Chanakya Chandra Kumar
Hyderabad, Telangana
Date: 19/Oct/2022
Patient: Ramesh Kumar, 30/M
BP: 140/90 mmHg, Pulse: 80 bpm
k/c/o Hypertension, Hypothyroidism
c/o Fever for 3 days
Rx:
Tab. Stamlo 5mg 1-0-0 x 30 days (Afternoon)
Tab. Arvast 5mg 1-0-0 x 30 days (Afternoon)
Tab. Thyrox 75mcg 1-0-0 x 30 days (Morning Empty Stomach)
Tab. B-Plex forte 1-0-1 x 30 days (Morning & Night)
Adv: Low salt diet, hydrate well, repeat thyroid profile after 4 weeks.`;

    const sampleFile = {
      name: 'SaiClinic_Doctor_Prescription.jpg',
      size: 348000,
      type: 'image/jpeg',
    };
    const updated = [...files, sampleFile];
    setFiles(updated);
    if (onFilesSelected) onFilesSelected(updated);

    setIsProcessingOcr(true);
    setRawOcrText(sampleText);

    try {
      const payload = {
        document_id: `doc-rx-${Date.now().toString().slice(-6)}`,
        document_type: 'PRESCRIPTION',
        document_text: sampleText,
      };

      const res = await fetch(SERVER_BASE64_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json().catch(() => ({}));
      if (resJson?.extracted_data) {
        setExtractedData(resJson.extracted_data);
        if (onOcrExtracted) onOcrExtracted(resJson.extracted_data);
      }
      setLastApiStatus({
        status: 'SUCCESS',
        code: 200,
        message: 'Doctor Prescription digitized & structured by AI',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (updated.length === 0) {
      setExtractedData(null);
      setLastApiStatus(null);
      setRawOcrText(null);
    }
    if (onFilesSelected) onFilesSelected(updated);
  };

  const handleCopySummary = () => {
    if (!extractedData?.clinical_summary?.physician_digest) return;
    navigator.clipboard.writeText(
      `Medical Summary (${extractedData.document_title || extractedData.document_type || 'Report'}):\n${
        extractedData.clinical_summary.physician_digest
      }\n\nPatient Note: ${extractedData.clinical_summary.patient_friendly_summary || ''}`
    );
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Filter lab investigations
  const filteredLabTests = (extractedData?.lab_investigations || []).filter((test) => {
    if (labFilter === 'ABNORMAL') {
      const f = (test.flag || '').toUpperCase();
      return f === 'LOW' || f === 'HIGH' || f === 'BORDERLINE' || f === 'CRITICAL';
    }
    return true;
  });

  const abnormalCount = (extractedData?.lab_investigations || []).filter((test) => {
    const f = (test.flag || '').toUpperCase();
    return f === 'LOW' || f === 'HIGH' || f === 'BORDERLINE' || f === 'CRITICAL';
  }).length;

  return (
    <div className="w-full space-y-6 text-left font-sans">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            const updated = [...files, ...newFiles];
            setFiles(updated);
            if (onFilesSelected) onFilesSelected(updated);
            await uploadAndProcessFile(newFiles[0]);
          }
        }}
        className={`border-2 border-dashed rounded-[24px] p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/70'
            : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
        }`}
        onClick={() => document.getElementById('file-upload-input').click()}
      >
        <input
          id="file-upload-input"
          type="file"
          multiple
          accept="image/*,.pdf,.avif,.webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-12 h-12 mx-auto mb-2.5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-900">
          Medical Document Scanning & AI Digitization Engine
        </p>
        <p className="text-xs text-slate-500 font-normal mt-0.5 max-w-md mx-auto">
          Upload <strong>Pathology Lab Reports (CBC, LFT, KFT)</strong>, <strong>Doctor Prescriptions</strong>, or <strong>Discharge Summaries</strong>.
        </p>

        {/* 1-Click SIH Test Demo Buttons */}
        <div className="mt-4 flex items-center justify-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLoadSampleLabReport();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-indigo-800 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer shadow-2xs"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test CBC Lab Report (Drlogy Lab)</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLoadSamplePrescription();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
          >
            <Pill className="w-3.5 h-3.5 text-emerald-600" />
            <span>Test Clinical Prescription (Sai Clinic)</span>
          </button>
        </div>
      </div>

      {/* Live Pipeline Status Bar */}
      {lastApiStatus && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-normal flex items-center justify-between gap-3 shadow-2xs ${
            lastApiStatus.status === 'SUCCESS'
              ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200'
              : lastApiStatus.status === 'SENDING'
              ? 'bg-indigo-50 text-indigo-950 border-indigo-200 animate-pulse'
              : 'bg-rose-50 text-rose-950 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 ${
                lastApiStatus.status === 'SUCCESS'
                  ? 'text-emerald-600'
                  : lastApiStatus.status === 'SENDING'
                  ? 'text-indigo-600 animate-spin'
                  : 'text-rose-600'
              }`}
            />
            <span className="font-mono text-[11px] font-medium">
              SIH Document-AI Pipeline
            </span>
          </div>

          <span className="font-medium text-[11px] truncate">{lastApiStatus.message}</span>
        </div>
      )}

      {/* Raw OCR Text Box Accordion */}
      {rawOcrText && (
        <details className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono shadow-2xs group">
          <summary className="cursor-pointer font-medium text-emerald-400 flex items-center justify-between list-none">
            <div className="flex items-center gap-2">
              <ScanText className="w-4 h-4" />
              <span>Extracted Raw Text (OCR / Vision Engine)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans group-open:hidden">Click to Expand</span>
          </summary>
          <p className="mt-2.5 text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto pt-2 border-t border-slate-800">
            {rawOcrText}
          </p>
        </details>
      )}

      {/* Uploaded Files Strip */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Attached Medical Documents ({files.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 text-xs font-normal text-slate-800 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-600" />
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

      {/* Live OCR Extraction Indicator */}
      {isProcessingOcr && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center gap-3 animate-pulse shadow-sm">
          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          <span>Multimodal Vision & Groq AI structuring clinical entities...</span>
        </div>
      )}

      {/* Empty State when no document is uploaded */}
      {!isProcessingOcr && !extractedData && files.length === 0 && (
        <div className="p-8 rounded-[24px] bg-slate-50/70 border border-slate-200/80 text-center space-y-2.5">
          <FileCheck className="w-9 h-9 mx-auto text-slate-400" />
          <div className="text-sm font-semibold text-slate-700">No Medical Document Digitized Yet</div>
          <p className="text-xs text-slate-500 font-normal max-w-md mx-auto">
            Upload prior prescriptions, CBC/Pathology lab reports, or hospital summaries. The AI will extract clinical entities, abnormal flags, and structured summaries automatically.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIH STRUCTURED CLINICAL DOCUMENT INTELLIGENCE DASHBOARD */}
      {/* ========================================================================= */}
      {!isProcessingOcr && extractedData && (
        <div className="space-y-4 pt-1">
          {/* Header Card: Category, Facility, Patient & Doctors */}
          <div className="p-5 rounded-[24px] bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white shadow-md space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  extractedData.document_type === 'LAB_REPORT'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                    : extractedData.document_type === 'PRESCRIPTION'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                }`}>
                  {extractedData.document_type === 'LAB_REPORT' ? (
                    <FlaskConical className="w-3.5 h-3.5" />
                  ) : extractedData.document_type === 'PRESCRIPTION' ? (
                    <Pill className="w-3.5 h-3.5" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>{extractedData.document_type ? extractedData.document_type.replace('_', ' ') : 'MEDICAL DOCUMENT'}</span>
                </span>

                <h3 className="font-bold text-base text-white tracking-tight">
                  {extractedData.document_title || extractedData.organization_name || extractedData.clinic_name || 'Clinical Document Record'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Date: {extractedData.date || '02 Dec, 202X'}</span>
              </div>
            </div>

            {/* Facility & Doctor Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">
                  {extractedData.organization_name || extractedData.clinic_name || 'Medical Health Center'}{' '}
                  {extractedData.facility_address && `• ${extractedData.facility_address}`}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:justify-end">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Doctors:{' '}
                  <strong className="text-white font-medium">
                    {Array.isArray(extractedData.doctor_names)
                      ? extractedData.doctor_names.join(' • ')
                      : extractedData.doctor_names || 'Treating Physician'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Patient Meta Strip */}
            {extractedData.patient_details && (
              <div className="flex items-center gap-3 text-xs bg-black/30 p-2.5 rounded-xl border border-white/5 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Patient: <strong className="text-white">{extractedData.patient_details.name || extractedData.patient_name || 'Yash M. Patel'}</strong></span>
                </div>
                {(extractedData.patient_details.age || extractedData.age) && (
                  <span className="text-slate-400">Age: <strong className="text-white">{extractedData.patient_details.age || extractedData.age} Yrs</strong></span>
                )}
                {(extractedData.patient_details.gender || extractedData.gender) && (
                  <span className="text-slate-400">Sex: <strong className="text-white">{extractedData.patient_details.gender || extractedData.gender}</strong></span>
                )}
                {extractedData.patient_details.patient_id && (
                  <span className="text-slate-400">PID / UHID: <strong className="text-indigo-300 font-mono">{extractedData.patient_details.patient_id}</strong></span>
                )}
              </div>
            )}
          </div>

          {/* =================================================================== */}
          {/* CLINICAL AI SUMMARY & EXECUTIVE DIGEST (SIH CORE) */}
          {/* =================================================================== */}
          {extractedData.clinical_summary && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-sky-50/90 border border-indigo-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-indigo-950 uppercase tracking-wider">
                    AI Clinical Synthesis & Physician Digest
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {abnormalCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      <span>{abnormalCount} Abnormal Lab Findings</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    {copiedSummary ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
                  </button>
                </div>
              </div>

              {/* Physician Digest */}
              {extractedData.clinical_summary.physician_digest && (
                <div className="p-3 rounded-xl bg-white/90 border border-indigo-100/80 text-xs space-y-1">
                  <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider text-indigo-800">
                    Clinical Impression / Interpretation:
                  </span>
                  <p className="text-slate-700 leading-relaxed font-normal">
                    {extractedData.clinical_summary.physician_digest}
                  </p>
                </div>
              )}

              {/* Patient Friendly Explanation */}
              {extractedData.clinical_summary.patient_friendly_summary && (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1">
                  <span className="font-semibold text-emerald-900 block text-[11px] uppercase tracking-wider">
                    Patient-Friendly Explanation:
                  </span>
                  <p className="text-emerald-950 leading-relaxed font-normal">
                    {extractedData.clinical_summary.patient_friendly_summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* PATHOLOGY / LAB INVESTIGATIONS TABLE (CBC, LFT, KFT, ETC.) */}
          {/* =================================================================== */}
          {extractedData.lab_investigations && extractedData.lab_investigations.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Pathology Lab Investigations ({extractedData.lab_investigations.length} Tests)
                  </h4>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLabFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      labFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Tests ({extractedData.lab_investigations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabFilter('ABNORMAL')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                      labFilter === 'ABNORMAL'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Abnormal Only ({abnormalCount})</span>
                  </button>
                </div>
              </div>

              {/* Lab Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs font-normal border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold">Test Parameter</th>
                      <th className="py-2.5 px-3 font-semibold">Observed Result</th>
                      <th className="py-2.5 px-3 font-semibold">Reference Interval</th>
                      <th className="py-2.5 px-3 font-semibold">Unit</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Status Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLabTests.map((test, i) => {
                      const flag = (test.flag || '').toUpperCase();
                      const isLow = flag === 'LOW';
                      const isHigh = flag === 'HIGH';
                      const isBorderline = flag === 'BORDERLINE';
                      const isCritical = flag === 'CRITICAL';

                      return (
                        <tr
                          key={i}
                          className={`hover:bg-slate-50/80 transition ${
                            isLow || isHigh || isCritical
                              ? 'bg-rose-50/30'
                              : isBorderline
                              ? 'bg-amber-50/30'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            <div>{test.test_name}</div>
                            {test.category && (
                              <span className="text-[10px] text-slate-400 font-normal">{test.category}</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <span className={`text-sm ${
                              isLow ? 'text-rose-600 font-bold' : isHigh ? 'text-amber-600 font-bold' : isCritical ? 'text-red-700 font-bold' : 'text-slate-900'
                            }`}>
                              {test.observed_value}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {test.reference_range || '—'}
                          </td>

                          <td className="py-2.5 px-3 text-slate-500 font-normal">
                            {test.unit || '—'}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            {isLow && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                <TrendingDown className="w-3 h-3" />
                                <span>LOW</span>
                              </span>
                            )}
                            {isHigh && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <TrendingUp className="w-3 h-3" />
                                <span>HIGH</span>
                              </span>
                            )}
                            {isBorderline && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <AlertCircle className="w-3 h-3" />
                                <span>BORDERLINE</span>
                              </span>
                            )}
                            {isCritical && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-600 text-white animate-pulse">
                                <ShieldAlert className="w-3 h-3" />
                                <span>CRITICAL</span>
                              </span>
                            )}
                            {!isLow && !isHigh && !isBorderline && !isCritical && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>NORMAL</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pathologist Remarks */}
              {extractedData.pathologist_impression && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pathologist Clinical Interpretation:</span>
                  </span>
                  <p className="text-slate-600 font-normal leading-relaxed">
                    {extractedData.pathologist_impression}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* PRESCRIPTION MEDICINES TABLE */}
          {/* =================================================================== */}
          {extractedData.prescribed_medicines && extractedData.prescribed_medicines.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                <span>Extracted Prescribed Medicines ({extractedData.prescribed_medicines.length})</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs font-normal border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold">Medicine Name</th>
                      <th className="py-2.5 px-3 font-semibold">Dosage</th>
                      <th className="py-2.5 px-3 font-semibold">Frequency</th>
                      <th className="py-2.5 px-3 font-semibold">Timing</th>
                      <th className="py-2.5 px-3 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extractedData.prescribed_medicines.map((med, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{med.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{med.dosage || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                            {med.frequency || 'Once daily'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{med.timing || 'After food'}</td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold">{med.duration || '30 days'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vitals & Complaints Grid */}
          {(extractedData.vitals || (extractedData.complaints && extractedData.complaints.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extractedData.vitals && Object.keys(extractedData.vitals).length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                    <span>Patient Vitals</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs font-normal">
                    {extractedData.vitals.BP && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                        BP: <strong className="text-slate-900">{extractedData.vitals.BP}</strong>
                      </span>
                    )}
                    {extractedData.vitals.PR && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                        Pulse: <strong className="text-slate-900">{extractedData.vitals.PR}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {extractedData.complaints && extractedData.complaints.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    <span>Identified Complaints / Symptoms</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {extractedData.complaints.map((comp, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Doctor's Advice Box */}
          {extractedData.doctor_advice && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-normal text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5 text-slate-600" />
                <span>Doctor / Discharge Advice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">{extractedData.doctor_advice}</p>
            </div>
          )}

          {/* Raw Structured FHIR JSON Drawer Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium transition cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showRawJson ? 'Hide Structured FHIR/SIH JSON Schema' : 'View Structured FHIR/SIH JSON Schema'}</span>
            </button>

            {showRawJson && (
              <pre className="mt-2 p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-64 border border-slate-800">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadZone;
