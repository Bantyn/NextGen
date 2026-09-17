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
    abha_number: {
      type: String,
      trim: true,
      default: null,
    },
    abha_address: {
      type: String,
      trim: true,
      default: null,
    },
    verification_status: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'REJECTED'],
      default: 'VERIFIED',
    },
    verification_method: {
      type: String,
      enum: ['AADHAAR_OTP', 'MOBILE_OTP', 'DEMOGRAPHIC', 'DIRECT_LINK', 'SANDBOX_VERIFIED'],
      default: 'SANDBOX_VERIFIED',
    },
    link_metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    verified_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee an ABHA or Aadhaar reference is unique per identity type across patients
PatientIdentitySchema.index(
  { identity_reference: 1, identity_type: 1 },
  { unique: true, partialFilterExpression: { identity_reference: { $type: 'string' } } }
);

export const PatientIdentity = mongoose.models.PatientIdentity || mongoose.model('PatientIdentity', PatientIdentitySchema);

export default PatientIdentity;
