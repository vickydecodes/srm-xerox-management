import { describe, it, expect } from 'vitest';
import { camelToTitle, capitalize, money, getRelativePath } from '../core/utils/helper.utils';

describe('Helper Utilities', () => {
  describe('camelToTitle', () => {
    it('converts camelCase to Title Case', () => {
      expect(camelToTitle('camelCase')).toBe('Camel Case');
    });

    it('converts snake_case to Title Case', () => {
      expect(camelToTitle('snake_case_test')).toBe('Snake Case Test');
    });

    it('returns empty string if undefined', () => {
      expect(camelToTitle()).toBe('');
    });
  });

  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('returns empty string for non-string inputs', () => {
      expect(capitalize(null)).toBe('');
      expect(capitalize(123)).toBe('');
    });
  });

  describe('money', () => {
    it('formats numbers to locale string representation', () => {
      expect(money(1000)).toBe('1,000');
    });

    it('handles falsy values as 0', () => {
      expect(money(null)).toBe('0');
    });
  });

  describe('getRelativePath', () => {
    it('extracts the relative route path', () => {
      expect(getRelativePath('/super_admin/product', '/super_admin')).toBe('product');
      expect(getRelativePath('/super_admin/', '/super_admin')).toBe('');
    });
  });
});
