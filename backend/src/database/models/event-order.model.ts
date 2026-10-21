import prisma from '@config/prisma.config.js';
import { CounterModel } from './counter.model.js';

export interface IEventOrder extends EventOrderDocument { }

export enum OrderItemType {
  PRODUCT = 'InventoryProduct',
  SERVICE = 'Service',
}

export interface IEventOrderItem {
  type: OrderItemType;
  item: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  size?: string;
  customSize?: string;
  customPriceAdded?: boolean;
  customWidth?: number;
  customHeight?: number;
  customUnit?: string;
  customRate?: number;
  attachment?: any;
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

export interface ISelfSupport {
  name: string;
  amount: number;
}

export interface IProof {
  proof: string;
  filename?: string;
  mimetype?: string;
  verified: boolean;
}

const toId = (val: any): string | undefined => {
  if (!val) return undefined;
  if (typeof val === 'object') return val.id || val._id || val.toString();
  return String(val);
};

export class EventOrderDocument {
  _id!: string;
  code?: string;

  department!: string;
  branch!: string;
  shop?: string;

  purpose?: string;
  eventName!: string;
  eventDate!: Date;
  approvedReferralNumber!: string;
  approvedDate!: Date;

  managementAmount?: number;
  self_supports!: ISelfSupport[];

  items!: IEventOrderItem[];
  proofs!: IProof[];

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

    this.self_supports = data.self_supports || data.sponsors || [];
    if (!this.items) this.items = [];
    if (!this.proofs) this.proofs = [];
    if (!this.branchAdminApproval) this.branchAdminApproval = { status: 'pending' };
    if (!this.superAdminApproval) this.superAdminApproval = { status: 'pending' };
    if (!this.approvalHistory) this.approvalHistory = [];
    if (!this.status) this.status = 'draft';
    if (this.deleted === undefined) this.deleted = false;
  }

  isModified(path: string) {
    return true;
  }

  async runPreSaveHooks() {
    // 1. Counter for code
    if (this.status !== 'draft' && !this.code) {
      const counter = await CounterModel.findOneAndUpdate(
        { key: 'event_order' },
        { $inc: { value: 1 } },
        { upsert: true, new: true }
      );
      this.code = `EVO-${String(counter!.value).padStart(4, '0')}`;
    }

    // 2. Item total calculation
    if (this.items) {
      for (const i of this.items) {
        i.total = i.quantity * i.price;
      }
    }

    // 3. Validation for funds
    if (
      this.status !== 'draft' &&
      !this.bill &&
      this.items &&
      this.items.length > 0
    ) {
      const totalCost = this.items.reduce((sum, i) => sum + i.total, 0);
      const totalSelfSupport = (this.self_supports || []).reduce((sum, s) => sum + s.amount, 0);
      const totalAvailable = (this.managementAmount ?? 0) + totalSelfSupport;

      if (totalCost > totalAvailable) {
        throw new Error(
          `Event order total (${totalCost}) exceeds available funds — management (${this.managementAmount ?? 0}) + self support (${totalSelfSupport})`
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

    const payload = {
      code: this.code,
      purpose: this.purpose,
      eventName: this.eventName,
      eventDate: this.eventDate,
      approvedReferralNumber: this.approvedReferralNumber,
      approvedDate: this.approvedDate,
      attachmentEmail: this.attachmentEmail,
      managementAmount: this.managementAmount,
      status: this.status,
      deleted: this.deleted,
      deletedAt: this.deletedAt,
      // References
      department: toId(this.department)!,
      branch: toId(this.branch)!,
      shop: toId(this.shop),
      createdBy: toId(this.createdBy)!,
      bill: toId(this.bill),
      // Complex json types
      self_supports: this.self_supports as any,
      items: this.items as any,
      proofs: this.proofs as any,
      branchAdminApproval: this.branchAdminApproval as any,
      superAdminApproval: this.superAdminApproval as any,
      approvalHistory: this.approvalHistory as any,
    };

    if (this.isNew) {
      const created = await (prisma as any).eventOrder.create({
        data: payload as any,
      });
      this._id = created.id;
      this.isNew = false;
    } else {
      await (prisma as any).eventOrder.update({
        where: { id: this._id },
        data: payload as any,
      });
    }
    return this;
  }
}

export class EventOrderModel {
  static prismaModelName = 'eventOrder';

  static async findById(id: string) {
    if (!id) return null;
    const doc = await (prisma as any).eventOrder.findUnique({
      where: { id: id.toString() },
    });
    if (!doc) return null;
    return new EventOrderDocument({ ...doc, _id: doc.id });
  }

  static async findByIdAndUpdate(id: string, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const updated = await (prisma as any).eventOrder.update({
      where: { id: id.toString() },
      data: updateData as any,
    });
    return new EventOrderDocument({ ...updated, _id: updated.id });
  }

  static async findByIdAndDelete(id: string) {
    let deleted;
    try {
      deleted = await (prisma as any).eventOrder.delete({
        where: { id: id.toString() },
      });
    } catch (e) {
      return null;
    }
    return new EventOrderDocument({ ...deleted, _id: deleted.id });
  }

  static async find(query: any) {
    const docs = await (prisma as any).eventOrder.findMany({
      where: query as any,
    });
    return docs.map((doc: any) => new EventOrderDocument({ ...doc, _id: doc.id }));
  }

  static async findOne(query: any) {
    const doc = await (prisma as any).eventOrder.findFirst({
      where: query as any,
    });
    if (!doc) return null;
    return new EventOrderDocument({ ...doc, _id: doc.id });
  }

  static async create(data: any) {
    const doc = new EventOrderDocument(data);
    return await doc.save();
  }

  static async deleteMany(query: any) {
    return await (prisma as any).eventOrder.deleteMany({
      where: query as any,
    });
  }

  static async countDocuments(query: any) {
    return await (prisma as any).eventOrder.count({
      where: query as any,
    });
  }

  static async findOneAndUpdate(query: any, data: any, options: any = {}) {
    let updateData: any = data.$set ? { ...data.$set } : { ...data };
    if (data.$inc) {
      for (const [key, val] of Object.entries(data.$inc)) {
        updateData[key] = { increment: val };
      }
      delete updateData.$inc;
    }
    const existing = await (prisma as any).eventOrder.findFirst({
      where: query as any,
    });
    if (!existing) return null;
    const updated = await (prisma as any).eventOrder.update({
      where: { id: existing.id },
      data: updateData as any,
    });
    return new EventOrderDocument({ ...updated, _id: updated.id });
  }
}

type EventOrderModelType = typeof EventOrderModel & {
  new(data: any): EventOrderDocument;
  (data: any): EventOrderDocument;
};

const EventOrderFn = function (data: any) {
  return new EventOrderDocument(data);
};
Object.setPrototypeOf(EventOrderFn, EventOrderModel);
export const EventOrder = EventOrderFn as unknown as EventOrderModelType;
export default EventOrder;
