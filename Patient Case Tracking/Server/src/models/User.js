import mongoose from 'mongoose';
import { ROLES, ALL_ROLES } from '../constants/roles.js';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    password_hash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.STAFF,
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150'],
      default: null,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: 'OTHER',
      uppercase: true,
      trim: true,
    },
    // Doctor profile & live availability fields
    doctor_id: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    specialty: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    sub_specialty: {
      type: String,
      default: null,
      trim: true,
    },
    on_duty: {
      type: Boolean,
      default: true,
      index: true,
    },
    availability_status: {
      type: String,
      enum: ['AVAILABLE', 'IN_CONSULTATION', 'ON_BREAK', 'OFF_DUTY'],
      default: 'AVAILABLE',
      index: true,
    },
    opd_type: {
      type: String,
      enum: ['GENERAL', 'AYUSH'],
      default: 'GENERAL',
      index: true,
    },
    opd_system: {
      type: String,
      default: 'GENERAL_MEDICINE',
      index: true,
    },
    room: {
      type: String,
      default: 'Room 104',
      trim: true,
    },
  },
  { timestamps: true }
);

// Sparse unique index for user mobile numbers
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

// Do not return password_hash in toJSON transformation
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
