import mongoose, { Schema, Document } from 'mongoose';
import Product from './product.model.ts';

export interface IInventoryProduct extends Document {
  inventory: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  variant?: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryProductSchema = new Schema<IInventoryProduct>(
  {
    inventory: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, default: null },
    quantity: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

InventoryProductSchema.pre('save', async function () {
  if (this.isModified('product') || this.isModified('variant')) {
    if (this.variant) {
      const exists = await Product.exists({
        _id: this.product,
        'variants._id': this.variant,
      });
      if (!exists) {
        throw new Error(`Variant ${this.variant} does not exist for product ${this.product}`);
      }
    }
  }
});

InventoryProductSchema.index({ inventory: 1, product: 1, variant: 1 }, { unique: true });

export default mongoose.model<IInventoryProduct>('InventoryProduct', InventoryProductSchema);