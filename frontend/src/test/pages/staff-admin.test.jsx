/**
 * test/pages/staff-admin.test.jsx
 *
 * Covers pages/staff-admin/staff-admin.jsx (Staff page). Unlike
 * order/product/service, this page has no client-side filter/custom
 * configs and never omits the create action.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import Staff from '@/pages/staff-admin/staff-admin';
import { useApi } from '@/core/contexts/api.context';
import { useLoader } from '@/core/hooks/useLoader';

vi.mock('@/core/contexts/api.context');
vi.mock('@/core/hooks/useLoader');

let lastDataTableProps = null;
vi.mock('@/components/ui/datatable', () => ({
  default: (props) => {
    lastDataTableProps = props;
    return <div data-testid="datatable" />;
  },
}));

const buildStaffsModule = (overrides = {}) => ({
  state: [{ _id: '1', name: 'Jane Staff' }],
  useStaffColumns: vi.fn(() => ['col-a', 'col-b']),
  openCreate: vi.fn(),
  reset: vi.fn(),
  loading: { getAll: false },
  pagination: { page: 1, limit: 10, pages: 1, total: 4 },
  fetch: vi.fn(),
  ...overrides,
});

describe('Staff (staff-admin) page', () => {
  let load;

  beforeEach(() => {
    lastDataTableProps = null;
    load = vi.fn();
    useLoader.mockReturnValue({ load, loading: false });
  });

  const setup = (staffs = buildStaffsModule()) => {
    useApi.mockReturnValue({ staffs });
    render(<Staff />);
    return staffs;
  };

  it('loads staff on mount', () => {
    const staffs = setup();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(staffs);
  });

  it('renders the DataTable with staff state, columns and search key', () => {
    const staffs = setup();
    expect(screen.getByTestId('datatable')).toBeInTheDocument();
    expect(lastDataTableProps.data).toBe(staffs.state);
    expect(lastDataTableProps.columns).toEqual(['col-a', 'col-b']);
    expect(lastDataTableProps.searchKey).toBe('name');
    expect(lastDataTableProps.manualPagination).toBe(true);
  });

  it('always exposes an enabled "Create Staff" action', () => {
    const staffs = setup();
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Staff',
      provision: true,
      permission: true,
    });

    lastDataTableProps.create.action();
    expect(staffs.openCreate).toHaveBeenCalledTimes(1);
  });

  it('forwards pagination, loading and reset state', () => {
    const staffs = setup(buildStaffsModule({ loading: { getAll: true } }));
    expect(lastDataTableProps.loading).toBe(true);
    expect(lastDataTableProps.limit).toBe(staffs.pagination.limit);
    expect(lastDataTableProps.pageCount).toBe(staffs.pagination.pages);
    expect(lastDataTableProps.totalRows).toBe(staffs.pagination.total);
    expect(lastDataTableProps.reset).toBe(staffs.reset);
  });

  it('does not define any filters or custom filter groups', () => {
    setup();
    expect(lastDataTableProps.filters).toBeUndefined();
    expect(lastDataTableProps.customs).toBeUndefined();
  });

  it('delegates pagination and sort changes to the staffs module', () => {
    const staffs = setup();

    lastDataTableProps.onPaginationChange({ page: 2, limit: 10 });
    expect(staffs.fetch).toHaveBeenCalledWith({ page: 2, limit: 10 });

    lastDataTableProps.onSortChange({ sortBy: 'name', order: 'asc' });
    expect(staffs.fetch).toHaveBeenCalledWith({ sortBy: 'name', order: 'asc' });
  });
});