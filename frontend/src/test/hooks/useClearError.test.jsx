import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClearError } from '@/core/hooks/useClearError';

describe('useClearError', () => {
  it('subscribes to form.watch and calls clearError', () => {
    const clearError = vi.fn();
    const unsubscribe = vi.fn();
    const form = {
      watch: vi.fn((cb) => {
        cb(); // simulate a change
        return { unsubscribe };
      }),
    };

    const { unmount } = renderHook(() => useClearError(form, clearError));

    expect(form.watch).toHaveBeenCalled();
    expect(clearError).toHaveBeenCalled();

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('does nothing when form or clearError is missing', () => {
    const { result } = renderHook(() => useClearError(null, null));
    expect(result.current).toBeUndefined();
  });
});