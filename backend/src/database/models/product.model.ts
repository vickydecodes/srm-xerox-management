import mongoose, { Schema, Document } from 'mongoose';
import { Counter } from './counter.model.ts';

export interface IProduct extends Document {
  code: string;
  name: string;
  description?: string;
  variants: Map<string, string[]>;
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    code: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    variants: { type: Map, of: [String], default: {} },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

ProductSchema.pre('save', async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { key: 'product' },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );

  this.code = `P-${String(counter!.value).padStart(3, '0')}`;
});

export default mongoose.model<IProduct>('Product', ProductSchema);
