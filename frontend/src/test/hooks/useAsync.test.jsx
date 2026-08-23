import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsync } from '@/core/hooks/useAsync';

describe('useAsync', () => {
  it('starts with loading false and no error', () => {
    const { result } = renderHook(() => useAsync(async () => 'ok'));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('run resolves and returns result', async () => {
    const action = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useAsync(action));

    let res;
    await act(async () => {
      res = await result.current.run('arg');
    });

    expect(action).toHaveBeenCalledWith('arg');
    expect(res).toEqual({ id: 1 });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('run sets error on failure', async () => {
    const action = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useAsync(action));

    await act(async () => {
      await expect(result.current.run()).rejects.toThrow('fail');
    });

    expect(result.current.error).toBe('fail');
    expect(result.current.hasError).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('clearError resets error', async () => {
    const action = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAsync(action));

    await act(async () => {
      await expect(result.current.run()).rejects.toThrow();
    });
    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });
});