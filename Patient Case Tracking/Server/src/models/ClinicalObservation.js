import mongoose from 'mongoose';
import { OBSERVATION_CATEGORY } from '../constants/patientStatus.js';

const ClinicalObservationSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: [true, 'Session ID is required'],
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(OBSERVATION_CATEGORY),
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Observation name is required'],
      trim: true,
    },
    value: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    source: {
      type: String,
      enum: ['AI_DIALOGUE', 'OCR_DOCUMENT', 'PHYSICIAN_ENTRY'],
      default: 'AI_DIALOGUE',
    },
  },
  { timestamps: true }
);

export const ClinicalObservation =
  mongoose.models.ClinicalObservation || mongoose.model('ClinicalObservation', ClinicalObservationSchema);

export default ClinicalObservation;
