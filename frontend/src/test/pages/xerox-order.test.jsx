import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import XeroxOrderPage from '@/pages/xerox-order/xerox-order';
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

const buildXeroxOrdersModule = (overrides = {}) => ({
  state: [{ _id: '1', purpose: 'Question papers printing' }],
  useXeroxOrderColumns: vi.fn(() => ['col-x1', 'col-x2']),
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
    where: vi.fn(),
  },
  reset: vi.fn(),
  loading: { getAll: false },
  pagination: { page: 1, limit: 10, pages: 2, total: 12 },
  ...overrides,
});

describe('XeroxOrderPage', () => {
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
      xeroxOrders = buildXeroxOrdersModule(),
    } = opts;

    const finalRole = 'role' in opts ? opts.role : role;

    useApi.mockReturnValue({ xeroxOrders });
    useAuth.mockReturnValue({ role: finalRole });
    render(<XeroxOrderPage />);
    return { xeroxOrders };
  };

  it('loads xerox orders on mount', () => {
    const { xeroxOrders } = setup();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(xeroxOrders);
  });

  it('renders DataTable with xerox order state, columns, and searchKey', () => {
    const { xeroxOrders } = setup();
    expect(screen.getByTestId('datatable')).toBeInTheDocument();
    expect(lastDataTableProps.data).toBe(xeroxOrders.state);
    expect(lastDataTableProps.columns).toEqual(['col-x1', 'col-x2']);
    expect(lastDataTableProps.searchKey).toBe('purpose');
    expect(lastDataTableProps.manualPagination).toBe(true);
  });

  it('shows create action for department_admin and navigates to xerox creation tab', () => {
    setup({ role: 'department_admin' });
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Xerox Order',
      provision: true,
      permission: true,
    });
    lastDataTableProps.create.action();
    expect(mockNavigate).toHaveBeenCalledWith('/department_admin/order-creation?tab=xerox');
  });

  it('shows create action for super_admin and navigates to xerox creation tab', () => {
    setup({ role: 'super_admin' });
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Xerox Order',
      provision: true,
      permission: true,
    });
    lastDataTableProps.create.action();
    expect(mockNavigate).toHaveBeenCalledWith('/super_admin/order-creation?tab=xerox');
  });

  it.each(['staff', 'shop_admin', 'branch_admin', undefined, null])(
    'hides create action for role=%s',
    (role) => {
      setup({ role });
      expect(lastDataTableProps.create).toBeNull();
    }
  );

  it('exposes status filters covering order statuses', () => {
    const { xeroxOrders } = setup();
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

    const inProgressFilter = statusGroup.filters.find((f) => f.label === 'In Progress');
    inProgressFilter.action();
    expect(xeroxOrders.filters.where).toHaveBeenCalledWith('status', 'in_progress');
  });
});
