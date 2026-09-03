/**
 * test/pages/order.test.jsx
 *
 * Covers pages/order/order.jsx (OrderPage).
 *
 * The page is a thin wrapper around <DataTable/> wired up to the `orders`
 * slice of ApiContext + the current user's role from AuthContext, so the
 * heavy DataTable component is mocked out and we assert on the props the
 * page computes and passes down to it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import OrderPage from '@/pages/order/order';
import { useApi } from '@/core/contexts/api.context';
import { useAuth } from '@/core/contexts/auth.context';
import { useLoader } from '@/core/hooks/useLoader';

vi.mock('@/core/contexts/api.context');
vi.mock('@/core/contexts/auth.context');
vi.mock('@/core/hooks/useLoader');

// Capture the props DataTable is rendered with so we can assert against them
// without depending on its (heavy, react-table driven) internals.
let lastDataTableProps = null;
vi.mock('@/components/ui/datatable', () => ({
  default: (props) => {
    lastDataTableProps = props;
    return <div data-testid="datatable" />;
  },
}));

const buildOrdersModule = (overrides = {}) => ({
  state: [{ _id: '1', purpose: 'Test order' }],
  useOrderColumns: vi.fn(() => ['col-a', 'col-b']),
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
    where: vi.fn(),
  },
  openCreate: vi.fn(),
  reset: vi.fn(),
  loading: { getAll: false },
  pagination: { page: 1, limit: 10, pages: 3, total: 30 },
  fetch: vi.fn(),
  sortByColumn: vi.fn(),
  ...overrides,
});

describe('OrderPage', () => {
  let load;

  beforeEach(() => {
    lastDataTableProps = null;
    load = vi.fn();
    useLoader.mockReturnValue({ load, loading: false });
  });

  // Preserve an explicitly passed `undefined` / `null` role instead of
  // letting the destructuring default turn it into 'super_admin'.
  const setup = (opts = {}) => {
    const {
      role = 'super_admin',
      orders = buildOrdersModule(),
    } = opts;

    const finalRole = 'role' in opts ? opts.role : role;

    useApi.mockReturnValue({ orders });
    useAuth.mockReturnValue({ role: finalRole });
    render(<OrderPage />);
    return { orders };
  };

  it('loads orders on mount', () => {
    const { orders } = setup();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(orders);
  });

  it('renders the DataTable with the order state, columns and search key', () => {
    const { orders } = setup();
    expect(screen.getByTestId('datatable')).toBeInTheDocument();
    expect(lastDataTableProps.data).toBe(orders.state);
    expect(lastDataTableProps.columns).toEqual(['col-a', 'col-b']);
    expect(lastDataTableProps.searchKey).toBe('purpose');
    expect(lastDataTableProps.manualPagination).toBe(true);
  });

  it('forwards pagination, loading and reset state from the orders module', () => {
    const orders = buildOrdersModule({ loading: { getAll: true } });
    setup({ orders });
    expect(lastDataTableProps.loading).toBe(true);
    expect(lastDataTableProps.page).toBe(orders.pagination.page);
    expect(lastDataTableProps.limit).toBe(orders.pagination.limit);
    expect(lastDataTableProps.pageCount).toBe(orders.pagination.pages);
    expect(lastDataTableProps.totalRows).toBe(orders.pagination.total);
    expect(lastDataTableProps.reset).toBe(orders.reset);
  });

  // Page: canCreate = role === "department_admin" only
  it('shows a "Create Order" action for department_admin', () => {
    setup({ role: 'department_admin' });
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Order',
      provision: true,
      permission: true,
    });
  });

  it.each([
    'super_admin',
    'staff',
    'shop_admin',
    'branch_admin',
    undefined,
    null,
  ])('hides the create action for role=%s', (role) => {
    setup({ role });
    expect(lastDataTableProps.create).toBeNull();
  });

  it('invoking the create action opens the create modal', () => {
    const { orders } = setup({ role: 'department_admin' });
    lastDataTableProps.create.action();
    expect(orders.openCreate).toHaveBeenCalledTimes(1);
  });

  it('exposes latest/oldest sort filters that delegate to the orders module', () => {
    const { orders } = setup();
    const latest = lastDataTableProps.filters.find((f) => f.label === 'Latest');
    const oldest = lastDataTableProps.filters.find((f) => f.label === 'Oldest');

    latest.action('f');
    expect(orders.filters.latest).toHaveBeenCalledWith('f');

    oldest.action('f');
    expect(orders.filters.oldest).toHaveBeenCalledWith('f');
  });

  it('exposes a Status custom filter group covering every order status', () => {
    const { orders } = setup();
    const [statusGroup] = lastDataTableProps.customs;
    expect(statusGroup.title).toBe('Status');

    const labels = statusGroup.filters.map((f) => f.label);
    expect(labels).toEqual([
      'Draft',
      'Pending Approval',
      'In Progress',
      'Ready for Pickup',
      'Delivered',
      'Rejected',
    ]);

    statusGroup.filters.find((f) => f.label === 'Rejected').action();
    expect(orders.filters.where).toHaveBeenCalledWith('status', 'rejected');
  });

  it('delegates pagination and sort changes to the orders module', () => {
    const { orders } = setup();

    lastDataTableProps.onPaginationChange({ page: 2, limit: 10 });
    expect(orders.fetch).toHaveBeenCalledWith({ page: 2, limit: 10 });

    lastDataTableProps.onSortChange({ sortBy: 'purpose', order: 'asc' });
    expect(orders.fetch).toHaveBeenCalledWith({
      sortBy: 'purpose',
      order: 'asc',
    });
  });
});