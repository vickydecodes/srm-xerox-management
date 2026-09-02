/**
 * test/pages/product.test.jsx
 *
 * Covers pages/product/product.jsx (Product page).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import Product from '@/pages/product/product';
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

const buildProductsModule = (overrides = {}) => ({
  state: [{ _id: '1', name: 'A4 Paper Ream' }],
  useProductColumns: vi.fn(() => ['col-a', 'col-b']),
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
  pagination: { page: 1, limit: 10, pages: 2, total: 15 },
  fetch: vi.fn(),
  ...overrides,
});

describe('Product page', () => {
  let load;

  beforeEach(() => {
    lastDataTableProps = null;
    load = vi.fn();
    useLoader.mockReturnValue({ load, loading: false });
  });

  const setup = (products = buildProductsModule()) => {
    useApi.mockReturnValue({ products });
    render(<Product />);
    return products;
  };

  it('loads products on mount', () => {
    const products = setup();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(products);
  });

  it('renders the DataTable with product state, columns and search key', () => {
    const products = setup();
    expect(screen.getByTestId('datatable')).toBeInTheDocument();
    expect(lastDataTableProps.data).toBe(products.state);
    expect(lastDataTableProps.columns).toEqual(['col-a', 'col-b']);
    expect(lastDataTableProps.searchKey).toBe('name');
    expect(lastDataTableProps.manualPagination).toBe(true);
  });

  it('always exposes an enabled "Create Product" action', () => {
    const products = setup();
    expect(lastDataTableProps.create).toMatchObject({
      label: 'Create Product',
      provision: true,
      permission: true,
    });

    lastDataTableProps.create.action();
    expect(products.openCreate).toHaveBeenCalledTimes(1);
  });

  it('forwards pagination and loading state', () => {
    const products = setup(buildProductsModule({ loading: { getAll: true } }));
    expect(lastDataTableProps.loading).toBe(true);
    expect(lastDataTableProps.page).toBe(products.pagination.page);
    expect(lastDataTableProps.limit).toBe(products.pagination.limit);
    expect(lastDataTableProps.pageCount).toBe(products.pagination.pages);
    expect(lastDataTableProps.totalRows).toBe(products.pagination.total);
  });

  it('exposes sort filters (Latest/Oldest/A-Z/Z-A) that delegate to the module', () => {
    const products = setup();
    const byLabel = (label) => lastDataTableProps.filters.find((f) => f.label === label);

    byLabel('Latest').action('f');
    expect(products.filters.latest).toHaveBeenCalledWith('f');

    byLabel('Oldest').action('f');
    expect(products.filters.oldest).toHaveBeenCalledWith('f');

    byLabel('A - Z').action('f');
    expect(products.filters.ascending).toHaveBeenCalledWith('name', 'f');

    byLabel('Z - A').action('f');
    expect(products.filters.descending).toHaveBeenCalledWith('name', 'f');
  });

  it('exposes an Active/Inactive Status custom filter group', () => {
    const products = setup();
    const [statusGroup] = lastDataTableProps.customs;
    expect(statusGroup.title).toBe('Status');

    statusGroup.filters.find((f) => f.label === 'Active').action();
    expect(products.filters.filterByField).toHaveBeenCalledWith('active', true);

    statusGroup.filters.find((f) => f.label === 'Inactive').action();
    expect(products.filters.filterByField).toHaveBeenCalledWith('active', false);
  });

  it('delegates pagination and sort changes to the products module', () => {
    const products = setup();

    lastDataTableProps.onPaginationChange({ page: 2, limit: 10 });
    expect(products.fetch).toHaveBeenCalledWith({ page: 2, limit: 10 });

    lastDataTableProps.onSortChange({ sortBy: 'name', order: 'desc' });
    expect(products.fetch).toHaveBeenCalledWith({ sortBy: 'name', order: 'desc' });
  });
});