import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryProduct extends Document {
  inventory: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  variant: Map<string, string>;
  quantity: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryProductSchema = new Schema<IInventoryProduct>(
  {
    inventory: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Map, of: String, default: {} },
    quantity: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

InventoryProductSchema.pre('save', function () {
  if (this.isModified('variant')) {
    const sorted = new Map([...this.variant.entries()].sort(([a], [b]) => a.localeCompare(b)));
    this.variant = sorted;
  }
});

InventoryProductSchema.index({ inventory: 1, product: 1, variant: 1 }, { unique: true });

export default mongoose.model<IInventoryProduct>('InventoryProduct', InventoryProductSchema);
