import { Document, Schema, model } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: number;
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema(
  {
    name: { type: String, unique: true },
    code: { type: String, required: true },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const Department = model<IDepartment>('Department', DepartmentSchema);
