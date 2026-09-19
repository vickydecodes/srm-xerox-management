import prisma from '@config/prisma.config.js';
import { CounterModel } from './counter.model.js';

export interface IProductVariant {
  attributes: Record<string, string> | Map<string, string>;
  sku?: string;
  active: boolean;
}

export interface IProduct {
  code: string;
  name: string;
  description?: string;
  attributes: Record<string, string[]> | Map<string, string[]>;
  variants: IProductVariant[];
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductDocument {
  _id!: string;
  code!: string;
  name!: string;
  description?: string;
  attributes!: any;
  variants!: any[];
  active!: boolean;
  deleted!: boolean;
  deletedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  isNew: boolean = false;

  constructor(data: any) {
    Object.assign(this, data);
    this._id = data._id || data.id;
    if (!this._id) {
      this.isNew = true;
    }
    if (this.attributes === undefined) this.attributes = {};
    if (!this.variants) this.variants = [];
    if (this.active === undefined) this.active = true;
    if (this.deleted === undefined) this.deleted = false;
  }

  isModified(path: string) {
    return true;
  }

  async runPreSaveHooks() {
    if (this.isNew && !this.code) {
      const counter = await CounterModel.findOneAndUpdate(
        { key: 'product' },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
      );
      this.code = `P-${String(counter!.value).padStart(3, '0')}`;
    }

    const variantCombinations = new Set<string>();

    for (const variant of this.variants) {
      // In JS, attributes could be Map or plain object. Normalize to Object for JSON storage.
      let attrs: any = variant.attributes;
      if (attrs instanceof Map) {
        attrs = Object.fromEntries(attrs);
      }
      if (!attrs || typeof attrs !== 'object') {
        throw new Error('Variant attributes must be an object or Map');
      }

      // Sort attributes by key to generate key:value string for duplicate validation
      const sortedEntries = Object.entries(attrs).sort(([a], [b]) => a.localeCompare(b as string));
      const sortedMap = Object.fromEntries(sortedEntries);
      variant.attributes = sortedMap;

      const comboKey = sortedEntries.map(([k, v]) => `${k}:${v}`).join(',');
      if (variantCombinations.has(comboKey)) {
        throw new Error(`Duplicate variant combination detected: ${JSON.stringify(sortedMap)}`);
      }
      variantCombinations.add(comboKey);

      // Generate SKU if not manually specified
      if (!variant.sku) {
        const parts = [this.code, ...sortedEntries.map(([_, v]) => (v as string).toUpperCase())];
        variant.sku = parts.join('-');
      } else {
        variant.sku = variant.sku.toUpperCase();
      }
    }
  }

  async save() {
    await this.runPreSaveHooks();

    const payload = {
      code: this.code,
      name: this.name,
      description: this.description,
      attributes: (this.attributes instanceof Map) ? Object.fromEntries(this.attributes) : this.attributes,
      variants: this.variants,
      active: this.active,
      deleted: this.deleted,
      deletedAt: this.deletedAt,
    };

    if (this.isNew) {
      const created = await prisma.product.create({
        data: payload as any
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.product.update({
        where: { id: this._id },
        data: payload as any
      });
    }
    return this;
  }
}

export class ProductModel {
  static prismaModelName = 'product';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.product.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new ProductDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.product.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new ProductDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.product.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new ProductDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.product.findMany({ where: query as any });
    return docs.map((doc: any) => new ProductDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any) {
    const doc = await prisma.product.findFirst({ where: query as any });
    if (!doc) return null;
    return new ProductDocument({ ...doc, _id: doc.id });
  }
  static async create(data: any) {
    const doc = new ProductDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.product.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.product.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('Product.aggregate not fully implemented for PostgreSQL Prisma');
    return [];
  }
  static async findOneAndUpdate(query: any, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const existing = await prisma.product.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.product.update({ where: { id: existing.id }, data: updateData as any });
    return new ProductDocument({ ...updated, _id: updated.id });
  }
}

type ProductModelType = typeof ProductModel & {
  new (data: any): ProductDocument;
  (data: any): ProductDocument;
};

const ProductFn = function(data: any) { return new ProductDocument(data); };
Object.setPrototypeOf(ProductFn, ProductModel);
export const Product = ProductFn as unknown as ProductModelType;
export default Product;

