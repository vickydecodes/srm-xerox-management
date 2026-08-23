/**
 * tests/pages/bill.test.jsx
 *
 * Integration test for pages/bill/bill.jsx.
 * DataTable is mocked to a minimal stub (it has its own dedicated test at
 * test/components/ui/datatable.test.jsx); this file only verifies the page
 * wires the bills module correctly into it: loading-on-mount, filters
 * (including the "Status" custom filter group), pagination/sort callbacks
 * and reset.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Bill from '@/pages/bill/bill';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@/components/ui/datatable', () => ({
  default: ({ data, loading, create, filters = [], customs = [], reset, onPaginationChange, onSortChange }) => (
    <div data-testid="datatable-mock">
      <span data-testid="row-count">{Array.isArray(data) ? data.length : 0}</span>
      {loading && <span>Loading rows…</span>}
      {create?.label ? <button onClick={create.action}>{create.label}</button> : null}
      {filters.map((f) => (
        <button key={f.label} onClick={() => f.action({ page: 1, limit: 10 })}>
          {f.label}
        </button>
      ))}
      {customs.map((group) =>
        group.filters.map((f) => (
          <button key={`${group.title}-${f.label}`} onClick={() => f.action({ type: 'click' })}>
            {f.label}
          </button>
        ))
      )}
      <button onClick={() => onPaginationChange?.({ page: 2, limit: 10, __replace: true })}>
        go-to-page-2
      </button>
      <button onClick={() => onSortChange?.({ sortBy: 'total', order: 'desc', __replace: true })}>
        sort-by-total
      </button>
      <button onClick={reset}>reset-table</button>
    </div>
  ),
}));

const billsState = {
  useBillColumns: vi.fn(() => []),
  state: [],
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
    descending: vi.fn(),
    ascending: vi.fn(),
    filterByField: vi.fn(),
  },
  reset: vi.fn(),
  loading: { getAll: false },
  pagination: { page: 1, limit: 10, pages: 1, total: 0 },
  fetch: vi.fn(),
  getQuery: vi.fn(() => ({})),
  sortByColumn: vi.fn(),
};

vi.mock('@/core/contexts/api.context', () => ({
  useApi: () => ({ bills: billsState }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  billsState.state = [];
  billsState.loading = { getAll: false };
  billsState.pagination = { page: 1, limit: 10, pages: 1, total: 0 };
});

describe('Bill page', () => {
  it('loads bills on mount when the list is empty', () => {
    render(<Bill />);

    expect(billsState.fetch).toHaveBeenCalledWith(null);
  });

  it('does not refetch when bills are already loaded', () => {
    billsState.state = [{ _id: 'b1' }];

    render(<Bill />);

    expect(billsState.fetch).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while bills.loading.getAll is true', () => {
    billsState.loading = { getAll: true };

    render(<Bill />);

    expect(screen.getByText(/loading rows/i)).toBeInTheDocument();
  });

  it('does not render a create button (bills are only created via Bill Creation)', () => {
    render(<Bill />);

    expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
  });

  it('renders the row count from bills.state', () => {
    billsState.state = [{ _id: 'b1' }, { _id: 'b2' }, { _id: 'b3' }];

    render(<Bill />);

    expect(screen.getByTestId('row-count')).toHaveTextContent('3');
  });

  it.each([
    ['Latest', 'latest'],
    ['Oldest', 'oldest'],
  ])('wires the "%s" filter to bills.filters.%s', async (label, method) => {
    const user = userEvent.setup();
    render(<Bill />);

    await user.click(screen.getByRole('button', { name: label }));

    expect(billsState.filters[method]).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('wires "Highest Amount" to descending("total", ...)', async () => {
    const user = userEvent.setup();
    render(<Bill />);

    await user.click(screen.getByRole('button', { name: /highest amount/i }));

    expect(billsState.filters.descending).toHaveBeenCalledWith('total', { page: 1, limit: 10 });
  });

  it('wires "Lowest Amount" to ascending("total", ...)', async () => {
    const user = userEvent.setup();
    render(<Bill />);

    await user.click(screen.getByRole('button', { name: /lowest amount/i }));

    expect(billsState.filters.ascending).toHaveBeenCalledWith('total', { page: 1, limit: 10 });
  });

  it.each([
    ['Paid', 'PAID'],
    ['Unpaid', 'UNPAID'],
    ['Cancelled', 'CANCELLED'],
  ])('wires the Status > %s custom filter to filterByField("status", "%s")', async (label, statusValue) => {
    const user = userEvent.setup();
    render(<Bill />);

    await user.click(screen.getByRole('button', { name: label }));

    expect(billsState.filters.filterByField).toHaveBeenCalledWith('status', statusValue);
  });

  it('fetches with merged query params when pagination changes', async () => {
    const user = userEvent.setup();
    render(<Bill />);

    await user.click(screen.getByRole('button', { name: /go-to-page-2/i }));

    expect(billsState.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('re-sorts via sortByColumn when a replace-style sort change occurs', async () => {
    const user = userEvent.setup();
    render(<Bill />);

    await user.click(screen.getByRole('button', { name: /sort-by-total/i }));

    // Page calls sortByColumn(sortBy, order) — limit is not passed (undefined)
    expect(billsState.sortByColumn).toHaveBeenCalledWith('total', 'desc', undefined);
  });

  it('calls bills.reset when the table reset action fires', async () => {
    const user = userEvent.setup();
    render(<Bill />);

    await user.click(screen.getByRole('button', { name: /reset-table/i }));

    expect(billsState.reset).toHaveBeenCalled();
  });
});