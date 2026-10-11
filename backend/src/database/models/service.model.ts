import prisma from '@config/prisma.config.js';
import { CounterModel } from './counter.model.js';

export interface IServiceMaterial {
  product: string;
  quantity: number;
}

export interface IServiceSize {
  size: string;
  price: number;
}

export interface IService {
  code: string;
  name: string;
  description?: string;
  unit: string;
  price: number;
  materials: IServiceMaterial[];
  isWorkOrder: boolean;
  isCustomSize: boolean;
  sizes: (IServiceSize | string)[];
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ServiceDocument {
  _id!: string;
  code!: string;
  name!: string;
  description?: string;
  unit!: string;
  price!: number;
  materials!: IServiceMaterial[];
  isWorkOrder: boolean = false;
  isCustomSize: boolean = false;
  sizes: IServiceSize[] = [];
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
    
    if (this.isWorkOrder === undefined) this.isWorkOrder = false;
    if (this.isCustomSize === undefined) this.isCustomSize = false;
    if (!this.sizes) {
      this.sizes = [];
    } else if (Array.isArray(this.sizes)) {
      this.sizes = this.sizes.map((s: any) => {
        if (typeof s === 'string') {
          return { size: s, price: Number(this.price) || 0 };
        }
        return {
          size: String(s?.size || ''),
          price: Number(s?.price) || 0,
        };
      });
    }
    if (this.active === undefined) this.active = true;
    if (this.deleted === undefined) this.deleted = false;
    if (!this.materials) this.materials = [];
  }

  async runPreSaveHooks() {
    if (this.isNew && !this.code) {
      const counter = await CounterModel.findOneAndUpdate(
        { key: 'service' },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
      );
      this.code = `S-${String(counter!.value).padStart(3, '0')}`;
    }
  }

  async save() {
    await this.runPreSaveHooks();

    const normalizedSizes = (this.sizes || []).map((s: any) => {
      if (typeof s === 'string') {
        return { size: s, price: Number(this.price) || 0 };
      }
      return {
        size: String(s?.size || ''),
        price: Number(s?.price) || 0,
      };
    });

    if (normalizedSizes.length > 0 && (!this.price || this.price === 0)) {
      this.price = normalizedSizes[0].price;
    }

    const payload = {
      code: this.code,
      name: this.name,
      description: this.description,
      unit: this.unit,
      price: Number(this.price) || 0,
      materials: this.materials as any,
      isWorkOrder: this.isWorkOrder ?? false,
      isCustomSize: this.isCustomSize ?? false,
      sizes: normalizedSizes as any,
      active: this.active,
      deleted: this.deleted,
      deletedAt: this.deletedAt,
    };

    if (this.isNew) {
      const created = await prisma.service.create({
        data: payload as any
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.service.update({
        where: { id: this._id },
        data: payload as any
      });
    }
    return this;
  }
}

export class ServiceModel {
  static prismaModelName = 'service';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.service.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new ServiceDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    delete updateData.hasMultipleSizes;
    delete updateData._id;
    if (updateData.sizes && Array.isArray(updateData.sizes)) {
      updateData.sizes = updateData.sizes.map((s: any) => {
        if (typeof s === 'string') {
          return { size: s, price: Number(updateData.price) || 0 };
        }
        return {
          size: String(s?.size || ''),
          price: Number(s?.price) || 0,
        };
      });
      if (updateData.sizes.length > 0 && (!updateData.price || updateData.price === 0)) {
        updateData.price = updateData.sizes[0].price;
      }
    }
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.service.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new ServiceDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.service.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new ServiceDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.service.findMany({ where: query as any });
    return docs.map((doc: any) => new ServiceDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any) {
    const doc = await prisma.service.findFirst({ where: query as any });
    if (!doc) return null;
    return new ServiceDocument({ ...doc, _id: doc.id });
  }
  static async create(data: any) {
    const doc = new ServiceDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.service.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.service.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('Service.aggregate not fully implemented for PostgreSQL Prisma');
    return [];
  }
  static async findOneAndUpdate(query: any, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    delete updateData.hasMultipleSizes;
    delete updateData._id;
    if (updateData.sizes && Array.isArray(updateData.sizes)) {
      updateData.sizes = updateData.sizes.map((s: any) => {
        if (typeof s === 'string') {
          return { size: s, price: Number(updateData.price) || 0 };
        }
        return {
          size: String(s?.size || ''),
          price: Number(s?.price) || 0,
        };
      });
      if (updateData.sizes.length > 0 && (!updateData.price || updateData.price === 0)) {
        updateData.price = updateData.sizes[0].price;
      }
    }
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const existing = await prisma.service.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.service.update({ where: { id: existing.id }, data: updateData as any });
    return new ServiceDocument({ ...updated, _id: updated.id });
  }
}

type ServiceModelType = typeof ServiceModel & {
  new (data: any): ServiceDocument;
  (data: any): ServiceDocument;
};

const ServiceFn = function(data: any) { return new ServiceDocument(data); };
Object.setPrototypeOf(ServiceFn, ServiceModel);
export const Service = ServiceFn as unknown as ServiceModelType;
export default Service;

