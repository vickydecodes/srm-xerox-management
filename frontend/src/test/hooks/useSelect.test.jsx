import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelectItems } from '@/core/hooks/useSelect';

describe('useSelectItems', () => {
  it('returns empty placeholder item when list is empty', () => {
    const { result } = renderHook(() =>
      useSelectItems([], { emptyText: 'Nothing here' })
    );
    expect(result.current.hasItems).toBe(false);
    expect(result.current.disabled).toBe(true);
    expect(result.current.placeholder).toBe('Select the item');
    expect(result.current.items).toBeTruthy();
  });

  it('returns items when list has data', () => {
    const products = [
      { _id: 'p1', name: 'A4 Paper' },
      { _id: 'p2', name: 'Toner' },
    ];
    const { result } = renderHook(() =>
      useSelectItems(products, { placeholder: 'Pick product' })
    );
    expect(result.current.hasItems).toBe(true);
    expect(result.current.disabled).toBe(false);
    expect(result.current.placeholder).toBe('Pick product');
    expect(result.current.items).toBeTruthy();
  });
});