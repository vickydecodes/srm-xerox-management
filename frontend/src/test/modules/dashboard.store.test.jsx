import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiRequest, staffDashboardUrl, handleApiError } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  staffDashboardUrl: vi.fn(() => '/dashboards/staff'),
  handleApiError: vi.fn(),
}));

vi.mock('@/core/api/api.request', () => ({ apiRequest }));
vi.mock('@/core/api/api.urls', () => ({
  apiurls: { dashboard: { staff: { url: staffDashboardUrl } } },
}));
vi.mock('@/core/errors/error.handler', () => ({ default: handleApiError }));

import { useDashboardStore } from '@/modules/dashboard/dashboard.store';

describe('dashboard store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockResolvedValue({ data: { stats: { totalBills: 1 } } });
    useDashboardStore.setState({ data: null, loading: false });
  });

  it('sends inclusive start and end dates for the selected calendar range', async () => {
    const from = new Date(2025, 0, 3, 12);
    const to = new Date(2025, 0, 5, 12);
    const expectedStart = new Date(from);
    const expectedEnd = new Date(to);
    expectedStart.setHours(0, 0, 0, 0);
    expectedEnd.setHours(23, 59, 59, 999);

    await useDashboardStore.getState().fetchDashboard('staff', { from, to });

    expect(staffDashboardUrl).toHaveBeenCalledWith(
      expectedEnd.toISOString(),
      expectedStart.toISOString(),
    );
    expect(useDashboardStore.getState().data).toEqual({ stats: { totalBills: 1 } });
    expect(useDashboardStore.getState().loading).toBe(false);
  });
});
