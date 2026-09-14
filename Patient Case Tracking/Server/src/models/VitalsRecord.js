import mongoose from 'mongoose';

const VitalsRecordSchema = new mongoose.Schema(
  {
    vitals_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `VIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    },
    patient_id: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
      trim: true,
    },
    session_id: {
      type: String,
      default: null,
      index: true,
    },
    blood_pressure: {
      systolic: { type: Number, default: null },
      diastolic: { type: Number, default: null },
      unit: { type: String, default: 'mmHg' },
    },
    pulse: {
      value: { type: Number, default: null },
      unit: { type: String, default: 'bpm' },
    },
    spo2: {
      value: { type: Number, default: null },
      unit: { type: String, default: '%' },
    },
    temperature: {
      value: { type: Number, default: null },
      unit: { type: String, default: '°F' },
    },
    blood_sugar: {
      value: { type: Number, default: null },
      type: { type: String, enum: ['FASTING', 'POST_PRANDIAL', 'RANDOM', null], default: 'RANDOM' },
      unit: { type: String, default: 'mg/dL' },
    },
    weight: {
      value: { type: Number, default: null },
      unit: { type: String, default: 'kg' },
    },
    height: {
      value: { type: Number, default: null },
      unit: { type: String, default: 'cm' },
    },
    bmi: {
      value: { type: Number, default: null },
      status: { type: String, default: null },
    },
    respiratory_rate: {
      value: { type: Number, default: null },
      unit: { type: String, default: 'breaths/min' },
    },
    recorded_by: {
      type: String,
      enum: ['PATIENT', 'NURSE', 'DOCTOR', 'DOCUMENT_EXTRACTED', 'KIOSK_AUTOMATED'],
      default: 'PATIENT',
    },
    notes: {
      type: String,
      default: '',
    },
    recorded_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate BMI if weight and height are provided
VitalsRecordSchema.pre('save', function () {
  if (this.weight?.value && this.height?.value && this.height.value > 0) {
    const heightInMeters = this.height.value / 100;
    const bmiVal = Number((this.weight.value / (heightInMeters * heightInMeters)).toFixed(1));
    this.bmi = {
      value: bmiVal,
      status: bmiVal < 18.5 ? 'Underweight' : bmiVal <= 24.9 ? 'Healthy' : bmiVal <= 29.9 ? 'Overweight' : 'Obese',
    };
  }
});

export const VitalsRecord =
  mongoose.models.VitalsRecord || mongoose.model('VitalsRecord', VitalsRecordSchema);

export default VitalsRecord;
