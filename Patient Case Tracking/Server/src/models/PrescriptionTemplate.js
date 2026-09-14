import mongoose from 'mongoose';

const PrescriptionTemplateSchema = new mongoose.Schema(
  {
    template_id: {
      type: String,
      required: [true, 'Template ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    doctor_id: {
      type: String,
      required: [true, 'Doctor ID is required'],
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Template title is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General Medicine',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    medicines: [
      {
        medicine_name: { type: String, required: true },
        generic_name: { type: String, default: '' },
        dosage: { type: String, default: '1 tablet' },
        frequency: { type: String, default: 'Twice daily (BD)' },
        route: { type: String, default: 'Oral' },
        duration: { type: String, default: '5 days' },
        instructions: { type: String, default: 'Take with warm water' },
        before_after_food: { type: String, enum: ['BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'AS_NEEDED'], default: 'AFTER_FOOD' },
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const PrescriptionTemplate =
  mongoose.models.PrescriptionTemplate ||
  mongoose.model('PrescriptionTemplate', PrescriptionTemplateSchema);

export default PrescriptionTemplate;
