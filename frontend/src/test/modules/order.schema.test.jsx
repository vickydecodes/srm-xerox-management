import { describe, it, expect } from 'vitest';
import {
  orderCreateSchema,
  orderEditSchema,
  approvalSchema,
} from '@/modules/order/order.schema';

const futureEventDate = new Date(Date.now() + 100 * 60 * 60 * 1000).toISOString().slice(0, 10);
const pastEventDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // less than 72h

const validItem = {
  type: 'Service',
  item: 'svc-1',
  name: 'Xerox A4',
  quantity: 10,
  price: 2,
};

const validOrder = {
  orderType: 'XEROX_ORDER',
  fundingMethod: 'management',
  managementAmount: 100,
  department: 'dept-1',
  branch: 'branch-1',
  eventName: 'SRM Tech Fest',
  eventDate: futureEventDate,
  approvedReferralNumber: 'REF-2026-001',
  approvedDate: '2026-10-15',
  purpose: 'Print banners and certificates for event',
  attachmentEmail: 'user@example.com',
  items: [validItem],
  self_supports: [],
  proofFiles: [{ name: 'proof.pdf' }],
};

describe('orderCreateSchema', () => {
  it('accepts a valid order', () => {
    expect(orderCreateSchema.safeParse(validOrder).success).toBe(true);
  });

  it('allows shop to be omitted (shop selection removed)', () => {
    const { shop: _, ...orderWithoutShop } = validOrder;
    expect(orderCreateSchema.safeParse(orderWithoutShop).success).toBe(true);
  });

  it('requires eventName', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, eventName: '' });
    expect(r.success).toBe(false);
  });

  it('requires eventDate', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, eventDate: '' });
    expect(r.success).toBe(false);
  });

  it('rejects eventDate submitted less than 72 hours before the event', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, eventDate: pastEventDate });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('72 hours'))).toBe(true);
    }
  });

  it('requires approvedReferralNumber', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, approvedReferralNumber: '' });
    expect(r.success).toBe(false);
  });

  it('requires approvedDate', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, approvedDate: '' });
    expect(r.success).toBe(false);
  });

  it('requires purpose', () => {
    const r = orderCreateSchema.safeParse({ ...validOrder, purpose: '' });
    expect(r.success).toBe(false);
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

  it('requires attachment document for each selected service in WORK_ORDER', () => {
    const workOrderWithoutItemAttachment = {
      ...validOrder,
      orderType: 'WORK_ORDER',
      items: [
        {
          type: 'Service',
          item: 'svc-banner',
          name: 'Flex Banner',
          quantity: 1,
          price: 500,
          size: '6x3',
        },
      ],
    };
    const r = orderCreateSchema.safeParse(workOrderWithoutItemAttachment);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('Attach approved document is required') || i.message.includes('Attachment document is required'))).toBe(true);
    }
  });

  it('rejects non-service (product) items when orderType is WORK_ORDER', () => {
    const workOrderWithProduct = {
      ...validOrder,
      orderType: 'WORK_ORDER',
      items: [
        {
          type: 'InventoryProduct',
          item: 'prod-paper',
          name: 'A4 Paper',
          quantity: 1,
          price: 5,
        },
      ],
    };
    const r = orderCreateSchema.safeParse(workOrderWithProduct);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('Only services are allowed in Work Orders'))).toBe(true);
    }
  });

  it('rejects non-work-order services when orderType is WORK_ORDER', () => {
    const workOrderWithNonWorkOrderService = {
      ...validOrder,
      orderType: 'WORK_ORDER',
      items: [
        {
          type: 'Service',
          item: 'svc-regular-xerox',
          name: 'Regular Xerox Photocopy',
          quantity: 10,
          price: 2,
          isWorkOrder: false,
          attachment: { filename: 'doc.pdf', fileData: 'data:application/pdf;base64,...' },
        },
      ],
    };
    const r = orderCreateSchema.safeParse(workOrderWithNonWorkOrderService);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('Only work order services are allowed in Work Orders'))).toBe(true);
    }
  });

  it('accepts WORK_ORDER when each service has its own attachment document', () => {
    const workOrderWithAttachments = {
      ...validOrder,
      orderType: 'WORK_ORDER',
      items: [
        {
          type: 'Service',
          item: 'svc-banner',
          name: 'Banner Size 1',
          quantity: 1,
          price: 300,
          size: '3x2',
          attachment: { filename: 'banner1.pdf', fileData: 'data:application/pdf;base64,...' },
        },
        {
          type: 'Service',
          item: 'svc-banner',
          name: 'Banner Size 2',
          quantity: 2,
          price: 600,
          size: '6x4',
          attachment: { filename: 'banner2.pdf', fileData: 'data:application/pdf;base64,...' },
        },
      ],
    };
    const r = orderCreateSchema.safeParse(workOrderWithAttachments);
    expect(r.success).toBe(true);
  });

  it('does not require line-item attachment for XEROX_ORDER services', () => {
    const xeroxOrder = {
      ...validOrder,
      orderType: 'XEROX_ORDER',
      items: [validItem],
    };
    expect(orderCreateSchema.safeParse(xeroxOrder).success).toBe(true);
  });

  it('requires valid orderType', () => {
    const r = orderCreateSchema.safeParse({
      ...validOrder,
      orderType: 'Invalid',
    });
    expect(r.success).toBe(false);
  });

  it('requires a payment method', () => {
    const { fundingMethod: _, ...withoutFundingMethod } = validOrder;
    expect(orderCreateSchema.safeParse(withoutFundingMethod).success).toBe(false);
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

  it('accepts self_supports with name and amount', () => {
    const r = orderCreateSchema.safeParse({
      ...validOrder,
      fundingMethod: 'self_support',
      self_supports: [{ name: 'CSR', amount: 100 }],
    });
    expect(r.success).toBe(true);
  });

  it('rejects self support with negative amount', () => {
    const r = orderCreateSchema.safeParse({
      ...validOrder,
      fundingMethod: 'self_support',
      self_supports: [{ name: 'CSR', amount: -5 }],
    });
    expect(r.success).toBe(false);
  });

  it('allows order create without separate proofFiles since upload is inlined on work order services', () => {
    const { proofFiles: _, ...withoutProofs } = validOrder;
    const r = orderCreateSchema.safeParse(withoutProofs);
    expect(r.success).toBe(true);
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