import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Manager from '@/pages/manager/manager';

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

const managersState = {
  useManagerColumns: vi.fn(() => []),
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
  useApi: () => ({ managers: managersState }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  managersState.state = [];
  managersState.loading = { getAll: false };
  managersState.pagination = { page: 1, limit: 10, pages: 1, total: 0 };
});

describe('Manager page', () => {
  it('loads managers on mount when the list is empty', () => {
    render(<Manager />);

    expect(managersState.fetch).toHaveBeenCalledWith(null);
  });

  it('does not refetch when managers are already loaded', () => {
    managersState.state = [{ _id: 'm1' }];

    render(<Manager />);

    expect(managersState.fetch).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while managers.loading.getAll is true', () => {
    managersState.loading = { getAll: true };

    render(<Manager />);

    expect(screen.getByText('Loading rows…')).toBeInTheDocument();
  });

  it('renders a button that opens the Create Manager modal', async () => {
    const user = userEvent.setup();
    render(<Manager />);

    const createButton = screen.getByRole('button', {
      name: 'Create Manager',
    });
    expect(createButton).toBeInTheDocument();

    await user.click(createButton);
    expect(managersState.openCreate).toHaveBeenCalled();
  });

  it('renders the row count from managers.state', () => {
    managersState.state = [{ _id: 'm1' }, { _id: 'm2' }, { _id: 'm3' }];

    render(<Manager />);

    expect(screen.getByTestId('row-count')).toHaveTextContent('3');
  });

  it('forwards the Active filter click to managers.filters.filterByStatus', async () => {
    const user = userEvent.setup();
    render(<Manager />);

    await user.click(screen.getByRole('button', { name: 'Active' }));
    expect(managersState.filters.filterByStatus).toHaveBeenCalledWith(true);
  });

  it('forwards the Inactive filter click to managers.filters.filterByStatus', async () => {
    const user = userEvent.setup();
    render(<Manager />);

    await user.click(screen.getByRole('button', { name: 'Inactive' }));
    expect(managersState.filters.filterByStatus).toHaveBeenCalledWith(false);
  });

  it('calls managers.reset when the table reset action fires', async () => {
    const user = userEvent.setup();
    render(<Manager />);

    await user.click(screen.getByRole('button', { name: 'reset-table' }));
    expect(managersState.reset).toHaveBeenCalled();
  });
});
