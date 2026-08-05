import mongoose, { Schema, Document } from 'mongoose';
import Inventory from './inventory.model.ts';
import Product from './product.model.ts';

export interface IInventoryProduct extends Document {
  inventory: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  name?: string;
  variant: Map<string, string>;
  quantity: number;
  price: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryProductSchema = new Schema<IInventoryProduct>(
  {
    inventory: { type: Schema.Types.ObjectId, ref: 'Inventory' },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, trim: true },
    variant: { type: Map, of: String, default: {} },
    quantity: { type: Number, default: 0, min: 0 },
    price: {type: Number, required: true, min: 0},
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

InventoryProductSchema.pre('save', async function () {
  if (!this.inventory) {
    const inventory = await Inventory.findOne();

    if (!inventory) {
      throw new Error('No inventory exists to attach this inventory product to.');
    }

    this.inventory = inventory._id;
  }

  if (this.isModified('variant')) {
    const sorted = new Map([...this.variant.entries()].sort(([a], [b]) => a.localeCompare(b)));
    this.variant = sorted;
  }

  if (this.isModified('product') || this.isNew || !this.name) {
    const p = await Product.findById(this.product);
    if (p) {
      this.name = p.name;
    }
  }
});

InventoryProductSchema.index({ inventory: 1, product: 1, variant: 1 }, { unique: true });

export default mongoose.model<IInventoryProduct>('InventoryProduct', InventoryProductSchema);