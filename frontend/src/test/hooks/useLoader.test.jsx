import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoader } from '@/core/hooks/useLoader';

describe('useLoader', () => {
  it('starts with loading false', () => {
    const { result } = renderHook(() => useLoader());
    expect(result.current.loading).toBe(false);
  });

  it('load calls module.fetch when state is empty', async () => {
    const fetch = vi.fn().mockResolvedValue([{ id: 1 }]);
    const module = { fetch, state: [] };

    const { result } = renderHook(() => useLoader());

    let res;
    await act(async () => {
      res = await result.current.load(module);
    });

    expect(fetch).toHaveBeenCalled();
    expect(res).toEqual([[{ id: 1 }]]);
    expect(result.current.loading).toBe(false);
  });

  it('load skips when state already has data and force is false', async () => {
    const fetch = vi.fn().mockResolvedValue([{ id: 1 }]);
    const module = { fetch, state: [{ id: 1 }] };

    const { result } = renderHook(() => useLoader());

    await act(async () => {
      await result.current.load(module);
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('loadOnly runs a custom fetchFn', async () => {
    const fetchFn = vi.fn().mockResolvedValue('done');
    const { result } = renderHook(() => useLoader());

    let res;
    await act(async () => {
      res = await result.current.loadOnly(fetchFn);
    });

    expect(fetchFn).toHaveBeenCalled();
    expect(res).toBe('done');
    expect(result.current.loading).toBe(false);
  });
});