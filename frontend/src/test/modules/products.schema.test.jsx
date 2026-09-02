import { describe, it, expect } from 'vitest';
import {
  productCreateSchema,
  productEditSchema,
} from '@/modules/products/product.schema';

describe('productCreateSchema', () => {
  it('accepts name only', () => {
    expect(
      productCreateSchema.safeParse({ name: 'A4 Paper' }).success
    ).toBe(true);
  });

  it('requires name min length 2', () => {
    expect(productCreateSchema.safeParse({ name: 'A' }).success).toBe(false);
  });

  it('accepts variants', () => {
    expect(
      productCreateSchema.safeParse({
        name: 'Toner',
        variants: [{ key: 'color', values: 'black,cyan' }],
      }).success
    ).toBe(true);
  });

  it('rejects variant with empty key', () => {
    expect(
      productCreateSchema.safeParse({
        name: 'Toner',
        variants: [{ key: '', values: 'black' }],
      }).success
    ).toBe(false);
  });
});

describe('productEditSchema', () => {
  it('allows optional active', () => {
    expect(
      productEditSchema.safeParse({ name: 'A4 Paper', active: false }).success
    ).toBe(true);
  });
});