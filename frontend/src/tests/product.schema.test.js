import { describe, it, expect } from 'vitest';
import { productCreateSchema, productEditSchema } from '../modules/products/product.schema';

describe('Product Schema Validation', () => {
  it('validates a correct product payload', () => {
    const payload = {
      name: 'SRM Notebook',
      description: 'Ruled A4 notebook',
      variants: [
        { key: 'size', values: 'A4, A5' }
      ]
    };
    
    const result = productCreateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('fails if product name is less than 2 characters', () => {
    const payload = {
      name: 'S'
    };

    const result = productCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.format().name._errors[0]).toBe('Please enter the product name');
    }
  });

  it('fails if variant key or values are empty strings', () => {
    const payload = {
      name: 'Xerox Paper',
      variants: [
        { key: '', values: 'White' }
      ]
    };

    const result = productCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('validates edit schema with active field', () => {
    const payload = {
      name: 'SRM Pen',
      active: true
    };

    const result = productEditSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
