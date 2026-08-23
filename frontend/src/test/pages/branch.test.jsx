/**
 * tests/pages/branch.test.jsx
 *
 * Integration test for pages/branch/branch.jsx.
 * DataTable is mocked (see test/components/ui/datatable.test.jsx for its
 * own unit test); this file verifies the page wires the branches module
 * correctly: loading-on-mount, the "Create Branch" action, sort filters,
 * pagination/sort callbacks and reset.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Branch from '@/pages/branch/branch';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@/components/ui/datatable', () => ({
  default: ({ data, loading, create, filters = [], reset, onPaginationChange, onSortChange }) => (
    <div data-testid="datatable-mock">
      <span data-testid="row-count">{Array.isArray(data) ? data.length : 0}</span>
      {loading && <span>Loading rows…</span>}
      {create?.label ? <button onClick={create.action}>{create.label}</button> : null}
      {filters.map((f) => (
        <button key={f.label} onClick={() => f.action({ page: 1, limit: 10 })}>
          {f.label}
        </button>
      ))}
      <button onClick={() => onPaginationChange?.({ page: 2, limit: 10, __replace: true })}>
        go-to-page-2
      </button>
      <button onClick={() => onSortChange?.({ sortBy: 'name', order: 'asc', __replace: true })}>
        sort-by-name
      </button>
      <button onClick={reset}>reset-table</button>
    </div>
  ),
}));

const branchesState = {
  useBranchColumns: vi.fn(() => []),
  state: [],
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
    ascending: vi.fn(),
    descending: vi.fn(),
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
  useApi: () => ({ branches: branchesState }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  branchesState.state = [];
  branchesState.loading = { getAll: false };
  branchesState.pagination = { page: 1, limit: 10, pages: 1, total: 0 };
});

describe('Branch page', () => {
  it('loads branches on mount when the list is empty', () => {
    render(<Branch />);

    expect(branchesState.fetch).toHaveBeenCalledWith(null);
  });

  it('does not refetch when branches are already loaded', () => {
    branchesState.state = [{ _id: 'b1' }];

    render(<Branch />);

    expect(branchesState.fetch).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while branches.loading.getAll is true', () => {
    branchesState.loading = { getAll: true };

    render(<Branch />);

    expect(screen.getByText(/loading rows/i)).toBeInTheDocument();
  });

  it('opens the create-branch modal via the "Create Branch" action', async () => {
    const user = userEvent.setup();
    render(<Branch />);

    await user.click(screen.getByRole('button', { name: /create branch/i }));

    expect(branchesState.openCreate).toHaveBeenCalled();
  });

  it('renders the row count from branches.state', () => {
    branchesState.state = [{ _id: 'b1' }, { _id: 'b2' }];

    render(<Branch />);

    expect(screen.getByTestId('row-count')).toHaveTextContent('2');
  });

  it.each([
    ['Latest', 'latest'],
    ['Oldest', 'oldest'],
  ])('wires the "%s" filter to branches.filters.%s', async (label, method) => {
    const user = userEvent.setup();
    render(<Branch />);

    await user.click(screen.getByRole('button', { name: label }));

    expect(branchesState.filters[method]).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('wires "A - Z" to ascending("name")', async () => {
    const user = userEvent.setup();
    render(<Branch />);

    await user.click(screen.getByRole('button', { name: /a - z/i }));

    expect(branchesState.filters.ascending).toHaveBeenCalledWith('name');
  });

  it('wires "Z - A" to descending("name")', async () => {
    const user = userEvent.setup();
    render(<Branch />);

    await user.click(screen.getByRole('button', { name: /z - a/i }));

    expect(branchesState.filters.descending).toHaveBeenCalledWith('name');
  });

  it('fetches with merged query params when pagination changes', async () => {
    const user = userEvent.setup();
    render(<Branch />);

    await user.click(screen.getByRole('button', { name: /go-to-page-2/i }));

    expect(branchesState.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('re-sorts via sortByColumn when a replace-style sort change occurs', async () => {
    const user = userEvent.setup();
    render(<Branch />);

    await user.click(screen.getByRole('button', { name: /sort-by-name/i }));

    // Page calls sortByColumn(sortBy, order) — limit is not passed (undefined)
    expect(branchesState.sortByColumn).toHaveBeenCalledWith('name', 'asc', undefined);
  });

  it('calls branches.reset when the table reset action fires', async () => {
    const user = userEvent.setup();
    render(<Branch />);

    await user.click(screen.getByRole('button', { name: /reset-table/i }));

    expect(branchesState.reset).toHaveBeenCalled();
  });
});