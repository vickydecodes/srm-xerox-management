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
}

export interface UpdateBillPayload {
  items?: CreateBillItemPayload[];
  discount?: number;
  tax?: number;
  status?: 'UNPAID' | 'PAID' | 'CANCELLED';
}
