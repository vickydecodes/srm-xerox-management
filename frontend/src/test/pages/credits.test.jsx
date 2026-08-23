/**
 * tests/pages/credits.test.jsx
 *
 * Integration test for pages/credits/credits.jsx.
 * DataTable is mocked; this file verifies the page wires the credits
 * module correctly: loading-on-mount, the "Create New Credit" action, the
 * Latest/Oldest filters, pagination/sort callbacks and reset.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Credits from '@/pages/credits/credits';

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
      <button onClick={() => onSortChange?.({ sortBy: 'amount', order: 'desc', __replace: true })}>
        sort-by-amount
      </button>
      <button onClick={reset}>reset-table</button>
    </div>
  ),
}));

const creditsState = {
  useCreditColumns: vi.fn(() => []),
  state: [],
  filters: {
    latest: vi.fn(),
    oldest: vi.fn(),
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
  useApi: () => ({ credits: creditsState }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  creditsState.state = [];
  creditsState.loading = { getAll: false };
  creditsState.pagination = { page: 1, limit: 10, pages: 1, total: 0 };
});

describe('Credits page', () => {
  it('loads credits on mount when the list is empty', () => {
    render(<Credits />);

    expect(creditsState.fetch).toHaveBeenCalledWith(null);
  });

  it('does not refetch when credits are already loaded', () => {
    creditsState.state = [{ _id: 'c1' }];

    render(<Credits />);

    expect(creditsState.fetch).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while credits.loading.getAll is true', () => {
    creditsState.loading = { getAll: true };

    render(<Credits />);

    expect(screen.getByText(/loading rows/i)).toBeInTheDocument();
  });

  it('opens the create modal via the "Create New Credit" action', async () => {
    const user = userEvent.setup();
    render(<Credits />);

    await user.click(screen.getByRole('button', { name: /create new credit/i }));

    expect(creditsState.openCreate).toHaveBeenCalled();
  });

  it('renders the row count from credits.state', () => {
    creditsState.state = [{ _id: 'c1' }, { _id: 'c2' }];

    render(<Credits />);

    expect(screen.getByTestId('row-count')).toHaveTextContent('2');
  });

  it.each([
    ['Latest', 'latest'],
    ['Oldest', 'oldest'],
  ])('wires the "%s" filter to credits.filters.%s', async (label, method) => {
    const user = userEvent.setup();
    render(<Credits />);

    await user.click(screen.getByRole('button', { name: label }));

    expect(creditsState.filters[method]).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('fetches with merged query params when pagination changes', async () => {
    const user = userEvent.setup();
    render(<Credits />);

    await user.click(screen.getByRole('button', { name: /go-to-page-2/i }));

    expect(creditsState.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('re-sorts via sortByColumn when a replace-style sort change occurs', async () => {
    const user = userEvent.setup();
    render(<Credits />);

    await user.click(screen.getByRole('button', { name: /sort-by-amount/i }));

    // Page calls sortByColumn(sortBy, order) — limit is not passed (undefined)
    expect(creditsState.sortByColumn).toHaveBeenCalledWith('amount', 'desc', undefined);
  });

  it('calls credits.reset when the table reset action fires', async () => {
    const user = userEvent.setup();
    render(<Credits />);

    await user.click(screen.getByRole('button', { name: /reset-table/i }));

    expect(creditsState.reset).toHaveBeenCalled();
  });
});