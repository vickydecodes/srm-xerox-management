import prisma from '@config/prisma.config.js';

export interface IInventory {
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryDocument {
  _id!: string;
  name!: string;
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
    
    if (this.active === undefined) this.active = true;
  }

  async save() {
    const payload = {
      name: this.name,
      active: this.active,
    };

    if (this.isNew) {
      const created = await prisma.inventory.create({
        data: payload as any
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.inventory.update({
        where: { id: this._id },
        data: payload as any
      });
    }
    return this;
  }
}

export class InventoryModel {
  static prismaModelName = 'inventory';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.inventory.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new InventoryDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.inventory.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new InventoryDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.inventory.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new InventoryDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.inventory.findMany({ where: query as any });
    return docs.map((doc: any) => new InventoryDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any) {
    const doc = await prisma.inventory.findFirst({ where: query as any });
    if (!doc) return null;
    return new InventoryDocument({ ...doc, _id: doc.id });
  }
  static async create(data: any) {
    const doc = new InventoryDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.inventory.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.inventory.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('Inventory.aggregate not fully implemented for PostgreSQL Prisma');
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
    const existing = await prisma.inventory.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.inventory.update({ where: { id: existing.id }, data: updateData as any });
    return new InventoryDocument({ ...updated, _id: updated.id });
  }
}

type InventoryModelType = typeof InventoryModel & {
  new (data: any): InventoryDocument;
  (data: any): InventoryDocument;
};

const InventoryFn = function(data: any) { return new InventoryDocument(data); };
Object.setPrototypeOf(InventoryFn, InventoryModel);
export const Inventory = InventoryFn as unknown as InventoryModelType;
export default Inventory;

