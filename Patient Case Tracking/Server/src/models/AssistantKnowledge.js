import mongoose from 'mongoose';

const AssistantMedicineSchema = new mongoose.Schema({
  medicine_id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  brand_names: [{ type: String }],
  generic_name: { type: String, required: true },
  category: { type: String },
  purpose: { type: String, required: true },
  dosage_forms: [{ type: String }],
  general_usage_info: { type: String },
  precautions_and_warnings: [{ type: String }],
  contraindications: [{ type: String }],
  common_side_effects: [{ type: String }],
  storage_instructions: { type: String },
  requires_prescription: { type: Boolean, default: false },
}, { timestamps: true });

const AssistantSymptomGuidanceSchema = new mongoose.Schema({
  symptom_key: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  allowed_nominal_advice: [{ type: String }],
  ayush_care_tips: [{ type: String }],
  red_flags: [{ type: String }],
  escalation_note: { type: String },
}, { timestamps: true });

const AssistantFAQSchema = new mongoose.Schema({
  faq_id: { type: String, required: true, unique: true, index: true },
  category: { type: String, index: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { timestamps: true });

const AssistantWebsiteHelpSchema = new mongoose.Schema({
  topic: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  route: { type: String, required: true },
  summary: { type: String, required: true },
}, { timestamps: true });

const AssistantContactSchema = new mongoose.Schema({
  department: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  hours: { type: String },
  location: { type: String },
}, { timestamps: true });

export const AssistantMedicine = mongoose.models.AssistantMedicine || mongoose.model('AssistantMedicine', AssistantMedicineSchema);
export const AssistantSymptomGuidance = mongoose.models.AssistantSymptomGuidance || mongoose.model('AssistantSymptomGuidance', AssistantSymptomGuidanceSchema);
export const AssistantFAQ = mongoose.models.AssistantFAQ || mongoose.model('AssistantFAQ', AssistantFAQSchema);
export const AssistantWebsiteHelp = mongoose.models.AssistantWebsiteHelp || mongoose.model('AssistantWebsiteHelp', AssistantWebsiteHelpSchema);
export const AssistantContact = mongoose.models.AssistantContact || mongoose.model('AssistantContact', AssistantContactSchema);

export default {
  AssistantMedicine,
  AssistantSymptomGuidance,
  AssistantFAQ,
  AssistantWebsiteHelp,
  AssistantContact,
};
