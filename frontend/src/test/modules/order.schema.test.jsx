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

  it('accepts order items with multi-size pricing objects', () => {
    const orderWithSizedItems = {
      ...validOrder,
      items: [
        {
          ...validItem,
          size: 'A3',
          price: 25,
          sizes: [
            { size: 'A4', price: 10 },
            { size: 'A3', price: 25 },
          ],
        },
      ],
    };
    expect(orderCreateSchema.safeParse(orderWithSizedItems).success).toBe(true);
  });

  it('accepts order items with custom size, customSize string, and customPriceAdded flag', () => {
    const orderWithCustomSize = {
      ...validOrder,
      items: [
        {
          ...validItem,
          size: 'Custom',
          customSize: '12x4 ft Banner',
          price: 0,
          customPriceAdded: false,
        },
      ],
    };
    expect(orderCreateSchema.safeParse(orderWithCustomSize).success).toBe(true);
  });

  it('accepts order items with custom dimension attributes (width, height, unit, rate)', () => {
    const orderWithDimensions = {
      ...validOrder,
      items: [
        {
          ...validItem,
          size: 'Custom',
          customWidth: 10,
          customHeight: 4,
          customUnit: 'ft',
          customRate: 15,
          customSize: '10x4 ft (40 sq ft @ ₹15/sq ft)',
          price: 600,
          customPriceAdded: true,
        },
      ],
    };
    const parsed = orderCreateSchema.safeParse(orderWithDimensions);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items[0].customWidth).toBe(10);
      expect(parsed.data.items[0].customHeight).toBe(4);
      expect(parsed.data.items[0].customUnit).toBe('ft');
      expect(parsed.data.items[0].customRate).toBe(15);
      expect(parsed.data.items[0].price).toBe(600);
    }
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