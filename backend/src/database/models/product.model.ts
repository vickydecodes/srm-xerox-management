import mongoose, { Schema, Document, Types } from 'mongoose';
import { Counter } from './counter.model.ts';

export interface IProductVariant extends Document {
  attributes: Map<string, string>;
  sku?: string;
  active: boolean;
}

export interface IProduct extends Document {
  code: string;
  name: string;
  description?: string;
  attributes: Map<string, string[]>;
  variants: Types.DocumentArray<IProductVariant>;
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>({
  attributes: { type: Schema.Types.Map, of: String, required: true },
  sku: { type: String, trim: true },
  active: { type: Boolean, default: true },
});

const ProductSchema = new Schema<IProduct>(
  {
    code: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    attributes: { type: Schema.Types.Map, of: [String], default: {} },
    variants: { type: [ProductVariantSchema], default: [] },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

ProductSchema.pre('save', async function () {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { key: 'product' },
      { $inc: { value: 1 } },
      { upsert: true, new: true }
    );
    this.code = `P-${String(counter!.value).padStart(3, '0')}`;
  }

  const variantCombinations = new Set<string>();

  for (const variant of this.variants) {
    const attributes = variant.attributes;
    if (!attributes || !(attributes instanceof Map)) {
      throw new Error('Variant attributes must be a Map');
    }

    // Sort attributes by key to generate key:value string for duplicate validation
    const sortedEntries = [...attributes.entries()].sort(([a], [b]) => a.localeCompare(b));
    const sortedMap = new Map(sortedEntries);
    variant.attributes = sortedMap;

    const comboKey = sortedEntries.map(([k, v]) => `${k}:${v}`).join(',');
    if (variantCombinations.has(comboKey)) {
      throw new Error(`Duplicate variant combination detected: ${JSON.stringify(Object.fromEntries(sortedEntries))}`);
    }
    variantCombinations.add(comboKey);

    // Generate SKU if not manually specified
    if (!variant.sku) {
      const parts = [this.code, ...sortedEntries.map(([_, v]) => v.toUpperCase())];
      variant.sku = parts.join('-');
    } else {
      variant.sku = variant.sku.toUpperCase();
    }
  }
});

export default mongoose.model<IProduct>('Product', ProductSchema);
