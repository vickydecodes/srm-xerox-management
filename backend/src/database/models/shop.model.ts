import mongoose, { Document, Schema, model } from 'mongoose';
import { Counter } from './counter.model.ts';

export interface IShop extends Document {
  code: string;
  name: string;
  phone: string;
  email?: string;

  createdBy: mongoose.Types.ObjectId;

  active: boolean;
  deleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ShopSchema.pre('save', async function () {
  if (!this.isNew) return;

  const counter = await Counter.findOneAndUpdate(
    { key: 'shop' },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );

  this.code = `SHOP-${String(counter!.value).padStart(3, '0')}`;
});

const Shop = model<IShop>(
  'Shop',
  ShopSchema
);

export default Shop;