import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    name: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


export default mongoose.model<IInventory>('Inventory', InventorySchema);
