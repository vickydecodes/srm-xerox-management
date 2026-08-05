import mongoose, { Schema, Document, Types } from 'mongoose';
import { Counter } from './counter.model.ts';

export enum BillItemType {
  PRODUCT = 'InventoryProduct',
  SERVICE = 'Service',
}

export interface IBillItem {
  type: BillItemType;
  item: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const BillItemSchema = new Schema<IBillItem>(
  {
    type: { type: String, enum: Object.values(BillItemType), required: true },
    item: { type: Schema.Types.ObjectId, required: true, refPath: 'items.type' },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, min: 0 },
  },
  { _id: false }
);

export interface IBill extends Document {
  code: string;
  items: IBillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'CASH' | 'UPI' | 'CREDIT';
  branch?: Types.ObjectId;
  department?: Types.ObjectId;
  status: 'UNPAID' | 'PAID' | 'CANCELLED';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deleted: Boolean;
  deletedAt: Date;
}

const BillSchema = new Schema<IBill>(
  {
    code: { type: String, unique: true },
    items: { type: [BillItemSchema], default: [] },
    subtotal: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, min: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'UPI', 'CREDIT'] },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    createdBy: { type: Schema.Types.ObjectId, refPath: 'User', required: true },
    status: { type: String, enum: ['UNPAID', 'PAID', 'CANCELLED'], default: 'UNPAID' },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

BillSchema.pre('save', async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { key: 'bill' },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );

  this.code = `B-${String(counter!.value).padStart(3, '0')}`;
});

BillSchema.pre('save', function () {
  this.items = this.items.map((item) => ({
    ...item,
    total: item.quantity * item.price,
  }));

  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  this.total = this.subtotal - this.discount + this.tax;
});

export default mongoose.model<IBill>('Bill', BillSchema);
