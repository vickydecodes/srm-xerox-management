import { describe, it, expect } from 'vitest';
import {
  branchCreateSchema,
  branchEditSchema,
} from '@/modules/branch/branch.schema';

describe('branchCreateSchema', () => {
  it('accepts valid branch', () => {
    expect(
      branchCreateSchema.safeParse({
        code: 'CHN',
        name: 'Chennai HQ',
        active: true,
      }).success
    ).toBe(true);
  });

  it('requires code', () => {
    expect(
      branchCreateSchema.safeParse({ code: '', name: 'Chennai' }).success
    ).toBe(false);
  });

  it('requires name min length 2', () => {
    expect(
      branchCreateSchema.safeParse({ code: 'CHN', name: 'A' }).success
    ).toBe(false);
  });
});

describe('branchEditSchema', () => {
  it('allows optional active', () => {
    expect(
      branchEditSchema.safeParse({ code: 'CHN', name: 'Chennai HQ' }).success
    ).toBe(true);
  });
});