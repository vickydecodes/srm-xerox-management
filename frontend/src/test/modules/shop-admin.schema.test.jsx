import { describe, it, expect } from 'vitest';
import {
  shopAdminCreateSchema,
  shopAdminEditSchema,
  resetPasswordSchema,
} from '@/modules/shop-admin/shop-admin.schema';

describe('shopAdminCreateSchema', () => {
  it('accepts valid admin', () => {
    expect(
      shopAdminCreateSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        password: 'secret1',
        shop: 's1',
        active: true,
      }).success
    ).toBe(true);
  });

  it('requires password min 6', () => {
    expect(
      shopAdminCreateSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        password: '123',
        shop: 's1',
      }).success
    ).toBe(false);
  });

  it('requires shop', () => {
    expect(
      shopAdminCreateSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        password: 'secret1',
        shop: '',
      }).success
    ).toBe(false);
  });

  it('requires valid email', () => {
    expect(
      shopAdminCreateSchema.safeParse({
        name: 'John Doe',
        email: 'not-an-email',
        phone: '9876543210',
        password: 'secret1',
        shop: 's1',
      }).success
    ).toBe(false);
  });
});

describe('shopAdminEditSchema', () => {
  it('does not require password', () => {
    expect(
      shopAdminEditSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        shop: 's1',
      }).success
    ).toBe(true);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'secret1',
        confirmPassword: 'secret1',
      }).success
    ).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'secret1',
        confirmPassword: 'other',
      }).success
    ).toBe(false);
  });
});