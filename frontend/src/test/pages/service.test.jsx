/**
 * test/pages/service.test.jsx
 *
 * Covers pages/service/service.jsx (Service page).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import Service from '@/pages/service/service';
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

const buildServicesModule = (overrides = {}) => ({
  state: [{ _id: '1', name: 'Spiral Binding' }],
  useServiceColumns: vi.fn(() => ['col-a', 'col-b']),
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
    ascending: vi.fn(),
    descending: vi.fn(),
    filterByField: vi.fn(),
  },
  openCreate: vi.fn(),
  reset: vi.fn(),
  loading: { getAll: false },
  pagination: { page: 1, limit: 10, pages: 1, total: 6 },
  fetch: vi.fn(),
  ...overrides,
});

describe('Service page', () => {
  let load;

  beforeEach(() => {
    lastDataTableProps = null;
    load = vi.fn();
    useLoader.mockReturnValue({ load, loading: false });
  });

  const setup = (services = buildServicesModule()) => {
    useApi.mockReturnValue({ services });
    render(<Service />);
    return services;
  };

  it('loads services on mount', () => {
    const services = setup();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(services);
  });

  it('renders the DataTable with service state, columns and search key', () => {
    const services = setup();
    expect(screen.getByTestId('datatable')).toBeInTheDocument();
    expect(lastDataTableProps.data).toBe(services.state);
    expect(lastDataTableProps.columns).toEqual(['col-a', 'col-b']);
    expect(lastDataTableProps.searchKey).toBe('name');
    expect(lastDataTableProps.manualPagination).toBe(true);
  });

  it('always exposes an enabled "Create Service" action', () => {
    const services = setup();
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Service',
      provision: true,
      permission: true,
    });

    lastDataTableProps.create.action();
    expect(services.openCreate).toHaveBeenCalledTimes(1);
  });

  it('forwards pagination and loading state', () => {
    const services = setup(buildServicesModule({ loading: { getAll: true } }));
    expect(lastDataTableProps.loading).toBe(true);
    expect(lastDataTableProps.page).toBe(services.pagination.page);
    expect(lastDataTableProps.limit).toBe(services.pagination.limit);
    expect(lastDataTableProps.pageCount).toBe(services.pagination.pages);
    expect(lastDataTableProps.totalRows).toBe(services.pagination.total);
  });

  it('exposes sort filters (Latest/Oldest/A-Z/Z-A) that delegate to the module', () => {
    const services = setup();
    const byLabel = (label) => lastDataTableProps.filters.find((f) => f.label === label);

    byLabel('Latest').action('f');
    expect(services.filters.latest).toHaveBeenCalledWith('f');

    byLabel('Oldest').action('f');
    expect(services.filters.oldest).toHaveBeenCalledWith('f');

    byLabel('A - Z').action('f');
    expect(services.filters.ascending).toHaveBeenCalledWith('name', 'f');

    byLabel('Z - A').action('f');
    expect(services.filters.descending).toHaveBeenCalledWith('name', 'f');
  });

  it('exposes an Active/Inactive Status custom filter group', () => {
    const services = setup();
    const [statusGroup] = lastDataTableProps.customs;
    expect(statusGroup.title).toBe('Status');

    statusGroup.filters.find((f) => f.label === 'Active').action();
    expect(services.filters.filterByField).toHaveBeenCalledWith('active', true);

    statusGroup.filters.find((f) => f.label === 'Inactive').action();
    expect(services.filters.filterByField).toHaveBeenCalledWith('active', false);
  });

  it('delegates pagination and sort changes to the services module', () => {
    const services = setup();

    lastDataTableProps.onPaginationChange({ page: 2, limit: 10 });
    expect(services.fetch).toHaveBeenCalledWith({ page: 2, limit: 10 });

    lastDataTableProps.onSortChange({ sortBy: 'name', order: 'asc' });
    expect(services.fetch).toHaveBeenCalledWith({ sortBy: 'name', order: 'asc' });
  });
});