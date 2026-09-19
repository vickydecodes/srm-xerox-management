import prisma from '@config/prisma.config.js';

export enum BillItemType {
  PRODUCT = 'InventoryProduct',
  SERVICE = 'Service',
}

export interface IBillItem {
  type: string;
  item: string;
  name: string;
  quantity: number;
  price: number;
  total?: number;
}

export class BillDocument {
  _id!: string;
  code!: string;
  items!: IBillItem[];
  subtotal!: number;
  discount!: number;
  tax!: number;
  total!: number;
  paymentMethod!: string;
  branch?: string;
  department?: string;
  order?: string;
  status!: string;
  approvalStatus!: string;
  approvedBy?: string;
  approvedAt?: Date;
  remarks?: string;
  createdBy!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deleted!: boolean;
  deletedAt?: Date;

  isNew: boolean = false;

  constructor(data: any) {
    Object.assign(this, data);
    this._id = data._id || data.id;
    if (!this._id) {
      this.isNew = true;
    }
  }

  async save() {
    // Emulate pre-save hooks
    if (this.isNew) {
      const counter = await prisma.counter.upsert({
        where: { key: 'bill' },
        update: { value: { increment: 1 } },
        create: { key: 'bill', value: 1 }
      });
      this.code = `B-${String(counter.value).padStart(3, '0')}`;
    }

    if (this.items) {
      this.items = this.items.map((item) => ({
        ...item,
        total: item.quantity * item.price,
      }));
      this.subtotal = this.items.reduce((sum, item) => sum + (item.total || 0), 0);
      this.total = this.subtotal - (this.discount || 0) + (this.tax || 0);
    }

    if (this.isNew) {
      const created = await prisma.bill.create({
        data: {
          code: this.code,
          subtotal: this.subtotal,
          discount: this.discount || 0,
          tax: this.tax || 0,
          total: this.total,
          paymentMethod: this.paymentMethod,
          status: this.status || 'UNPAID',
          approvalStatus: this.approvalStatus || 'approved',
          remarks: this.remarks,
          branch: this.branch || null,
          department: this.department || null,
          order: this.order || null,
          createdBy: this.createdBy,
          items: {
            create: (this.items || []).map(i => ({
              type: i.type,
              item: i.item.toString(),
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              total: i.total || 0
            }))
          }
        },
        include: { items: true }
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      let itemsUpdate = {};
      if (this.items) {
        itemsUpdate = {
          items: {
            deleteMany: {},
            create: this.items.map(i => ({
              type: i.type,
              item: i.item.toString(),
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              total: i.total || 0
            }))
          }
        };
      }

      await prisma.bill.update({
        where: { id: this._id },
        data: {
          subtotal: this.subtotal,
          discount: this.discount,
          tax: this.tax,
          total: this.total,
          paymentMethod: this.paymentMethod,
          status: this.status,
          approvalStatus: this.approvalStatus,
          approvedBy: this.approvedBy,
          approvedAt: this.approvedAt,
          remarks: this.remarks,
          deleted: this.deleted,
          deletedAt: this.deletedAt,
          ...itemsUpdate
        }
      });
    }
    return this;
  }
}

export class BillModel {
  static prismaModelName = 'bill';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.bill.findUnique({
      where: { id: id.toString() },
      include: { items: true, branchObj: true, departmentObj: true, orderObj: true, createdByObj: true }
    });
    if (!doc) return null;
    
    // Map items to match Mongoose output
    const mappedDoc = {
      ...doc,
      _id: doc.id,
      branch: doc.branchObj,
      department: doc.departmentObj,
      order: doc.orderObj,
      createdBy: doc.createdByObj,
      items: doc.items.map((i: any) => ({ ...i, item: i.item }))
    };
    return new BillDocument(mappedDoc);
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    if (data.$inc) {
       // handle Mongoose $inc if needed, though Bill doesn't use it directly here
    }
    
    // Convert Mongoose $set to flat object if used
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    
    let itemsUpdate = {};
    if (updateData.items) {
      itemsUpdate = {
        items: {
          deleteMany: {},
          create: updateData.items.map((i: any) => ({
            type: i.type,
            item: i.item.toString(),
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            total: i.quantity * i.price
          }))
        }
      };
      delete updateData.items;
    }

    const updated = await prisma.bill.update({
      where: { id: id.toString() },
      data: { ...updateData, ...itemsUpdate },
      include: { items: true }
    });

    const mappedDoc = {
      ...updated,
      _id: updated.id,
      items: updated.items.map((i: any) => ({ ...i, item: i.item }))
    };
    return new BillDocument(mappedDoc);
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.bill.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    const mappedDoc = {
      ...deleted,
      _id: deleted.id,
      items: ((deleted as any).items || []).map((i: any) => ({ ...i, item: i.item }))
    };
    return new BillDocument(mappedDoc);
  }

  static async find(query: any) {
    const docs = await prisma.bill.findMany({
      where: query as any,
      include: { items: true, branchObj: true, departmentObj: true, orderObj: true, createdByObj: true }
    });
    return docs.map((doc: any) => new BillDocument({
      ...doc,
      _id: doc.id,
      branch: doc.branchObj,
      department: doc.departmentObj,
      order: doc.orderObj,
      createdBy: doc.createdByObj,
      items: doc.items.map((i: any) => ({ ...i, item: i.item }))
    }));
  }
  static async create(data: any) {
    const doc = new BillDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.bill.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.bill.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('Bill.aggregate not fully implemented for PostgreSQL Prisma');
    return [];
  }
  static async findOne(query: any) {
    const doc = await prisma.bill.findFirst({ where: query as any });
    if (!doc) return null;
    return new BillDocument({ ...doc, _id: doc.id });
  }
  static async findOneAndUpdate(query: any, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const existing = await prisma.bill.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.bill.update({ where: { id: existing.id }, data: updateData as any });
    return new BillDocument({ ...updated, _id: updated.id });
  }
}

type BillModelType = typeof BillModel & {
  new (data: any): BillDocument;
  (data: any): BillDocument;
};

const BillFn = function(data: any) { return new BillDocument(data); };
Object.setPrototypeOf(BillFn, BillModel);
export const Bill = BillFn as unknown as BillModelType;
export default Bill;
Object.assign(Bill, BillModel);

