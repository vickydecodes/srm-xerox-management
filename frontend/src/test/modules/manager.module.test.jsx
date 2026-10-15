import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/core/api/api.request', () => ({
  apiRequest: vi.fn().mockResolvedValue({ data: [], pagination: null }),
}));

vi.mock('@/core/contexts/ui.context', () => ({
  useUI: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => ({ user: { role: 'super_admin' }, adminResetPassword: vi.fn() }),
}));

import { useManagerModule } from '@/modules/manager/manager.module';
import { useManagerStore } from '@/modules/manager/manager.store';
import { apiRequest } from '@/core/api/api.request';

describe('useManagerModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useManagerStore.setState({ query: {}, list: [], loading: false });
  });

  it('exposes a callable fetch function', () => {
    const { result } = renderHook(() => useManagerModule());
    expect(typeof result.current.fetch).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('merges user-supplied params with role: "manager" on fetch', async () => {
    const { result } = renderHook(() => useManagerModule());
    await result.current.fetch({ page: 2, limit: 10, search: 'Vikram' });

    expect(apiRequest).toHaveBeenCalledWith(
      'get',
      expect.stringContaining('/users'),
      expect.objectContaining({
        params: expect.objectContaining({
          role: 'manager',
          page: 2,
          limit: 10,
          search: 'Vikram',
        }),
      })
    );
  });

  it('supplies role: "manager" by default when no params are passed to fetch', async () => {
    const { result } = renderHook(() => useManagerModule());
    await result.current.fetch();

    expect(apiRequest).toHaveBeenCalledWith(
      'get',
      expect.stringContaining('/users'),
      expect.objectContaining({
        params: expect.objectContaining({
          role: 'manager',
        }),
      })
    );
  });

  it('allows super_admin to create, update, delete managers', () => {
    const { result } = renderHook(() => useManagerModule());
    expect(result.current.allow).toEqual({
      create: true,
      update: true,
      delete: true,
    });
  });
});
