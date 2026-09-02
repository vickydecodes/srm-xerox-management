import mongoose, { Schema, Document, Types } from 'mongoose';
import { Counter } from './counter.model.ts';

export interface IServiceMaterial {
  product: Types.ObjectId;
  quantity: number;
}

export interface IService extends Document {
  code: string;
  name: string;
  description?: string;
  unit: string;
  price: number;
  materials: IServiceMaterial[];
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceMaterialSchema = new Schema<IServiceMaterial>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'InventoryProduct', required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ServiceSchema = new Schema<IService>(
  {
    code: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    unit: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    // NOTE: Consuming materials for a service should go through the adjustInventoryQuantity 
    // helper service (type: 'consumption' or 'sale') rather than direct document writes to 
    // InventoryProduct, to ensure atomic updates and maintain audit consistency.
    materials: { type: [ServiceMaterialSchema], default: [] },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

ServiceSchema.pre('save', async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { key: 'service' },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );

  this.code = `S-${String(counter!.value).padStart(3, '0')}`;
});

export default mongoose.model<IService>('Service', ServiceSchema);
