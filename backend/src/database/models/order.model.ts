import mongoose, { Schema, Document, Types } from 'mongoose';
import { Counter } from './counter.model.ts';

export enum OrderItemType {
  PRODUCT = 'InventoryProduct',
  SERVICE = 'Service',
}

export interface IOrderItem {
  type: OrderItemType;
  item: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    type: { type: String, enum: Object.values(OrderItemType), required: true },
    item: { type: Schema.Types.ObjectId, required: true, refPath: 'items.type' },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, min: 0 },
  },
  { _id: false }
);

export interface IApproval {
  status: 'pending' | 'approved' | 'rejected';
  approver?: Types.ObjectId;
  date?: Date;
  remarks?: string;
}

const ApprovalSchema = new Schema<IApproval>(
  {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approver: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

export interface IApprovalHistory {
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approver: Types.ObjectId;
  date: Date;
  remarks?: string;
}

const ApprovalHistorySchema = new Schema<IApprovalHistory>(
  {
    status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], required: true },
    approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

export interface ISponsor {
  name: string;
  amount: number;
}

const SponsorSchema = new Schema<ISponsor>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

export interface IOrder extends Document {
  code?: string;

  department: Types.ObjectId;
  branch: Types.ObjectId;

  purpose?: string;

  managementAmount?: number;
  sponsors: ISponsor[];

  items: IOrderItem[];

  branchAdminApproval: IApproval;
  superAdminApproval: IApproval;
  approvalHistory: IApprovalHistory[];

  status:
  | 'draft'
  | 'pending'
  | 'in_progress'
  | 'ready_for_pickup'
  | 'delivered'
  | 'rejected';

  bill?: Types.ObjectId;

  deleted: boolean;
  deletedAt?: Date;

  createdBy: Types.ObjectId;

  attachmentEmail?: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    code: { type: String, unique: true, sparse: true },

    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },

    purpose: { type: String, trim: true },
    attachmentEmail: { type: String, trim: true },

    managementAmount: { type: Number, min: 0 },
    sponsors: { type: [SponsorSchema], default: [] },

    items: { type: [OrderItemSchema], default: [] },

    branchAdminApproval: { type: ApprovalSchema, default: () => ({}) },
    superAdminApproval: { type: ApprovalSchema, default: () => ({}) },
    approvalHistory: { type: [ApprovalHistorySchema], default: [] },

    status: {
  type: String,
  enum: [
    'draft',
    'pending',
    'in_progress',
    'ready_for_pickup',
    'delivered',
    'rejected',
  ],
  default: 'draft',
},

    bill: { type: Schema.Types.ObjectId, ref: 'Bill' },

    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

OrderSchema.pre('save', async function () {
  if (this.status === 'draft' || this.code) return;

  const counter = await Counter.findOneAndUpdate(
    { key: 'order' },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );
  this.code = `ORD-${String(counter!.value).padStart(4, '0')}`;
});

OrderSchema.pre('save', function () {
  for (const i of this.items) i.total = i.quantity * i.price;
});

OrderSchema.pre('save', function () {
  if (this.status === 'draft' || !this.items.length) return;

  const totalCost = this.items.reduce((sum, i) => sum + i.total, 0);
  const totalSponsorship = this.sponsors.reduce((sum, s) => sum + s.amount, 0);
  const totalAvailable = (this.managementAmount ?? 0) + totalSponsorship;

  if (totalCost > totalAvailable) {
    throw new Error(
      `Order total (${totalCost}) exceeds available funds — management (${this.managementAmount ?? 0}) + sponsorship (${totalSponsorship})`
    );
  }
});

OrderSchema.pre('save', function () {
  if (this.status === 'draft') return;

  if (this.isModified('branchAdminApproval') || this.isModified('superAdminApproval')) {
    if (this.branchAdminApproval.status === 'pending' && this.superAdminApproval.status !== 'pending') {
      throw new Error('superAdminApproval cannot be resolved before branchAdminApproval');
    }

    if (this.branchAdminApproval.status === 'rejected' || this.superAdminApproval.status === 'rejected') {
      this.status = 'rejected';
    } else if (this.branchAdminApproval.status === 'approved') {
      this.status = 'in_progress';
    }
  }
});


export default mongoose.model<IOrder>('Order', OrderSchema);
