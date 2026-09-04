import mongoose from 'mongoose';

const PatientIdentitySchema = new mongoose.Schema(
  {
    patient_id: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
      ref: 'Patient',
    },
    identity_type: {
      type: String,
      enum: ['ABHA', 'AADHAAR', 'LOCAL'],
      required: true,
      default: 'LOCAL',
    },
    identity_reference: {
      type: String,
      required: [true, 'Identity reference is required'],
      trim: true,
    },
    verification_status: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'REJECTED'],
      default: 'VERIFIED',
    },
    verified_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const PatientIdentity = mongoose.models.PatientIdentity || mongoose.model('PatientIdentity', PatientIdentitySchema);

export default PatientIdentity;
