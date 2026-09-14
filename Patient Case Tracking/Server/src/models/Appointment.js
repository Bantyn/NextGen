import mongoose from 'mongoose';

export const APPOINTMENT_STATUS = Object.freeze({
  UPCOMING: 'UPCOMING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  PENDING: 'PENDING',
});

const AppointmentSchema = new mongoose.Schema(
  {
    appointment_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `APT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    },
    patient_id: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
      trim: true,
    },
    doctor_id: {
      type: String,
      required: [true, 'Doctor ID is required'],
      index: true,
    },
    doctor_name: {
      type: String,
      required: true,
    },
    doctor_specialization: {
      type: String,
      default: 'General Medicine',
    },
    doctor_avatar: {
      type: String,
      default: null,
    },
    opd_type: {
      type: String,
      enum: ['GENERAL', 'AYUSH'],
      default: 'GENERAL',
    },
    opd_system: {
      type: String,
      default: 'GENERAL_MEDICINE',
    },
    consultation_type: {
      type: String,
      enum: ['IN_PERSON', 'TELECONSULTATION'],
      default: 'IN_PERSON',
    },
    appointment_date: {
      type: Date,
      required: true,
      index: true,
    },
    appointment_time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.UPCOMING,
      index: true,
    },
    room: {
      type: String,
      default: 'OPD Consultation Room',
    },
    reason: {
      type: String,
      default: 'General Consultation',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

AppointmentSchema.index({ patient_id: 1, appointment_date: -1 });

export const Appointment =
  mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

export default Appointment;
