import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICreditPayment extends Document {
  department: Types.ObjectId;
  bills: Types.ObjectId[];
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'OTHER';
  otherPaymentMethod?: string;
  paidBy: Types.ObjectId;
  date: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreditPaymentSchema = new Schema<ICreditPayment>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    bills: [{ type: Schema.Types.ObjectId, ref: 'Bill', required: true }],
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'UPI', 'OTHER'], required: true },
    otherPaymentMethod: { type: String },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICreditPayment>('CreditPayment', CreditPaymentSchema);