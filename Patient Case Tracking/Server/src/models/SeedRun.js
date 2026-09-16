import mongoose from 'mongoose';

const SeedRunSchema = new mongoose.Schema(
  {
    seed_name: {
      type: String,
      required: [true, 'Seed name is required'],
      unique: true,
      index: true,
      trim: true,
    },
    version: {
      type: String,
      required: [true, 'Seed version is required'],
      trim: true,
    },
    executed_at: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const SeedRun = mongoose.models.SeedRun || mongoose.model('SeedRun', SeedRunSchema);

export default SeedRun;
