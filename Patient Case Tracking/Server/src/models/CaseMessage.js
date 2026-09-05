import mongoose from 'mongoose';

const CaseMessageSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: [true, 'Session ID is required'],
      index: true,
    },
    sender: {
      type: String,
      enum: ['AI', 'PATIENT', 'DOCTOR'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
    },
    message_type: {
      type: String,
      enum: ['TEXT', 'VOICE'],
      default: 'TEXT',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const CaseMessage = mongoose.models.CaseMessage || mongoose.model('CaseMessage', CaseMessageSchema);

export default CaseMessage;
