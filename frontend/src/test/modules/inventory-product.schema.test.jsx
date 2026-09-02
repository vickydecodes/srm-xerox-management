import { describe, it, expect } from 'vitest';
import {
  inventoryProductCreateSchema,
  inventoryProductEditSchema,
  inventoryProductSchema,
} from '@/modules/inventory-product/inventory-product.schema';

describe('inventoryProductCreateSchema', () => {
  it('accepts valid product', () => {
    expect(
      inventoryProductCreateSchema.safeParse({
        product: 'prod-1',
        variant: { size: 'A4' },
        quantity: 10,
        price: 99.5,
        active: true,
      }).success
    ).toBe(true);
  });

  it('requires product id', () => {
    expect(
      inventoryProductCreateSchema.safeParse({ product: '' }).success
    ).toBe(false);
  });

  it('rejects negative quantity / price', () => {
    expect(
      inventoryProductCreateSchema.safeParse({
        product: 'p1',
        quantity: -1,
      }).success
    ).toBe(false);
    expect(
      inventoryProductCreateSchema.safeParse({
        product: 'p1',
        price: -1,
      }).success
    ).toBe(false);
  });
});

describe('inventoryProductEditSchema', () => {
  it('allows quantity, price, active without product', () => {
    expect(
      inventoryProductEditSchema.safeParse({
        quantity: 5,
        price: 10,
        active: false,
      }).success
    ).toBe(true);
  });
});

describe('inventoryProductSchema', () => {
  it('mirrors create schema', () => {
    expect(
      inventoryProductSchema.safeParse({ product: 'p1' }).success
    ).toBe(true);
  });
});