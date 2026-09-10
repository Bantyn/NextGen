import mongoose from 'mongoose';

/**
 * Doctor Notification Lifecycle States:
 * ACTIVE -> SEEN -> ACCEPTED
 * Non-winning or expired notifications: WITHDRAWN, DECLINED, EXPIRED
 */
export const NOTIFICATION_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SEEN: 'SEEN',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  WITHDRAWN: 'WITHDRAWN',
  ACCEPTED: 'ACCEPTED',
});

const DoctorNotificationSchema = new mongoose.Schema(
  {
    notification_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    case_id: {
      type: String,
      required: true,
      index: true,
    },
    doctor_id: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: 'RED_FLAG_EMERGENCY',
    },
    priority: {
      type: String,
      enum: ['EMERGENCY', 'HIGH_PRIORITY', 'URGENT'],
      default: 'EMERGENCY',
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUS),
      default: NOTIFICATION_STATUS.ACTIVE,
      index: true,
    },
    // Data-minimized preview for emergency dashboard notification
    preview_data: {
      age: { type: String, default: 'Adult' },
      gender: { type: String, default: 'Unknown' },
      chief_complaint: { type: String, default: '' },
      symptoms: [{ type: String }],
      triage_reason: { type: String, default: '' },
      risk_level: { type: String, default: 'RED_FLAG' },
      detected_at: { type: Date, default: Date.now },
    },
    notified_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    seen_at: {
      type: Date,
      default: null,
    },
    responded_at: {
      type: Date,
      default: null,
    },
    decline_reason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for idempotency: one active notification per case and doctor
DoctorNotificationSchema.index({ case_id: 1, doctor_id: 1, status: 1 });
DoctorNotificationSchema.index({ doctor_id: 1, status: 1, notified_at: -1 });

export const DoctorNotification =
  mongoose.models.DoctorNotification ||
  mongoose.model('DoctorNotification', DoctorNotificationSchema);

export default DoctorNotification;
