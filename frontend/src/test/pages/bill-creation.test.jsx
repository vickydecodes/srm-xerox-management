/**
 * tests/pages/bill-creation.test.jsx
 *
 * Integration test for pages/bill-creation/bill-creation.jsx.
 * The heavy BillForm module is mocked out (it has its own dedicated test at
 * test/modules/bill.form.test.jsx) — this file only exercises the page's own
 * wiring: prefill logic (edit / order / order-store), module preloading,
 * submit handling, and navigation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import BillCreation from '@/pages/bill-creation/bill-creation';
import { useBillStore } from '@/modules/bill/bill.store';
import { defaultBillValues } from '@/modules/bill/bill.schema';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
let mockLocation = { pathname: '/super_admin/bill-creation', search: '', state: null };

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

const authState = { user: { _id: 'u1', role: 'super_admin' } };
vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => authState,
}));

const apiState = {
  inventoryProducts: { state: [], fetch: vi.fn() },
  services: { state: [], fetch: vi.fn() },
  bills: {
    create: vi.fn(),
    crud: { edit: vi.fn() },
    loading: { create: false, edit: false },
  },
  orders: { crud: { getOne: vi.fn() } },
};

vi.mock('@/core/contexts/api.context', () => ({
  useApi: () => apiState,
}));

vi.mock('@/modules/bill/bill.coulmns', () => ({
  printBillPdf: vi.fn(),
}));

vi.mock('@/modules/bill/bill.form', () => ({
  BillForm: ({ defaultValues, onSubmit, isEdit, orderContext, loading }) => (
    <div data-testid="bill-form-mock">
      <span data-testid="is-edit">{String(isEdit)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="default-values">{JSON.stringify(defaultValues)}</span>
      <span data-testid="order-context">{JSON.stringify(orderContext)}</span>
      <button onClick={() => onSubmit(defaultValues)}>submit-bill-form</button>
    </div>
  ),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <BillCreation />
    </MemoryRouter>
  );

beforeEach(async () => {
  vi.clearAllMocks();
  mockLocation = { pathname: '/super_admin/bill-creation', search: '', state: null };
  authState.user = { _id: 'u1', role: 'super_admin' };
  apiState.inventoryProducts.fetch = vi.fn();
  apiState.services.fetch = vi.fn();
  apiState.bills.create = vi.fn();
  apiState.bills.crud.edit = vi.fn();
  apiState.orders.crud.getOne = vi.fn();

  const { printBillPdf } = await import('@/modules/bill/bill.coulmns');
  printBillPdf.mockClear();

  useBillStore.setState({ current: null, list: [] });
});

describe('BillCreation page', () => {
  it('renders the create heading with default form values when there is nothing to prefill', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /create bill/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel edit/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('default-values')).toHaveTextContent(
      JSON.stringify(defaultBillValues)
    );
  });

  it('preloads inventory products and services on mount', () => {
    renderPage();

    expect(apiState.inventoryProducts.fetch).toHaveBeenCalledWith({ full: true });
    expect(apiState.services.fetch).toHaveBeenCalledWith({ full: true });
  });

  it('switches to edit mode via the usePageAction "edit" handler from router state', () => {
    mockLocation = {
      pathname: '/super_admin/bill-creation',
      search: '',
      state: {
        type: 'edit',
        payload: {
          _id: 'bill-1',
          code: 'INV-100',
          paymentMethod: 'CASH',
          status: 'PAID',
          branch: 'branch-1',
          department: 'dept-1',
          discount: 10,
          tax: 5,
          items: [{ type: 'Service', item: 'svc-1', name: 'Print', quantity: 2, price: 20 }],
          order: { code: 'ORD-1', purpose: 'Office copies' },
        },
      },
    };

    renderPage();

    expect(screen.getByRole('heading', { name: /edit bill - inv-100/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument();
    expect(screen.getByTestId('is-edit')).toHaveTextContent('true');

    const values = JSON.parse(screen.getByTestId('default-values').textContent);
    expect(values.paymentMethod).toBe('cash');
    expect(values.status).toBe('paid');
    expect(values.branch).toBe('branch-1');
    expect(values.items).toHaveLength(1);
  });

  it('prefills from an order in the URL (?orderId=...) when nothing else is editing', async () => {
    mockLocation = { pathname: '/super_admin/bill-creation', search: '?orderId=order-9', state: null };
    apiState.orders.crud.getOne.mockResolvedValue({
      _id: 'order-9',
      code: 'ORD-9',
      purpose: 'Binding batch',
      branch: { _id: 'branch-2', name: 'Main Branch' },
      department: { _id: 'dept-2', name: 'Print Shop' },
      items: [{ type: 'InventoryProduct', item: { _id: 'prod-1' }, name: 'Paper Ream', quantity: 3, price: 15 }],
    });

    renderPage();

    await waitFor(() => {
      expect(apiState.orders.crud.getOne).toHaveBeenCalledWith('order-9');
    });

    const values = JSON.parse(await (await screen.findByTestId('default-values')).textContent);
    expect(values.paymentMethod).toBe('credit');
    expect(values.status).toBe('unpaid');
    expect(values.order).toBe('order-9');
    expect(values.items).toEqual([
      { type: 'InventoryProduct', item: 'prod-1', name: 'Paper Ream', quantity: 3, price: 15 },
    ]);

    const orderContext = JSON.parse(screen.getByTestId('order-context').textContent);
    expect(orderContext).toEqual({
      code: 'ORD-9',
      purpose: 'Binding batch',
      branchName: 'Main Branch',
      departmentName: 'Print Shop',
    });
  });

  it('prefills from the bill store\'s "current" order (set by the Order page) and clears it after', () => {
    useBillStore.setState({
      current: {
        _id: 'order-current-1',
        code: 'ORD-CUR-1',
        purpose: 'Currently pending order',
        branch: 'branch-3',
        department: 'dept-3',
        items: [{ type: 'Service', item: 'svc-2', name: 'Lamination', quantity: 1, price: 40 }],
      },
    });

    renderPage();

    const values = JSON.parse(screen.getByTestId('default-values').textContent);
    expect(values.paymentMethod).toBe('credit');
    expect(values.order).toBe('order-current-1');

    expect(useBillStore.getState().current).toBeNull();
  });

  it('creates a new bill, prints it, and navigates to the bill list', async () => {
    apiState.bills.create.mockResolvedValue({ _id: 'new-bill-1', code: 'INV-200' });
    const { printBillPdf } = await import('@/modules/bill/bill.coulmns');
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: /submit-bill-form/i }));

    await waitFor(() => {
      expect(apiState.bills.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: defaultBillValues.paymentMethod.toUpperCase(),
          status: defaultBillValues.status.toUpperCase(),
        })
      );
    });
    expect(printBillPdf).toHaveBeenCalledWith('new-bill-1', 'INV-200');
    expect(mockNavigate).toHaveBeenCalledWith('/super_admin/bill');
  });

  it('updates an existing bill and navigates to the bill list', async () => {
    mockLocation = {
      pathname: '/super_admin/bill-creation',
      search: '',
      state: {
        type: 'edit',
        payload: {
          _id: 'bill-77',
          code: 'INV-77',
          paymentMethod: 'CASH',
          status: 'PAID',
          items: [],
        },
      },
    };
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: /submit-bill-form/i }));

    await waitFor(() => {
      expect(apiState.bills.crud.edit).toHaveBeenCalledWith(
        'bill-77',
        expect.objectContaining({ paymentMethod: 'CASH', status: 'PAID' })
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/super_admin/bills');
  });

  it('navigates away without saving when "Cancel Edit" is clicked', async () => {
    mockLocation = {
      pathname: '/super_admin/bill-creation',
      search: '',
      state: { type: 'edit', payload: { _id: 'bill-5', code: 'INV-5', items: [] } },
    };
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole('button', { name: /cancel edit/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/super_admin/bills');
    expect(apiState.bills.crud.edit).not.toHaveBeenCalled();
  });
});