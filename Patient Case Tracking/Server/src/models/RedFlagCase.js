import mongoose from 'mongoose';

/**
 * Red Flag Case State Machine:
 * DETECTED -> BROADCASTING -> ACKNOWLEDGED -> ASSIGNED -> IN_CONSULTATION -> RESOLVED
 * Terminal / Secondary states: CANCELLED, DISMISSED, TRANSFERRED
 */
export const RED_FLAG_STATUS = Object.freeze({
  DETECTED: 'DETECTED',
  BROADCASTING: 'BROADCASTING',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  ASSIGNED: 'ASSIGNED',
  IN_CONSULTATION: 'IN_CONSULTATION',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
  DISMISSED: 'DISMISSED',
  TRANSFERRED: 'TRANSFERRED',
});

const RedFlagCaseSchema = new mongoose.Schema(
  {
    case_id: {
      type: String,
      required: [true, 'Case ID is required'],
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    patient_id: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
      trim: true,
    },
    clinical_session_id: {
      type: String,
      required: [true, 'Clinical Session ID is required'],
      index: true,
      trim: true,
    },
    risk_level: {
      type: String,
      enum: ['RED_FLAG', 'HIGH', 'CRITICAL'],
      default: 'RED_FLAG',
      index: true,
    },
    priority: {
      type: String,
      enum: ['EMERGENCY', 'HIGH_PRIORITY'],
      default: 'EMERGENCY',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(RED_FLAG_STATUS),
      default: RED_FLAG_STATUS.DETECTED,
      index: true,
    },
    trigger: {
      type: { type: String, default: 'CLINICAL_SYMPTOM_ALERT' },
      source: { type: String, default: 'clinical_assessment' },
      confidence: { type: Number, default: 1.0 },
      category: { type: String, default: 'CARDIOVASCULAR_EMERGENCY' },
      reason: { type: String, default: '' },
    },
    symptoms: [{ type: String }],
    specialties: [{ type: String }],
    eligible_doctors: [{ type: String }],
    notified_doctors: [{ type: String }],
    assigned_doctor_id: {
      type: String,
      default: null,
      index: true,
    },
    claimed_at: {
      type: Date,
      default: null,
    },
    handled_at: {
      type: Date,
      default: null,
    },
    resolved_at: {
      type: Date,
      default: null,
    },
    transfer_history: [
      {
        from_doctor_id: String,
        to_doctor_id: String,
        reason: String,
        transferred_by: String,
        transferred_at: { type: Date, default: Date.now },
      },
    ],
    resolution: {
      notes: { type: String, default: '' },
      disposition: { type: String, default: '' },
      resolved_by: { type: String, default: null },
      resolved_at: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Compound indexes for atomic concurrency claiming and doctor queue filtering
RedFlagCaseSchema.index({ status: 1, assigned_doctor_id: 1 });
RedFlagCaseSchema.index({ clinical_session_id: 1, status: 1 });
RedFlagCaseSchema.index({ patient_id: 1, status: 1 });
RedFlagCaseSchema.index({ createdAt: -1 });

export const RedFlagCase =
  mongoose.models.RedFlagCase || mongoose.model('RedFlagCase', RedFlagCaseSchema);

export default RedFlagCase;
