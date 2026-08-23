import { describe, it, expect, vi, beforeEach } from 'vitest';

const set = vi.fn();
const startLoading = vi.fn();
const stopLoading = vi.fn();
const list = [];
const loading = { getAll: false };

vi.mock('@/modules/search/search.store', () => ({
  useSearchStore: Object.assign(
    () => ({ set, startLoading, stopLoading, list, loading }),
    {
      getState: () => ({ list, loading }),
    }
  ),
}));

const apiRequest = vi.fn();
vi.mock('@/core/api/api.request', () => ({
  apiRequest: (...args) => apiRequest(...args),
}));

vi.mock('@/core/api/api.urls', () => ({
  apiurls: {
    search: {
      products: { method: 'get', url: () => '/api/search/products' },
    },
  },
}));

vi.mock('@/modules/search/search.combobox', () => ({
  BillingItemSearchCombobox: () => null,
}));

import { useSearchModule } from '@/modules/search/search.module';

describe('useSearchModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes searchProducts and BillingItemSearchCombobox', () => {
    const mod = useSearchModule();
    expect(typeof mod.searchProducts).toBe('function');
    expect(mod.BillingItemSearchCombobox).toBeDefined();
  });

  it('searchProducts calls api and set()', async () => {
    apiRequest.mockResolvedValue({ data: [{ _id: '1', name: 'A4' }] });
    const mod = useSearchModule();
    const items = await mod.searchProducts('paper', { limit: 5 });

    expect(startLoading).toHaveBeenCalledWith('getAll');
    expect(apiRequest).toHaveBeenCalledWith(
      'get',
      '/api/search/products',
      { params: { q: 'paper', limit: 5 } }
    );
    expect(set).toHaveBeenCalledWith([{ _id: '1', name: 'A4' }]);
    expect(stopLoading).toHaveBeenCalledWith('getAll');
    expect(items).toEqual([{ _id: '1', name: 'A4' }]);
  });

  it('always stops loading even on error', async () => {
    apiRequest.mockRejectedValue(new Error('network'));
    const mod = useSearchModule();
    await expect(mod.searchProducts('x')).rejects.toThrow('network');
    expect(stopLoading).toHaveBeenCalledWith('getAll');
  });
});