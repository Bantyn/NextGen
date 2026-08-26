const mongoose = require('mongoose');

const ClinicalSessionSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patient_id: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      default: 'gu-IN',
    },
    consultation_type: {
      type: String,
      enum: ['GENERAL', 'AYUSH_AYURVEDA'],
      default: 'GENERAL',
    },
    status: {
      type: String,
      enum: [
        'IDENTIFIED',
        'CONSENT_PENDING',
        'HISTORY_IN_PROGRESS',
        'DOCUMENT_PROCESSING',
        'PRIORITY_TRIAGE',
        'READY_FOR_DOCTOR',
        'DOCTOR_REVIEW',
        'CONSULTATION_COMPLETE',
      ],
      default: 'IDENTIFIED',
    },
    chief_complaint_category: {
      type: String,
      enum: [
        'CHEST_PAIN',
        'FEVER',
        'COUGH_COLD',
        'HEADACHE',
        'STOMACH_PAIN',
        'BODY_JOINT_PAIN',
        'SKIN_PROBLEM',
        'OTHER',
      ],
      default: null,
    },
    current_step_index: {
      type: Number,
      default: 0,
    },
    answered_steps: [
      {
        step_id: String,
        topic: String,
        question_asked: String,
        patient_answer: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    red_flags: {
      has_red_flag: { type: Boolean, default: false },
      severity: { type: String, enum: ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'NONE' },
      reason: String,
      triggered_at: Date,
    },
    ayush_profile: {
      prakriti: String,
      ahara: String,
      vihara: String,
      nidra: String,
      vyayama: String,
    },
    clinical_summary: {
      chief_complaint: String,
      history_of_present_illness: String,
      symptoms: [String],
      past_medical_history: [String],
      medications: [String],
      allergies: [String],
      requires_doctor_review: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicalSession', ClinicalSessionSchema);
