import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredBy } from '@/core/hooks/useFilterBy';

const list = [
  { _id: '1', branch: 'b1', department: 'd1' },
  { _id: '2', branch: 'b1', department: 'd2' },
  { _id: '3', branch: 'b2', department: 'd1' },
];

describe('useFilteredBy', () => {
  it('returns empty array when no conditions and full is false', () => {
    const { result } = renderHook(() => useFilteredBy(list, {}));
    expect(result.current).toEqual([]);
  });

  it('returns full list when no conditions and full is true', () => {
    const { result } = renderHook(() =>
      useFilteredBy(list, {}, { full: true })
    );
    expect(result.current).toEqual(list);
  });

  it('filters by single condition', () => {
    const { result } = renderHook(() =>
      useFilteredBy(list, { branch: 'b1' })
    );
    expect(result.current).toHaveLength(2);
    expect(result.current.every((i) => i.branch === 'b1')).toBe(true);
  });

  it('filters by multiple conditions', () => {
    const { result } = renderHook(() =>
      useFilteredBy(list, { branch: 'b1', department: 'd2' })
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0]._id).toBe('2');
  });

  it('ignores empty condition values', () => {
    const { result } = renderHook(() =>
      useFilteredBy(list, { branch: '', department: 'd1' })
    );
    expect(result.current).toHaveLength(2);
  });
});