// modules/bill/bill.types.ts
import { Types } from 'mongoose';
import { BillItemType } from '@db/models/bill.model.ts';

export interface CreateBillItemPayload {
  type: BillItemType;
  item: Types.ObjectId | string;
  name: string;
  quantity: number;
  price: number;
}

export interface CreateBillPayload {
  items: CreateBillItemPayload[];
  discount?: number;
  tax?: number;
  paymentMethod: 'CASH' | 'UPI' | 'CREDIT';
  branch?: string;
  department?: string;
}

export interface UpdateBillPayload {
  items?: CreateBillItemPayload[];
  discount?: number;
  tax?: number;
  paymentMethod?: 'CASH' | 'UPI' | 'CREDIT';
  branch?: string;
  department?: string;
  status?: 'UNPAID' | 'PAID' | 'CANCELLED';
}
