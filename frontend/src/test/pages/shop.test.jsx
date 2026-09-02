/**
 * test/pages/shop.test.jsx
 *
 * Covers pages/shop/shop.jsx (ShopPage).
 *
 * Thin wrapper around <DataTable/> wired to the `shops` slice of ApiContext
 * + the current user's role from AuthContext.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import ShopPage from '@/pages/shop/shop';
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

const buildShopsModule = (overrides = {}) => ({
  state: [{ _id: '1', name: 'Main Xerox Shop' }],
  useShopColumns: vi.fn(() => ['col-a', 'col-b']),
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
    where: vi.fn(),
  },
  openCreate: vi.fn(),
  reset: vi.fn(),
  loading: { getAll: false },
  pagination: { page: 1, limit: 10, pages: 2, total: 15 },
  fetch: vi.fn(),
  sortByColumn: vi.fn(),
  ...overrides,
});

describe('ShopPage', () => {
  let load;

  beforeEach(() => {
    lastDataTableProps = null;
    load = vi.fn();
    useLoader.mockReturnValue({ load, loading: false });
  });

  // Preserve explicitly passed undefined/null role
  const setup = (opts = {}) => {
    const {
      role = 'super_admin',
      shops = buildShopsModule(),
    } = opts;

    const finalRole = 'role' in opts ? opts.role : role;

    useApi.mockReturnValue({ shops });
    useAuth.mockReturnValue({ role: finalRole });
    render(<ShopPage />);
    return { shops };
  };

  it('loads shops on mount', () => {
    const { shops } = setup();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(shops);
  });

  it('renders the DataTable with the shop state, columns and search key', () => {
    const { shops } = setup();
    expect(screen.getByTestId('datatable')).toBeInTheDocument();
    expect(lastDataTableProps.data).toBe(shops.state);
    expect(lastDataTableProps.columns).toEqual(['col-a', 'col-b']);
    expect(lastDataTableProps.searchKey).toBe('name');
    expect(lastDataTableProps.manualPagination).toBe(true);
  });

  it('forwards pagination, loading and reset state from the shops module', () => {
    const shops = buildShopsModule({ loading: { getAll: true } });
    setup({ shops });
    expect(lastDataTableProps.loading).toBe(true);
    expect(lastDataTableProps.page).toBe(shops.pagination.page);
    expect(lastDataTableProps.limit).toBe(shops.pagination.limit);
    expect(lastDataTableProps.pageCount).toBe(shops.pagination.pages);
    expect(lastDataTableProps.totalRows).toBe(shops.pagination.total);
    expect(lastDataTableProps.reset).toBe(shops.reset);
  });

  // Page always exposes the create action (no role-based hiding)
  it.each([
    'super_admin',
    'staff',
    'shop_admin',
    'branch_admin',
    'department_admin',
    undefined,
    null,
  ])('shows a "Create Shop" action for role=%s', (role) => {
    setup({ role });
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Shop',
      provision: true,
      permission: true,
    });
  });

  it('invoking the create action opens the create modal', () => {
    const { shops } = setup({ role: 'super_admin' });
    lastDataTableProps.create.action();
    expect(shops.openCreate).toHaveBeenCalledTimes(1);
  });

  it('exposes latest/oldest sort filters that delegate to the shops module', () => {
    const { shops } = setup();
    const latest = lastDataTableProps.filters.find((f) => f.label === 'Latest');
    const oldest = lastDataTableProps.filters.find((f) => f.label === 'Oldest');

    latest.action('f');
    expect(shops.filters.latest).toHaveBeenCalledWith('f');

    oldest.action('f');
    expect(shops.filters.oldest).toHaveBeenCalledWith('f');
  });

  it('delegates pagination and sort changes to the shops module', () => {
    const { shops } = setup();

    lastDataTableProps.onPaginationChange({ page: 2, limit: 10 });
    expect(shops.fetch).toHaveBeenCalledWith({ page: 2, limit: 10 });

    lastDataTableProps.onSortChange({ sortBy: 'name', order: 'asc' });
    expect(shops.fetch).toHaveBeenCalledWith({ sortBy: 'name', order: 'asc' });
  });
});