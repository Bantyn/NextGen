import mongoose from 'mongoose';

export const PATIENT_NOTIFICATION_TYPE = Object.freeze({
  REPORT_PROCESSED: 'REPORT_PROCESSED',
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  PRESCRIPTION_READY: 'PRESCRIPTION_READY',
  RISK_ALERT: 'RISK_ALERT',
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT',
});

const PatientNotificationSchema = new mongoose.Schema(
  {
    notification_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `NOTIF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    },
    patient_id: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(PATIENT_NOTIFICATION_TYPE),
      default: PATIENT_NOTIFICATION_TYPE.REPORT_PROCESSED,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: null,
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL', 'SUCCESS'],
      default: 'INFO',
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    read_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

PatientNotificationSchema.index({ patient_id: 1, is_read: 1, createdAt: -1 });

export const PatientNotification =
  mongoose.models.PatientNotification || mongoose.model('PatientNotification', PatientNotificationSchema);

export default PatientNotification;
