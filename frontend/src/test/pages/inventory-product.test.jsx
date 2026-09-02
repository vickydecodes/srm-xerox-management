/**
 * test/pages/inventory-product.test.jsx
 *
 * Integration test for pages/inventory-product/inventory-product.jsx.
 * DataTable is mocked; asserts page wiring only.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InventoryProduct from '@/pages/inventory-product/inventory-product';

vi.mock('@/components/ui/datatable', () => ({
  default: ({
    data,
    loading,
    create,
    filters = [],
    customs = [],
    reset,
    onPaginationChange,
    onSortChange,
  }) => (
    <div data-testid="datatable-mock">
      <span data-testid="row-count">{Array.isArray(data) ? data.length : 0}</span>
      {loading && <span>Loading rows…</span>}
      {create?.label ? (
        <button type="button" onClick={create.action}>
          {create.label}
        </button>
      ) : null}
      {filters.map((f) => (
        <button
          key={f.label}
          type="button"
          onClick={() => f.action({ page: 1, limit: 10 })}
        >
          {f.label}
        </button>
      ))}
      {customs.map((group) =>
        (group.filters || []).map((f) => (
          <button key={`${group.title}-${f.label}`} type="button" onClick={() => f.action()}>
            {f.label}
          </button>
        ))
      )}
      <button
        type="button"
        onClick={() =>
          onPaginationChange?.({ page: 2, limit: 10, __replace: true })
        }
      >
        go-to-page-2
      </button>
      <button
        type="button"
        onClick={() =>
          onSortChange?.({ sortBy: 'quantity', order: 'asc', __replace: true })
        }
      >
        sort-by-quantity
      </button>
      <button type="button" onClick={reset}>
        reset-table
      </button>
    </div>
  ),
}));

const inventoryProductsState = {
  useInventoryProductColumns: vi.fn(() => []),
  state: [],
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
    ascending: vi.fn(),
    descending: vi.fn(),
    filterByField: vi.fn(),
  },
  reset: vi.fn(),
  openCreate: vi.fn(),
  loading: { getAll: false },
  pagination: { page: 1, limit: 10, pages: 1, total: 0 },
  fetch: vi.fn(),
  getQuery: vi.fn(() => ({})),
  sortByColumn: vi.fn(),
};

vi.mock('@/core/contexts/api.context', () => ({
  useApi: () => ({ inventoryProducts: inventoryProductsState }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  inventoryProductsState.state = [];
  inventoryProductsState.loading = { getAll: false };
  inventoryProductsState.pagination = { page: 1, limit: 10, pages: 1, total: 0 };
});

describe('InventoryProduct page', () => {
  it('renders the Inventory System Notice alert', () => {
    render(<InventoryProduct />);
    expect(screen.getByText(/inventory system notice/i)).toBeInTheDocument();
    expect(
      screen.getByText(/only one primary inventory is allowed/i)
    ).toBeInTheDocument();
  });

  it('loads inventory products on mount when the list is empty', () => {
    render(<InventoryProduct />);
    expect(inventoryProductsState.fetch).toHaveBeenCalledWith(null);
  });

  it('does not refetch when inventory products are already loaded', () => {
    inventoryProductsState.state = [{ _id: 'ip-1' }];
    render(<InventoryProduct />);
    expect(inventoryProductsState.fetch).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while loading.getAll is true', () => {
    inventoryProductsState.loading = { getAll: true };
    render(<InventoryProduct />);
    expect(screen.getByText(/loading rows/i)).toBeInTheDocument();
  });

  it('opens the create modal via Create Inventory Product', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(
      screen.getByRole('button', { name: /create inventory product/i })
    );
    expect(inventoryProductsState.openCreate).toHaveBeenCalled();
  });

  it('renders the row count from state', () => {
    inventoryProductsState.state = [{ _id: 'ip-1' }, { _id: 'ip-2' }];
    render(<InventoryProduct />);
    expect(screen.getByTestId('row-count')).toHaveTextContent('2');
  });

  it.each([
    ['Latest', 'latest'],
    ['Oldest', 'oldest'],
  ])('wires "%s" to filters.%s with page/limit', async (label, method) => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(screen.getByRole('button', { name: label }));
    expect(inventoryProductsState.filters[method]).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('wires Price: Low - High to ascending("price", f)', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(screen.getByRole('button', { name: /price: low - high/i }));
    expect(inventoryProductsState.filters.ascending).toHaveBeenCalledWith(
      'price',
      { page: 1, limit: 10 }
    );
  });

  it('wires Price: High - Low to descending("price", f)', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(screen.getByRole('button', { name: /price: high - low/i }));
    expect(inventoryProductsState.filters.descending).toHaveBeenCalledWith(
      'price',
      { page: 1, limit: 10 }
    );
  });

  it('wires Quantity: Low - High to ascending("quantity", f)', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(
      screen.getByRole('button', { name: /quantity: low - high/i })
    );
    expect(inventoryProductsState.filters.ascending).toHaveBeenCalledWith(
      'quantity',
      { page: 1, limit: 10 }
    );
  });

  it('wires Quantity: High - Low to descending("quantity", f)', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(
      screen.getByRole('button', { name: /quantity: high - low/i })
    );
    expect(inventoryProductsState.filters.descending).toHaveBeenCalledWith(
      'quantity',
      { page: 1, limit: 10 }
    );
  });

  it('wires Status Active to filterByField("active", true)', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(screen.getByRole('button', { name: /^active$/i }));
    expect(inventoryProductsState.filters.filterByField).toHaveBeenCalledWith(
      'active',
      true
    );
  });

  it('wires Status Inactive to filterByField("active", false)', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(screen.getByRole('button', { name: /^inactive$/i }));
    expect(inventoryProductsState.filters.filterByField).toHaveBeenCalledWith(
      'active',
      false
    );
  });

  it('fetches with merged query params when pagination changes', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(screen.getByRole('button', { name: /go-to-page-2/i }));
    expect(inventoryProductsState.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('re-sorts via sortByColumn when a replace-style sort change occurs', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(screen.getByRole('button', { name: /sort-by-quantity/i }));
    expect(inventoryProductsState.sortByColumn).toHaveBeenCalledWith(
      'quantity',
      'asc',
      undefined
    );
  });

  it('calls reset when the table reset action fires', async () => {
    const user = userEvent.setup();
    render(<InventoryProduct />);
    await user.click(screen.getByRole('button', { name: /reset-table/i }));
    expect(inventoryProductsState.reset).toHaveBeenCalled();
  });
});