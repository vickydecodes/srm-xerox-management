//// initial setup for the model file to track onn github

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { getNextSequence } from '@core/utils/getsequence.util.ts';

export interface IUser extends Document {
  name: string;
  login_id: string;
  email: string;
  phone: string;
  address?: string;
  password: string;
  role: 'super_admin' | 'branch_admin' | 'department_admin' | 'shop_admin' | 'staff';
  branch?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  shop?: mongoose.Types.ObjectId;

  active: boolean;
  deleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    login_id: { type: String, unique: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'branch_admin', 'department_admin', 'shop_admin', 'staff'],
      required: true,
    },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop'},
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index(
  { branch: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deleted: false,
      branch: { $exists: true },
    },
  }
);

UserSchema.pre('validate', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

UserSchema.pre('save', async function () {
  if (!this.isNew) return;

  const institution = 'SRM';
  const year = new Date().getFullYear().toString().slice(-2);

  const seqKey = `user_srm_${year}`;
  const nextSeq = await getNextSequence(seqKey);

  this.login_id = `${institution}${year}${String(nextSeq).padStart(3, '0')}`;
});

export default mongoose.model<IUser>('User', UserSchema);
