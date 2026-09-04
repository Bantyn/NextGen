import mongoose from 'mongoose';
import { RECORD_REVIEW_STATUS } from '../constants/patientStatus.js';

const ClinicalRecordSchema = new mongoose.Schema(
  {
    record_id: {
      type: String,
      required: [true, 'Record ID is required'],
      unique: true,
      index: true,
      trim: true,
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
    chief_complaint: {
      type: String,
      default: '',
    },
    structured_history: {
      history_of_present_illness: { type: String, default: '' },
      past_medical_history: [{ type: String }],
      medications: [{ type: String }],
      allergies: [{ type: String }],
      family_history: [{ type: String }],
      lifestyle_ayush: {
        prakriti: String,
        ahara: String,
        vihara: String,
        nidra: String,
        vyayama: String,
      },
    },
    ai_summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    doctor_notes: {
      type: String,
      default: '',
    },
    physician_prescription: [
      {
        medicine_name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
    review_status: {
      type: String,
      enum: Object.values(RECORD_REVIEW_STATUS),
      default: RECORD_REVIEW_STATUS.PENDING,
      index: true,
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const ClinicalRecord =
  mongoose.models.ClinicalRecord || mongoose.model('ClinicalRecord', ClinicalRecordSchema);

export default ClinicalRecord;
