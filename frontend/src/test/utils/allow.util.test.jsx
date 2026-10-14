import { describe, it, expect } from 'vitest';
import { allow, ALL_ROLES } from '@/core/utils/allow.util';

describe('allow utility', () => {
  it('returns true when user role is in the allowed roles list', () => {
    expect(allow(['super_admin', 'branch_admin'], 'super_admin')).toBe(true);
    expect(allow(['super_admin', 'branch_admin'], 'branch_admin')).toBe(true);
  });

  it('returns false when user role is not in the allowed roles list', () => {
    expect(allow(['super_admin'], 'staff')).toBe(false);
  });

  it('defaults to ALL_ROLES when roles is omitted', () => {
    expect(allow(undefined, 'staff')).toBe(true);
    expect(allow(undefined, 'super_admin')).toBe(true);
  });

  it('returns false when userRole is null or undefined', () => {
    expect(allow(ALL_ROLES, null)).toBe(false);
    expect(allow(ALL_ROLES, undefined)).toBe(false);
  });
});
