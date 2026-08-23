import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchDashboard = vi.fn();
const storeState = {
  data: { orders: 3 },
  loading: false,
  fetchDashboard,
};

vi.mock('@/modules/dashboard/dashboard.store', () => ({
  useDashboardStore: () => storeState,
}));

import { useDashboardModule } from '@/modules/dashboard/dashboard.module';

describe('useDashboardModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes state, data, loading and fetch', () => {
    const mod = useDashboardModule();
    expect(mod.state).toEqual({ orders: 3 });
    expect(mod.data).toEqual({ orders: 3 });
    expect(mod.loading).toBe(false);
    expect(mod.fetch).toBe(fetchDashboard);
  });

  it('delegates fetch to store.fetchDashboard', () => {
    const mod = useDashboardModule();
    mod.fetch();
    expect(fetchDashboard).toHaveBeenCalled();
  });
});