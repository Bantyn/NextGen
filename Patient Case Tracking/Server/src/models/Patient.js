import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema(
  {
    patient_id: {
      type: String,
      required: [true, 'Patient ID is required'],
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    first_name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: 'OTHER',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      index: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    emergency_contact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
    current_status: {
      type: String,
      default: 'CHECKED_IN',
      index: true,
    },
  },
  { timestamps: true }
);

// Compound text index for search across patient_id, first_name, last_name, phone
PatientSchema.index({
  first_name: 'text',
  last_name: 'text',
  phone: 'text',
  patient_id: 'text',
});

export const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

export default Patient;
