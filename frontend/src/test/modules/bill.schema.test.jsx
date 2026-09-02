import { describe, it, expect } from 'vitest';
import {
  createBillSchema,
  defaultBillValues,
  PAYMENT_METHODS,
} from '@/modules/bill/bill.schema';

const validItem = {
  type: 'InventoryProduct',
  item: 'prod-1',
  name: 'A4 Paper',
  quantity: 2,
  price: 10,
};

describe('createBillSchema', () => {
  it('accepts a valid cash bill', () => {
    const result = createBillSchema.safeParse({
      paymentMethod: 'cash',
      status: 'paid',
      items: [validItem],
      discount: 0,
      tax: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty items', () => {
    const result = createBillSchema.safeParse({
      paymentMethod: 'cash',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid payment method', () => {
    const result = createBillSchema.safeParse({
      paymentMethod: 'cheque',
      items: [validItem],
    });
    expect(result.success).toBe(false);
  });

  it('requires branch and department for credit bills', () => {
    const result = createBillSchema.safeParse({
      paymentMethod: 'credit',
      items: [validItem],
    });
    expect(result.success).toBe(false);
    const paths = result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['branch', 'department']));
  });

  it('accepts credit bill with branch and department', () => {
    const result = createBillSchema.safeParse({
      paymentMethod: 'credit',
      branch: 'b1',
      department: 'd1',
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it('rejects item with quantity < 1', () => {
    const result = createBillSchema.safeParse({
      paymentMethod: 'cash',
      items: [{ ...validItem, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = createBillSchema.safeParse({
      paymentMethod: 'cash',
      items: [{ ...validItem, price: -1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('defaultBillValues / PAYMENT_METHODS', () => {
  it('has sensible defaults', () => {
    expect(defaultBillValues.paymentMethod).toBe('cash');
    expect(defaultBillValues.status).toBe('paid');
    expect(defaultBillValues.items).toEqual([]);
  });

  it('exports payment methods', () => {
    expect(PAYMENT_METHODS.map((m) => m.value)).toEqual(
      expect.arrayContaining(['upi', 'cash', 'credit'])
    );
  });
});