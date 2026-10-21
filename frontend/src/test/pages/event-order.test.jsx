import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import EventOrderPage from '@/pages/event-order/event-order';
import { useApi } from '@/core/contexts/api.context';
import { useAuth } from '@/core/contexts/auth.context';
import { useLoader } from '@/core/hooks/useLoader';

vi.mock('@/core/contexts/api.context');
vi.mock('@/core/contexts/auth.context');
vi.mock('@/core/hooks/useLoader');

let lastDataTableProps = null;
vi.mock('@/components/ui/datatable', () => ({
  default: (props) => {
    lastDataTableProps = props;
    return <div data-testid="datatable" />;
  },
}));

const buildEventOrdersModule = (overrides = {}) => ({
  state: [{ _id: '1', eventName: 'Annual Tech Symposium 2026' }],
  useEventOrderColumns: vi.fn(() => ['col-1', 'col-2']),
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
    where: vi.fn(),
  },
  reset: vi.fn(),
  loading: { getAll: false },
  pagination: { page: 1, limit: 10, pages: 2, total: 15 },
  ...overrides,
});

describe('EventOrderPage', () => {
  let load;

  beforeEach(() => {
    lastDataTableProps = null;
    load = vi.fn();
    mockNavigate.mockClear();
    useLoader.mockReturnValue({ load, loading: false });
  });

  const setup = (opts = {}) => {
    const {
      role = 'super_admin',
      eventOrders = buildEventOrdersModule(),
    } = opts;

    const finalRole = 'role' in opts ? opts.role : role;

    useApi.mockReturnValue({ eventOrders });
    useAuth.mockReturnValue({ role: finalRole });
    render(<EventOrderPage />);
    return { eventOrders };
  };

  it('loads event orders on mount', () => {
    const { eventOrders } = setup();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(eventOrders);
  });

  it('renders DataTable with event order state, columns, and searchKey', () => {
    const { eventOrders } = setup();
    expect(screen.getByTestId('datatable')).toBeInTheDocument();
    expect(lastDataTableProps.data).toBe(eventOrders.state);
    expect(lastDataTableProps.columns).toEqual(['col-1', 'col-2']);
    expect(lastDataTableProps.searchKey).toBe('eventName');
    expect(lastDataTableProps.manualPagination).toBe(true);
  });

  it('shows create action for department_admin and navigates to work-order creation tab', () => {
    setup({ role: 'department_admin' });
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Work Order',
      provision: true,
      permission: true,
    });
    lastDataTableProps.create.action();
    expect(mockNavigate).toHaveBeenCalledWith('/department_admin/order-creation?tab=work-order');
  });

  it('shows create action for super_admin and navigates to work-order creation tab', () => {
    setup({ role: 'super_admin' });
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Work Order',
      provision: true,
      permission: true,
    });
    lastDataTableProps.create.action();
    expect(mockNavigate).toHaveBeenCalledWith('/super_admin/order-creation?tab=work-order');
  });

  it.each(['staff', 'shop_admin', 'branch_admin', undefined, null])(
    'hides create action for role=%s',
    (role) => {
      setup({ role });
      expect(lastDataTableProps.create).toBeNull();
    }
  );

  it('exposes status filters covering order statuses', () => {
    const { eventOrders } = setup();
    const statusGroup = lastDataTableProps.customs.find((c) => c.title === 'Status');
    expect(statusGroup).toBeDefined();

    const expectedLabels = [
      'Draft',
      'Pending Approval',
      'In Progress',
      'Ready for Pickup',
      'Delivered',
      'Rejected',
    ];
    expectedLabels.forEach((label) => {
      expect(statusGroup.filters.some((f) => f.label === label)).toBe(true);
    });

    const pendingFilter = statusGroup.filters.find((f) => f.label === 'Pending Approval');
    pendingFilter.action();
    expect(eventOrders.filters.where).toHaveBeenCalledWith('status', 'pending');
  });
});
