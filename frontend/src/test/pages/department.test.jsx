/**
 * test/pages/department.test.jsx
 *
 * Integration test for pages/department/department.jsx.
 * DataTable is mocked; this file verifies the page wires the departments
 * module correctly (same strategy as bill/branch/credits tests).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Department from '@/pages/department/department';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@/components/ui/datatable', () => ({
  default: ({
    data,
    loading,
    create,
    filters = [],
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
          onSortChange?.({ sortBy: 'name', order: 'asc', __replace: true })
        }
      >
        sort-by-name
      </button>
      <button type="button" onClick={reset}>
        reset-table
      </button>
    </div>
  ),
}));

const departmentsState = {
  useDepartmentColumns: vi.fn(() => []),
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
  useApi: () => ({ departments: departmentsState }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  departmentsState.state = [];
  departmentsState.loading = { getAll: false };
  departmentsState.pagination = { page: 1, limit: 10, pages: 1, total: 0 };
});

describe('Department page', () => {
  it('loads departments on mount when the list is empty', () => {
    render(<Department />);
    expect(departmentsState.fetch).toHaveBeenCalledWith(null);
  });

  it('does not refetch when departments are already loaded', () => {
    departmentsState.state = [{ _id: 'd1' }];
    render(<Department />);
    expect(departmentsState.fetch).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while departments.loading.getAll is true', () => {
    departmentsState.loading = { getAll: true };
    render(<Department />);
    expect(screen.getByText(/loading rows/i)).toBeInTheDocument();
  });

  it('opens the create modal via the "Create Department" action', async () => {
    const user = userEvent.setup();
    render(<Department />);
    await user.click(screen.getByRole('button', { name: /create department/i }));
    expect(departmentsState.openCreate).toHaveBeenCalled();
  });

  it('renders the row count from departments.state', () => {
    departmentsState.state = [{ _id: 'd1' }, { _id: 'd2' }];
    render(<Department />);
    expect(screen.getByTestId('row-count')).toHaveTextContent('2');
  });

  it.each([
    ['Latest', 'latest'],
    ['Oldest', 'oldest'],
  ])('wires the "%s" filter to departments.filters.%s', async (label, method) => {
    const user = userEvent.setup();
    render(<Department />);
    await user.click(screen.getByRole('button', { name: label }));
    expect(departmentsState.filters[method]).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('wires "A - Z" to ascending("name")', async () => {
    const user = userEvent.setup();
    render(<Department />);
    await user.click(screen.getByRole('button', { name: /a - z/i }));
    expect(departmentsState.filters.ascending).toHaveBeenCalledWith('name');
  });

  it('wires "Z - A" to descending("name")', async () => {
    const user = userEvent.setup();
    render(<Department />);
    await user.click(screen.getByRole('button', { name: /z - a/i }));
    expect(departmentsState.filters.descending).toHaveBeenCalledWith('name');
  });

  it('fetches with merged query params when pagination changes', async () => {
    const user = userEvent.setup();
    render(<Department />);
    await user.click(screen.getByRole('button', { name: /go-to-page-2/i }));
    expect(departmentsState.fetch).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('re-sorts via sortByColumn when a replace-style sort change occurs', async () => {
    const user = userEvent.setup();
    render(<Department />);
    await user.click(screen.getByRole('button', { name: /sort-by-name/i }));
    // Page may pass limit as undefined (same as bill/branch/credits)
    expect(departmentsState.sortByColumn).toHaveBeenCalledWith(
      'name',
      'asc',
      undefined
    );
  });

  it('calls departments.reset when the table reset action fires', async () => {
    const user = userEvent.setup();
    render(<Department />);
    await user.click(screen.getByRole('button', { name: /reset-table/i }));
    expect(departmentsState.reset).toHaveBeenCalled();
  });
});