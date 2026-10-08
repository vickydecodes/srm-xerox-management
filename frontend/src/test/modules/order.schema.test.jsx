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
  proofFiles: [{ name: 'proof.pdf' }],
};

describe('orderCreateSchema', () => {
  it('accepts a valid order', () => {
    expect(orderCreateSchema.safeParse(validOrder).success).toBe(true);
  });

  it('requires shop', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, shop: '' });
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

  it('requires at least one proof document', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, proofFiles: [] });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe(
        'At least one proof document (Image or PDF) is required'
      );
    }
  });

  it('rejects order create when proofFiles is omitted', () => {
    const { proofFiles: _, ...withoutProofs } = validOrder;
    const r = orderCreateSchema.safeParse(withoutProofs);
    expect(r.success).toBe(false);
  });
});

describe('orderEditSchema', () => {
  it('accepts valid order with proof files', () => {
    expect(orderEditSchema.safeParse(validOrder).success).toBe(true);
  });

  it('accepts valid order without proof files (for existing orders)', () => {
    const { proofFiles: _, ...withoutProofs } = validOrder;
    expect(orderEditSchema.safeParse(withoutProofs).success).toBe(true);
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

  it('accepts optional verifyProofs flag for signature & proof verification', () => {
    const result = approvalSchema.safeParse({
      status: 'approved',
      remarks: 'Verified proofs',
      verifyProofs: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.verifyProofs).toBe(true);
    }
  });

  it('rejects unknown status', () => {
    expect(approvalSchema.safeParse({ status: 'pending' }).success).toBe(false);
  });
});