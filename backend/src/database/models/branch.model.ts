import { Document, Schema, model } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema(
  {
    name: { type: String, unique: true },
    code: { type: String, required: true },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const Branch = model<IBranch>('Branch', BranchSchema);

export default Branch;