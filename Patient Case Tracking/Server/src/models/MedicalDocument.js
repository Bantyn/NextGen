import mongoose from 'mongoose';

const MedicalDocumentSchema = new mongoose.Schema(
  {
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
      enum: ['PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY', 'OTHER'],
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
    processing_status: {
      type: String,
      enum: ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'UPLOADED',
      index: true,
    },
  },
  { timestamps: true }
);

export const MedicalDocument =
  mongoose.models.MedicalDocument || mongoose.model('MedicalDocument', MedicalDocumentSchema);

export default MedicalDocument;
