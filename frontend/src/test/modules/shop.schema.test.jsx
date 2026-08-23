import { describe, it, expect } from 'vitest';
import { shopCreateSchema, shopEditSchema } from '@/modules/shop/shop.schema';

describe('shopCreateSchema', () => {
  it('accepts valid shop', () => {
    expect(
      shopCreateSchema.safeParse({
        code: 'SH01',
        name: 'Main Shop',
        phone: '9876543210',
        email: 'shop@example.com',
        active: true,
      }).success
    ).toBe(true);
  });

  it('requires code', () => {
    expect(
      shopCreateSchema.safeParse({
        code: '',
        name: 'Main Shop',
        phone: '9876543210',
      }).success
    ).toBe(false);
  });

  it('requires name min length 2', () => {
    expect(
      shopCreateSchema.safeParse({
        code: 'SH01',
        name: 'A',
        phone: '9876543210',
      }).success
    ).toBe(false);
  });

  it('allows empty email', () => {
    expect(
      shopCreateSchema.safeParse({
        code: 'SH01',
        name: 'Main Shop',
        phone: '9876543210',
        email: '',
      }).success
    ).toBe(true);
  });
});

describe('shopEditSchema', () => {
  it('allows optional active', () => {
    expect(
      shopEditSchema.safeParse({
        code: 'SH01',
        name: 'Main Shop',
        phone: '9876543210',
      }).success
    ).toBe(true);
  });
});