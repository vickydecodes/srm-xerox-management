import mongoose, { Document, Schema, model } from 'mongoose';

export interface ICreditPayment {
  amount: number;
  paymentMethod: 'CASH' | 'UPI';
  paidBy: mongoose.Types.ObjectId;
  date: Date;
  remarks?: string;
}

export interface IDepartment extends Document {
  name: string;
  code: string;
  branch: mongoose.Types.ObjectId;

  creditLimit: number;
  outstandingCredit: number;
  creditPayments: ICreditPayment[];

  active: boolean;
  deleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const CreditPaymentSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'UPI'], required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

const DepartmentSchema = new Schema(
  {
    name: { type: String, unique: true },

    code: { type: String, required: true },

    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },

    creditLimit: { type: Number, default: 50000, min: 0 },
    outstandingCredit: { type: Number, default: 0, min: 0 },
    creditPayments: { type: [CreditPaymentSchema], default: [] },

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