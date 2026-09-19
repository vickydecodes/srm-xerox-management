import prisma from '@config/prisma.config.ts';
import { CounterModel } from './counter.model.ts';

export interface IShop {
  code: string;
  name: string;
  phone: string;
  email?: string;
  createdBy: string;
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ShopDocument {
  _id!: string;
  code!: string;
  name!: string;
  phone!: string;
  email?: string;
  createdBy!: string;
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
    
    if (this.active === undefined) this.active = true;
    if (this.deleted === undefined) this.deleted = false;
    if (!this.createdBy) this.createdBy = "system";
  }

  async runPreSaveHooks() {
    if (this.isNew && !this.code) {
      const counter = await CounterModel.findOneAndUpdate(
        { key: 'shop' },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
      );
      this.code = `SHOP-${String(counter!.value).padStart(3, '0')}`;
    }
  }

  async save() {
    await this.runPreSaveHooks();

    const payload = {
      code: this.code,
      name: this.name,
      phone: this.phone,
      email: this.email,
      active: this.active,
      deleted: this.deleted,
      deletedAt: this.deletedAt,
      createdBy: this.createdBy,
    };

    if (this.isNew) {
      const created = await prisma.shop.create({
        data: payload as any
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.shop.update({
        where: { id: this._id },
        data: payload as any
      });
    }
    return this;
  }
}

export class ShopModel {
  static prismaModelName = 'shop';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.shop.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new ShopDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.shop.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new ShopDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.shop.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new ShopDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.shop.findMany({ where: query as any });
    return docs.map((doc: any) => new ShopDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any) {
    const doc = await prisma.shop.findFirst({ where: query as any });
    if (!doc) return null;
    return new ShopDocument({ ...doc, _id: doc.id });
  }
  static async create(data: any) {
    const doc = new ShopDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.shop.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.shop.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('Shop.aggregate not fully implemented for PostgreSQL Prisma');
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
    const existing = await prisma.shop.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.shop.update({ where: { id: existing.id }, data: updateData as any });
    return new ShopDocument({ ...updated, _id: updated.id });
  }
}

type ShopModelType = typeof ShopModel & {
  new (data: any): ShopDocument;
  (data: any): ShopDocument;
};

const ShopFn = function(data: any) { return new ShopDocument(data); };
Object.setPrototypeOf(ShopFn, ShopModel);
export const Shop = ShopFn as unknown as ShopModelType;
export default Shop;