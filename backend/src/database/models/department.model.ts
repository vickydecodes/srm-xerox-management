import mongoose, { Document, Schema, model } from 'mongoose';



export interface IDepartment extends Document {
  name: string;
  code: string;
  branch: mongoose.Types.ObjectId;

  outstandingCredit: number;
  creditBalance: number;

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

    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },

    outstandingCredit: { type: Number, default: 0, min: 0 },
    creditBalance: { type: Number, default: 0, min: 0 },

    active: { type: Boolean, default: true },

    deleted: { type: Boolean, default: false },

    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const Department = model<IDepartment>(
  'Department',
  DepartmentSchema
);

export default Department;