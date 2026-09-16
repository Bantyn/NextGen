import mongoose from 'mongoose';

const MedicalDocumentSchema = new mongoose.Schema(
  {
    document_id: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: () => 'DOC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    },
    patient_id: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    session_id: {
      type: String,
      required: [true, 'Session ID is required'],
      index: true,
    },
    document_type: {
      type: String,
      enum: ['PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY', 'CONSULTATION_NOTE', 'IMAGING_REPORT', 'OTHER'],
      default: 'PRESCRIPTION',
    },
    file_url: {
      type: String,
      required: [true, 'File URL or path is required'],
    },
    file_name: {
      type: String,
      default: '',
    },
    file_size: {
      type: Number,
      default: 0,
    },
    mime_type: {
      type: String,
      default: '',
    },
    extracted_text: {
      type: String,
      default: '',
    },
    structured_data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    extracted_data: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        patient: {},
        doctor: {},
        diagnoses: [],
        symptoms: [],
        chief_complaints: [],
        medical_history: [],
        allergies: [],
        current_medications: [],
        previous_medications: [],
        investigations: [],
        lab_results: [],
        findings: [],
        vitals: {},
      },
    },
    clinical_summary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    patient_summary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    important_findings: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    processing_status: {
      type: String,
      enum: ['UPLOADED', 'PROCESSING', 'EXTRACTING', 'SUMMARIZING', 'COMPLETED', 'FAILED'],
      default: 'UPLOADED',
      index: true,
    },
    confidence_score: {
      type: Number,
      default: 0.9,
    },
    extraction_confidence: {
      type: String,
      enum: ['CLEAR', 'PARTIAL', 'UNCERTAIN'],
      default: 'CLEAR',
    },
    requires_doctor_verification: {
      type: Boolean,
      default: false,
    },
    verification_notes: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for camelCase access
MedicalDocumentSchema.virtual('documentId').get(function () {
  return this.document_id || String(this._id);
});

MedicalDocumentSchema.virtual('patientId').get(function () {
  return this.patient_id;
});

MedicalDocumentSchema.virtual('sessionId').get(function () {
  return this.session_id;
});

MedicalDocumentSchema.virtual('fileName').get(function () {
  return this.file_name;
});

MedicalDocumentSchema.virtual('fileUrl').get(function () {
  return this.file_url;
});

MedicalDocumentSchema.virtual('fileSize').get(function () {
  return this.file_size;
});

MedicalDocumentSchema.virtual('mimeType').get(function () {
  return this.mime_type;
});

MedicalDocumentSchema.virtual('extractedText').get(function () {
  return this.extracted_text;
});

MedicalDocumentSchema.virtual('extractedData').get(function () {
  return this.extracted_data || this.structured_data;
});

MedicalDocumentSchema.virtual('clinicalSummary').get(function () {
  return this.clinical_summary;
});

MedicalDocumentSchema.virtual('patientSummary').get(function () {
  return this.patient_summary;
});

MedicalDocumentSchema.virtual('importantFindings').get(function () {
  return this.important_findings;
});

MedicalDocumentSchema.virtual('processingStatus').get(function () {
  return this.processing_status;
});

MedicalDocumentSchema.virtual('uploadedAt').get(function () {
  return this.createdAt;
});

export const MedicalDocument =
  mongoose.models.MedicalDocument || mongoose.model('MedicalDocument', MedicalDocumentSchema);

export default MedicalDocument;
