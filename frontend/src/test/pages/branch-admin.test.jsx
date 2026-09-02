/**
 * tests/pages/branch-admin.test.jsx
 *
 * Integration test for pages/branch-admin/branch-admin.jsx.
 * DataTable is mocked; this file verifies the page wires the branchAdmins
 * module correctly: loading-on-mount, the "Create Branch Admin" action, the
 * Active/Inactive status filters, pagination/sort callbacks and reset.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BranchAdmin from '@/pages/branch-admin/branch-admin';

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
      <button onClick={() => onSortChange?.({ sortBy: 'name', order: 'desc', __replace: true })}>
        sort-by-name
      </button>
      <button onClick={reset}>reset-table</button>
    </div>
  ),
}));

const branchAdminsState = {
  useBranchAdminColumns: vi.fn(() => []),
  state: [],
  filters: {
    filterByStatus: vi.fn(),
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
  useApi: () => ({ branchAdmins: branchAdminsState }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  branchAdminsState.state = [];
  branchAdminsState.loading = { getAll: false };
  branchAdminsState.pagination = { page: 1, limit: 10, pages: 1, total: 0 };
});

describe('BranchAdmin page', () => {
  it('loads branch admins on mount when the list is empty', () => {
    render(<BranchAdmin />);

    expect(branchAdminsState.fetch).toHaveBeenCalledWith(null);
  });

  it('does not refetch when branch admins are already loaded', () => {
    branchAdminsState.state = [{ _id: 'a1' }];

    render(<BranchAdmin />);

    expect(branchAdminsState.fetch).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while branchAdmins.loading.getAll is true', () => {
    branchAdminsState.loading = { getAll: true };

    render(<BranchAdmin />);

    expect(screen.getByText(/loading rows/i)).toBeInTheDocument();
  });

  it('opens the create modal via the "Create Branch Admin" action', async () => {
    const user = userEvent.setup();
    render(<BranchAdmin />);

    await user.click(screen.getByRole('button', { name: /create branch admin/i }));

    expect(branchAdminsState.openCreate).toHaveBeenCalled();
  });

  it('renders the row count from branchAdmins.state', () => {
    branchAdminsState.state = [{ _id: 'a1' }, { _id: 'a2' }, { _id: 'a3' }];

    render(<BranchAdmin />);

    expect(screen.getByTestId('row-count')).toHaveTextContent('3');
  });

  it('wires "Active" to filterByStatus(true)', async () => {
    const user = userEvent.setup();
    render(<BranchAdmin />);

    await user.click(screen.getByRole('button', { name: /^active$/i }));

    expect(branchAdminsState.filters.filterByStatus).toHaveBeenCalledWith(true);
  });

  it('wires "Inactive" to filterByStatus(false)', async () => {
    const user = userEvent.setup();
    render(<BranchAdmin />);

    await user.click(screen.getByRole('button', { name: /^inactive$/i }));

    expect(branchAdminsState.filters.filterByStatus).toHaveBeenCalledWith(false);
  });

  it('does not throw when filterByStatus is not implemented on the module', async () => {
    branchAdminsState.filters.filterByStatus = undefined;
    const user = userEvent.setup();
    render(<BranchAdmin />);

    await expect(
      user.click(screen.getByRole('button', { name: /^active$/i }))
    ).resolves.not.toThrow();
  });

  it('fetches with merged query params when pagination changes', async () => {
    const user = userEvent.setup();
    render(<BranchAdmin />);

    await user.click(screen.getByRole('button', { name: /go-to-page-2/i }));

    expect(branchAdminsState.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('re-sorts via sortByColumn when a replace-style sort change occurs', async () => {
    const user = userEvent.setup();
    render(<BranchAdmin />);

    await user.click(screen.getByRole('button', { name: /sort-by-name/i }));

    // Page calls sortByColumn(sortBy, order) — limit is not passed (undefined)
    expect(branchAdminsState.sortByColumn).toHaveBeenCalledWith('name', 'desc', undefined);
  });

  it('calls branchAdmins.reset when the table reset action fires', async () => {
    const user = userEvent.setup();
    render(<BranchAdmin />);

    await user.click(screen.getByRole('button', { name: /reset-table/i }));

    expect(branchAdminsState.reset).toHaveBeenCalled();
  });
});