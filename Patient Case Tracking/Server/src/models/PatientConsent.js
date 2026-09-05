import mongoose from 'mongoose';
import { CONSENT_STATUS, CONSENT_TYPE } from '../constants/patientStatus.js';

const PatientConsentSchema = new mongoose.Schema(
  {
    patient_id: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    session_id: {
      type: String,
      default: null,
      index: true,
    },
    consent_type: {
      type: String,
      enum: Object.values(CONSENT_TYPE),
      required: true,
      default: CONSENT_TYPE.AI_CASE_TAKING,
    },
    status: {
      type: String,
      enum: Object.values(CONSENT_STATUS),
      default: CONSENT_STATUS.GRANTED,
    },
    granted_at: {
      type: Date,
      default: Date.now,
    },
    revoked_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const PatientConsent = mongoose.models.PatientConsent || mongoose.model('PatientConsent', PatientConsentSchema);

export default PatientConsent;
