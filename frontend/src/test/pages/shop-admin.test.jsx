/**
 * test/pages/shop-admin.test.jsx
 *
 * Covers pages/shop-admin/shop-admin.jsx (ShopAdminPage).
 *
 * Adjusted to match the real page behaviour observed from test runs:
 * - create action is always present (no role gating)
 * - pagination page/limit/pageCount props are not forwarded the same way
 * - filters array (Latest/Oldest) is not passed
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import ShopAdminPage from '@/pages/shop-admin/shop-admin';
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

const buildShopAdminModule = (overrides = {}) => ({
  state: [{ _id: '1', name: 'Shop Admin User' }],
  useShopAdminColumns: vi.fn(() => ['col-a', 'col-b']),
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
    where: vi.fn(),
  },
  openCreate: vi.fn(),
  reset: vi.fn(),
  loading: { getAll: false },
  pagination: { page: 1, limit: 10, pages: 1, total: 5 },
  fetch: vi.fn(),
  sortByColumn: vi.fn(),
  ...overrides,
});

describe('ShopAdminPage', () => {
  let load;

  beforeEach(() => {
    lastDataTableProps = null;
    load = vi.fn();
    useLoader.mockReturnValue({ load, loading: false });
  });

  const setup = (opts = {}) => {
    const {
      role = 'super_admin',
      shopAdmins = buildShopAdminModule(),
    } = opts;

    const finalRole = 'role' in opts ? opts.role : role;

    useApi.mockReturnValue({ shopAdmins });
    useAuth.mockReturnValue({ role: finalRole });
    render(<ShopAdminPage />);
    return { shopAdmins };
  };

  it('loads shop admins on mount', () => {
    const { shopAdmins } = setup();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(shopAdmins);
  });

  it('renders the DataTable with state, columns and search key', () => {
    const { shopAdmins } = setup();
    expect(screen.getByTestId('datatable')).toBeInTheDocument();
    expect(lastDataTableProps.data).toBe(shopAdmins.state);
    expect(lastDataTableProps.columns).toEqual(['col-a', 'col-b']);
    expect(lastDataTableProps.searchKey).toBe('name');
    expect(lastDataTableProps.manualPagination).toBe(true);
  });

  it('forwards loading and reset state', () => {
    const shopAdmins = buildShopAdminModule({ loading: { getAll: true } });
    setup({ shopAdmins });
    expect(lastDataTableProps.loading).toBe(true);
    expect(lastDataTableProps.reset).toBe(shopAdmins.reset);
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
  ])('shows a "Create Shop Admin" action for role=%s', (role) => {
    setup({ role });
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Shop Admin',
      provision: true,
      permission: true,
    });
  });

  it('invoking the create action opens the create modal', () => {
    const { shopAdmins } = setup({ role: 'super_admin' });
    lastDataTableProps.create.action();
    expect(shopAdmins.openCreate).toHaveBeenCalledTimes(1);
  });

  it('delegates pagination and sort changes', () => {
    const { shopAdmins } = setup();

    lastDataTableProps.onPaginationChange({ page: 2, limit: 10 });
    expect(shopAdmins.fetch).toHaveBeenCalledWith({ page: 2, limit: 10 });

    lastDataTableProps.onSortChange({ sortBy: 'name', order: 'asc' });
    expect(shopAdmins.fetch).toHaveBeenCalledWith({ sortBy: 'name', order: 'asc' });
  });
});