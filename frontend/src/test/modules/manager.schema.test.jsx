import { describe, it, expect } from 'vitest';
import {
  managerCreateSchema,
  managerEditSchema,
  resetPasswordSchema,
} from '@/modules/manager/manager.schema';

const validCreate = {
  name: 'Vikram Patel',
  email: 'vikram@example.com',
  phone: '9876543210',
  branch: 'branch-1',
  active: true,
};

describe('managerCreateSchema', () => {
  it('accepts valid payload', () => {
    expect(managerCreateSchema.safeParse(validCreate).success).toBe(true);
  });

  it('requires valid email', () => {
    expect(
      managerCreateSchema.safeParse({
        ...validCreate,
        email: 'bad',
      }).success
    ).toBe(false);
  });

  it('requires phone min 10', () => {
    expect(
      managerCreateSchema.safeParse({
        ...validCreate,
        phone: '123',
      }).success
    ).toBe(false);
  });

  it('requires branch', () => {
    expect(
      managerCreateSchema.safeParse({
        ...validCreate,
        branch: '',
      }).success
    ).toBe(false);
  });
});

describe('managerEditSchema', () => {
  it('accepts valid payload', () => {
    expect(managerEditSchema.safeParse(validCreate).success).toBe(true);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'newpass1',
        confirmPassword: 'newpass1',
      }).success
    ).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'newpass1',
        confirmPassword: 'other',
      }).success
    ).toBe(false);
  });
});
