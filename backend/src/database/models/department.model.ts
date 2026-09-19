import prisma from '@config/prisma.config.js';

export interface IDepartment {
  name: string;
  code: string;
  branch: string;
  outstandingCredit: number;
  creditBalance: number;
  active: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class DepartmentDocument {
  _id!: string;
  name!: string;
  code!: string;
  branch!: string;
  outstandingCredit!: number;
  creditBalance!: number;
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
      const created = await prisma.department.create({
        data: {
          name: this.name,
          code: this.code,
          active: this.active !== undefined ? this.active : true,
          deleted: this.deleted !== undefined ? this.deleted : false,
          outstandingCredit: this.outstandingCredit || 0,
          creditBalance: this.creditBalance || 0,
          // branch relation (will need to be added to schema.prisma)
        } as any
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.department.update({
        where: { id: this._id },
        data: {
          name: this.name,
          code: this.code,
          active: this.active,
          deleted: this.deleted,
          deletedAt: this.deletedAt,
          outstandingCredit: this.outstandingCredit,
          creditBalance: this.creditBalance,
        } as any
      });
    }
    return this;
  }
}

export class DepartmentModel {
  static prismaModelName = 'department';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.department.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new DepartmentDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.department.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new DepartmentDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.department.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new DepartmentDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.department.findMany({ where: query as any });
    return docs.map(doc => new DepartmentDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any) {
    const doc = await prisma.department.findFirst({ where: query as any });
    if (!doc) return null;
    return new DepartmentDocument({ ...doc, _id: doc.id });
  }
  static async create(data: any) {
    const doc = new DepartmentDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.department.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.department.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('Department.aggregate not fully implemented for PostgreSQL Prisma');
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
    const existing = await prisma.department.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.department.update({ where: { id: existing.id }, data: updateData as any });
    return new DepartmentDocument({ ...updated, _id: updated.id });
  }
}

type DepartmentModelType = typeof DepartmentModel & {
  new (data: any): DepartmentDocument;
  (data: any): DepartmentDocument;
};

const DepartmentFn = function(data: any) { return new DepartmentDocument(data); };
Object.setPrototypeOf(DepartmentFn, DepartmentModel);
export const Department = DepartmentFn as unknown as DepartmentModelType;
export default Department;

