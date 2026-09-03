import { describe, it, expect } from 'vitest';
import {
  orderCreateSchema,
  orderEditSchema,
  approvalSchema,
} from '@/modules/order/order.schema';

const validItem = {
  type: 'Service',
  item: 'svc-1',
  name: 'Xerox A4',
  quantity: 10,
  price: 2,
};

const validOrder = {
  shop: 'shop-1',
  orderType: 'XEROX_ORDER', // was 'Xerox order' — invalid enum
  department: 'dept-1',     // required
  branch: 'branch-1',       // required
  attachmentEmail: 'user@example.com',
  items: [validItem],
  sponsors: [],
};

describe('orderCreateSchema', () => {
  it('accepts a valid order', () => {
    expect(orderCreateSchema.safeParse(validOrder).success).toBe(true);
  });

  it('requires shop', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, shop: '' });
    expect(r.success).toBe(false);
  });

  it('requires department', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, department: '' });
    expect(r.success).toBe(false);
  });

  it('requires branch', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, branch: '' });
    expect(r.success).toBe(false);
  });

  it('requires valid orderType', () => {
    const r = orderCreateSchema.safeParse({
      ...validOrder,
      orderType: 'Invalid',
    });
    expect(r.success).toBe(false);
  });

  it('requires at least one item', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, items: [] });
    expect(r.success).toBe(false);
  });

  it('requires valid attachment email', () => {
    const r = orderCreateSchema.safeParse({
      ...validOrder,
      attachmentEmail: 'not-an-email',
    });
    expect(r.success).toBe(false);
  });

  it('accepts sponsors with name and amount', () => {
    const r = orderCreateSchema.safeParse({
      ...validOrder,
      sponsors: [{ name: 'CSR', amount: 100 }],
    });
    expect(r.success).toBe(true);
  });

  it('rejects sponsor with negative amount', () => {
    const r = orderCreateSchema.safeParse({
      ...validOrder,
      sponsors: [{ name: 'CSR', amount: -5 }],
    });
    expect(r.success).toBe(false);
  });
});

describe('orderEditSchema', () => {
  it('matches create schema shape', () => {
    expect(orderEditSchema.safeParse(validOrder).success).toBe(true);
  });
});

describe('approvalSchema', () => {
  it('accepts approved / rejected', () => {
    expect(approvalSchema.safeParse({ status: 'approved' }).success).toBe(true);
    expect(
      approvalSchema.safeParse({ status: 'rejected', remarks: 'No budget' })
        .success
    ).toBe(true);
  });

  it('rejects unknown status', () => {
    expect(approvalSchema.safeParse({ status: 'pending' }).success).toBe(false);
  });
});