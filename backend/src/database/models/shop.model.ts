import mongoose, { Document, Schema, model } from 'mongoose';


export interface IShop extends Document {
  code: string;
  name: string;
  phone: string;
  email?: string;

  createdBy: mongoose.Types.ObjectId;

  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}


const ShopSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
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
  },
  { timestamps: true }
);


const Shop = model<IShop>(
  'Shop',
  ShopSchema
);


export default Shop;