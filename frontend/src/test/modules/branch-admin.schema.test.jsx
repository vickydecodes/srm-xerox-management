import { describe, it, expect } from 'vitest';
import {
  branchAdminCreateSchema,
  branchAdminEditSchema,
  resetPasswordSchema,
} from '@/modules/branch-admin/branch-admin.schema';

const validCreate = {
  name: 'Asha Menon',
  email: 'asha@example.com',
  phone: '9876543210',
  password: 'secret1',
  branch: 'branch-1',
  active: true,
};

describe('branchAdminCreateSchema', () => {
  it('accepts valid payload', () => {
    expect(branchAdminCreateSchema.safeParse(validCreate).success).toBe(true);
  });

  it('requires valid email', () => {
    expect(
      branchAdminCreateSchema.safeParse({
        ...validCreate,
        email: 'bad',
      }).success
    ).toBe(false);
  });

  it('requires phone min 10', () => {
    expect(
      branchAdminCreateSchema.safeParse({
        ...validCreate,
        phone: '123',
      }).success
    ).toBe(false);
  });

  it('requires password min 6', () => {
    expect(
      branchAdminCreateSchema.safeParse({
        ...validCreate,
        password: '123',
      }).success
    ).toBe(false);
  });

  it('requires branch', () => {
    expect(
      branchAdminCreateSchema.safeParse({
        ...validCreate,
        branch: '',
      }).success
    ).toBe(false);
  });
});

describe('branchAdminEditSchema', () => {
  it('does not require password', () => {
    const { password, ...edit } = validCreate;
    expect(branchAdminEditSchema.safeParse(edit).success).toBe(true);
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

  it('rejects mismatch', () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'newpass1',
        confirmPassword: 'other',
      }).success
    ).toBe(false);
  });
});