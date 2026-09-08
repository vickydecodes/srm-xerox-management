import { describe, it, expect } from 'vitest';
import {
  staffCreateSchema,
  staffEditSchema,
  resetPasswordSchema,
} from '@/modules/staff-admin/staff-admin.schema';

describe('staffCreateSchema', () => {
  it('accepts valid staff', () => {
    expect(
      staffCreateSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '9876543210',
        active: true,
      }).success
    ).toBe(true);
  });

  it('requires name min length 2', () => {
    expect(
      staffCreateSchema.safeParse({
        name: 'J',
        email: 'jane@example.com',
        phone: '9876543210',
      }).success
    ).toBe(false);
  });

  it('requires phone min 10', () => {
    expect(
      staffCreateSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '123',
      }).success
    ).toBe(false);
  });
});

describe('staffEditSchema', () => {
  it('does not require password', () => {
    expect(
      staffEditSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '9876543210',
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