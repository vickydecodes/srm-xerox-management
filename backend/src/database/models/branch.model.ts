import prisma from '@config/prisma.config.js';

export interface IBranch {
  name: string;
  code: string;
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class BranchDocument {
  _id!: string;
  name!: string;
  code!: string;
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
  }

  async save() {
    if (this.isNew) {
      const created = await prisma.branch.create({
        data: {
          name: this.name,
          code: this.code,
          active: this.active !== undefined ? this.active : true,
          deleted: this.deleted !== undefined ? this.deleted : false,
        } as any // Need to update schema.prisma eventually to match all fields
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.branch.update({
        where: { id: this._id },
        data: {
          name: this.name,
          code: this.code,
          active: this.active,
          deleted: this.deleted,
          deletedAt: this.deletedAt,
        } as any
      });
    }
    return this;
  }
}

export class BranchModel {
  static prismaModelName = 'branch';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.branch.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new BranchDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.branch.update({
      where: { id: id.toString() },
      data: updateData
    });
    return new BranchDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.branch.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new BranchDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.branch.findMany({ where: query });
    return docs.map(doc => new BranchDocument({ ...doc, _id: doc.id }));
  }
  
  static async findOne(query: any) {
    const doc = await prisma.branch.findFirst({ where: query });
    if (!doc) return null;
    return new BranchDocument({ ...doc, _id: doc.id });
  }
  static async create(data: any) {
    const doc = new BranchDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.branch.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.branch.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('Branch.aggregate not fully implemented for PostgreSQL Prisma');
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
    const existing = await prisma.branch.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.branch.update({ where: { id: existing.id }, data: updateData as any });
    return new BranchDocument({ ...updated, _id: updated.id });
  }
}

type BranchModelType = typeof BranchModel & {
  new (data: any): BranchDocument;
  (data: any): BranchDocument;
};

const BranchFn = function(data: any) { return new BranchDocument(data); };
Object.setPrototypeOf(BranchFn, BranchModel);
export const Branch = BranchFn as unknown as BranchModelType;
export default Branch;

