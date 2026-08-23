import { describe, it, expect } from 'vitest';
import {
  serviceCreateSchema,
  serviceEditSchema,
  serviceMaterialSchema,
} from '@/modules/service/service.schema';

describe('serviceCreateSchema', () => {
  it('accepts valid service', () => {
    expect(
      serviceCreateSchema.safeParse({
        name: 'Xerox A4',
        unit: 'page',
        price: 2,
        active: true,
        materials: [],
      }).success
    ).toBe(true);
  });

  it('requires name min length 2', () => {
    expect(
      serviceCreateSchema.safeParse({
        name: 'A',
        unit: 'page',
        price: 1,
      }).success
    ).toBe(false);
  });

  it('requires unit', () => {
    expect(
      serviceCreateSchema.safeParse({
        name: 'Xerox',
        unit: '',
        price: 1,
      }).success
    ).toBe(false);
  });

  it('rejects negative price', () => {
    expect(
      serviceCreateSchema.safeParse({
        name: 'Xerox',
        unit: 'page',
        price: -1,
      }).success
    ).toBe(false);
  });
});

describe('serviceMaterialSchema', () => {
  it('accepts valid material', () => {
    expect(
      serviceMaterialSchema.safeParse({
        product: 'p1',
        quantity: 2,
      }).success
    ).toBe(true);
  });

  it('requires product', () => {
    expect(
      serviceMaterialSchema.safeParse({
        product: '',
        quantity: 1,
      }).success
    ).toBe(false);
  });
});

describe('serviceEditSchema', () => {
  it('allows optional active', () => {
    expect(
      serviceEditSchema.safeParse({
        name: 'Xerox A4',
        unit: 'page',
        price: 2,
      }).success
    ).toBe(true);
  });
});