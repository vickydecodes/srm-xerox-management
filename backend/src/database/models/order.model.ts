import prisma from '@config/prisma.config.js';
import { CounterModel } from './counter.model.js';

export interface IOrder extends OrderDocument {}

export enum OrderItemType {
  PRODUCT = 'InventoryProduct',
  SERVICE = 'Service',
}

export enum OrderType {
  WORK_ORDER = 'WORK_ORDER',
  XEROX_ORDER = 'XEROX_ORDER',
}

export interface IOrderItem {
  type: OrderItemType;
  item: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IApproval {
  status: 'pending' | 'approved' | 'rejected';
  approver?: string;
  date?: Date;
  remarks?: string;
}

export interface IApprovalHistory {
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approver: string;
  date: Date;
  remarks?: string;
}

export interface ISponsor {
  name: string;
  amount: number;
}

export class OrderDocument {
  _id!: string;
  code?: string;
  orderType!: OrderType;

  department!: string;
  branch!: string;
  shop?: string;

  purpose?: string;

  managementAmount?: number;
  sponsors!: ISponsor[];

  items!: IOrderItem[];

  branchAdminApproval!: IApproval;
  superAdminApproval!: IApproval;
  approvalHistory!: IApprovalHistory[];

  status!:
    | 'draft'
    | 'pending'
    | 'in_progress'
    | 'ready_for_pickup'
    | 'delivered'
    | 'rejected';

  bill?: string;

  deleted!: boolean;
  deletedAt?: Date;

  createdBy!: string;

  attachmentEmail?: string;

  createdAt!: Date;
  updatedAt!: Date;

  isNew: boolean = false;

  constructor(data: any) {
    Object.assign(this, data);
    this._id = data._id || data.id;
    if (!this._id) {
      this.isNew = true;
    }
    
    // Default initializations to replicate Mongoose behavior
    if (!this.sponsors) this.sponsors = [];
    if (!this.items) this.items = [];
    if (!this.branchAdminApproval) this.branchAdminApproval = { status: 'pending' };
    if (!this.superAdminApproval) this.superAdminApproval = { status: 'pending' };
    if (!this.approvalHistory) this.approvalHistory = [];
    if (!this.status) this.status = 'draft';
    if (this.deleted === undefined) this.deleted = false;
  }

  // Helper to replicate isModified behavior roughly
  isModified(path: string) {
    // A proper implementation would track original states.
    // For now, assume it is modified if we are saving.
    return true;
  }

  async runPreSaveHooks() {
    // 1. Counter for code
    if (this.status !== 'draft' && !this.code) {
      const counter = await CounterModel.findOneAndUpdate(
        { key: 'order' },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
      );
      this.code = `ORD-${String(counter!.value).padStart(4, '0')}`;
    }

    // 2. Item total calculation
    if (this.items) {
      for (const i of this.items) {
        i.total = i.quantity * i.price;
      }
    }

    // 3. Validation for funds
    if (this.status !== 'draft' && this.items && this.items.length > 0) {
      const totalCost = this.items.reduce((sum, i) => sum + i.total, 0);
      const totalSponsorship = this.sponsors.reduce((sum, s) => sum + s.amount, 0);
      const totalAvailable = (this.managementAmount ?? 0) + totalSponsorship;
    
      if (totalCost > totalAvailable) {
        throw new Error(
          `Order total (${totalCost}) exceeds available funds — management (${this.managementAmount ?? 0}) + sponsorship (${totalSponsorship})`
        );
      }
    }

    // 4. Approval logic
    if (this.status !== 'draft') {
      if (this.branchAdminApproval.status === 'pending' && this.superAdminApproval.status !== 'pending') {
        throw new Error('superAdminApproval cannot be resolved before branchAdminApproval');
      }

      if (this.branchAdminApproval.status === 'rejected' || this.superAdminApproval.status === 'rejected') {
        this.status = 'rejected';
      } else if (this.branchAdminApproval.status === 'approved' && this.status === 'pending') {
        this.status = 'in_progress';
      }
    }
  }

  async save() {
    await this.runPreSaveHooks();

    // Map Prisma-friendly data
    const payload = {
      code: this.code,
      orderType: this.orderType,
      purpose: this.purpose,
      attachmentEmail: this.attachmentEmail,
      managementAmount: this.managementAmount,
      status: this.status,
      deleted: this.deleted,
      deletedAt: this.deletedAt,
      // References
      department: this.department,
      branch: this.branch,
      shop: this.shop,
      createdBy: this.createdBy,
      bill: this.bill,
      // Complex json types
      sponsors: this.sponsors as any,
      items: this.items as any,
      branchAdminApproval: this.branchAdminApproval as any,
      superAdminApproval: this.superAdminApproval as any,
      approvalHistory: this.approvalHistory as any,
    };

    if (this.isNew) {
      const created = await prisma.order.create({
        data: payload as any
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await prisma.order.update({
        where: { id: this._id },
        data: payload as any
      });
    }
    return this;
  }
}

export class OrderModel {
  static prismaModelName = 'order';
  static async findById(id: string) {
    if (!id) return null;
    const doc = await prisma.order.findUnique({
      where: { id: id.toString() }
    });
    if (!doc) return null;
    return new OrderDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await prisma.order.update({
      where: { id: id.toString() },
      data: updateData as any
    });
    return new OrderDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted; try { deleted = await prisma.order.delete({ where: { id: id.toString() } }); } catch (e) { return null; }
    return new OrderDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await prisma.order.findMany({ where: query as any });
    return docs.map((doc: any) => new OrderDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any) {
    const doc = await prisma.order.findFirst({ where: query as any });
    if (!doc) return null;
    return new OrderDocument({ ...doc, _id: doc.id });
  }
  static async create(data: any) {
    const doc = new OrderDocument(data);
    return await doc.save();
  }
  static async deleteMany(query: any) {
    return await prisma.order.deleteMany({ where: query as any });
  }
  static async countDocuments(query: any) {
    return await prisma.order.count({ where: query as any });
  }
  static async aggregate(pipeline: any[]): Promise<any[]> {
    console.warn('Order.aggregate not fully implemented for PostgreSQL Prisma');
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
    const existing = await prisma.order.findFirst({ where: query as any });
    if (!existing) return null;
    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: updateData as any
    });
    return new OrderDocument({ ...updated, _id: updated.id });
  }
}

type OrderModelType = typeof OrderModel & {
  new (data: any): OrderDocument;
  (data: any): OrderDocument;
};

const OrderFn = function(data: any) { return new OrderDocument(data); };
Object.setPrototypeOf(OrderFn, OrderModel);
export const Order = OrderFn as unknown as OrderModelType;
export default Order;
