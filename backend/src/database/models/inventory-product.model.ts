import prisma from '@config/prisma.config.js';
import Product from './product.model.js';

export interface IInventoryProduct {
  inventory: string;
  product: string;
  variant?: string;
  quantity: number;
  price: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryProductDocument {
  _id!: string;
  inventory!: string;
  product!: string;
  variant?: string;
  quantity!: number;
  price!: number;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  isNew: boolean = false;

  constructor(data: any) {
    Object.assign(this, data);
    this._id = data._id || data.id;
    if (!this._id) {
      this.isNew = true;
    }
    
    // defaults
    if (this.quantity === undefined) this.quantity = 0;
    if (this.active === undefined) this.active = true;
  }

  async save() {
    if (this.product || this.variant) {
      if (this.variant) {
        // Validation for variant existing in product
        const prod = await Product.findById(this.product);
        if (prod) {
          const variantExists = prod.variants?.some((v: any) => v._id === this.variant);
          if (!variantExists) {
            throw new Error(`Variant ${this.variant} does not exist for product ${this.product}`);
          }
        }
      }
    }

    const payload = {
      inventory: this.inventory,
      product: this.product,
      variant: this.variant,
      quantity: this.quantity,
      price: this.price,
      active: this.active,
    };

    if (this.isNew) {
      const created = await prisma.inventoryProduct.create({
        data: payload as any
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.inventoryProduct.update({
        where: { id: this._id },
        data: payload as any
      });
    }
    return this;
  }
}

export class InventoryProductModel {
  static prismaModelName = 'inventoryProduct';

  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.inventoryProduct.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new InventoryProductDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.inventoryProduct.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new InventoryProductDocument({ ...updated, _id: updated.id });
  }

  static async findOneAndUpdate(query: any, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }

    const existing = await prisma.inventoryProduct.findFirst({ where: query as any });
    if (!existing) return null;
    
    const updated = await prisma.inventoryProduct.update({
      where: { id: existing.id },
      data: updateData as any
    });
    return new InventoryProductDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.inventoryProduct.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new InventoryProductDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.inventoryProduct.findMany({ where: query as any });
    return docs.map((doc: any) => new InventoryProductDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any = {}) {
    const doc = await prisma.inventoryProduct.findFirst({ where: query as any });
    if (!doc) return null;
    return new InventoryProductDocument({ ...doc, _id: doc.id });
  }

  static async create(data: any) {
    const doc = new InventoryProductDocument(data);
    return await doc.save();
  }

  static async deleteMany(query: any) {
    return await prisma.inventoryProduct.deleteMany({ where: query as any });
  }

  static async countDocuments(query: any) {
    return await prisma.inventoryProduct.count({ where: query as any });
  }

  static async aggregate(pipeline: any[]): Promise<any[]> {
    return [];
  }
}

type InventoryProductModelType = typeof InventoryProductModel & {
  new (data: any): InventoryProductDocument;
  (data: any): InventoryProductDocument;
};

const InventoryProductFn = function(data: any) { return new InventoryProductDocument(data); };
Object.setPrototypeOf(InventoryProductFn, InventoryProductModel);
export const InventoryProduct = InventoryProductFn as unknown as InventoryProductModelType;
export default InventoryProduct;