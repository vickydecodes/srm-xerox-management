import { describe, it, expect } from 'vitest';
import {
  departmentAdminCreateSchema,
  departmentAdminEditSchema,
  resetPasswordSchema,
} from '@/modules/department-admin/department-admin.schema';

const validCreate = {
  name: 'Ravi Kumar',
  email: 'ravi@example.com',
  phone: '9876543210',
  password: 'secret1',
  branch: 'branch-1',
  department: 'dept-1',
  active: true,
};

describe('departmentAdminCreateSchema', () => {
  it('accepts valid payload', () => {
    expect(
      departmentAdminCreateSchema.safeParse(validCreate).success
    ).toBe(true);
  });

  it('requires department', () => {
    expect(
      departmentAdminCreateSchema.safeParse({
        ...validCreate,
        department: '',
      }).success
    ).toBe(false);
  });

  it('requires valid email', () => {
    expect(
      departmentAdminCreateSchema.safeParse({
        ...validCreate,
        email: 'x',
      }).success
    ).toBe(false);
  });
});

describe('departmentAdminEditSchema', () => {
  it('does not require password', () => {
    const { password, ...edit } = validCreate;
    expect(departmentAdminEditSchema.safeParse(edit).success).toBe(true);
  });
});

describe('resetPasswordSchema', () => {
  it('requires matching passwords', () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'abcdef',
        confirmPassword: 'abcdef',
      }).success
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        newPassword: 'abcdef',
        confirmPassword: 'xxxxxx',
      }).success
    ).toBe(false);
  });
});