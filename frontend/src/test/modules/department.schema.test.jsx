import { describe, it, expect } from 'vitest';
import {
  departmentCreateSchema,
  departmentEditSchema,
} from '@/modules/department/department.schema';

describe('departmentCreateSchema', () => {
  it('accepts valid department', () => {
    expect(
      departmentCreateSchema.safeParse({
        code: 'DPT-01',
        name: 'Design',
        branch: 'branch-1',
        active: true,
      }).success
    ).toBe(true);
  });

  it('requires branch', () => {
    expect(
      departmentCreateSchema.safeParse({
        code: 'DPT-01',
        name: 'Design',
        branch: '',
      }).success
    ).toBe(false);
  });

  it('requires name min length 2', () => {
    expect(
      departmentCreateSchema.safeParse({
        code: 'DPT-01',
        name: 'D',
        branch: 'b1',
      }).success
    ).toBe(false);
  });
});

describe('departmentEditSchema', () => {
  it('extends create schema', () => {
    expect(
      departmentEditSchema.safeParse({
        code: 'DPT-01',
        name: 'Design',
        branch: 'b1',
      }).success
    ).toBe(true);
  });
});