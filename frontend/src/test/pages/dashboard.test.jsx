/**
 * tests/pages/dashboard.test.jsx
 *
 * Integration test for the role-aware Dashboard router
 * (pages/dashboard/dashboard.jsx) and the five role-specific dashboards it
 * renders (sa/ba/da/shop/staff.dashboard.jsx).
 *
 * AuthContext, ApiContext, sonner and recharts are mocked; everything else
 * (including the real sub-dashboard components) renders for real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import Dashboard from '@/pages/dashboard/dashboard';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// recharts needs real layout (ResizeObserver measurements) to render its
// children; jsdom always reports 0x0, so stub it out with pass-through
// containers. This keeps the dashboards' own markup (KPIs, tables, buttons)
// fully testable without fighting the charting library.
vi.mock('recharts', () => {
  const Pass = ({ children }) => <div>{children}</div>;
  const Noop = () => null;
  return {
    ResponsiveContainer: Pass,
    AreaChart: Pass,
    Area: Noop,
    XAxis: Noop,
    YAxis: Noop,
    CartesianGrid: Noop,
    Tooltip: Noop,
    PieChart: Pass,
    Pie: Noop,
    Cell: Noop,
    Legend: Noop,
    BarChart: Pass,
    Bar: Noop,
  };
});

const dashboardState = { data: null, loading: false, fetch: vi.fn() };
const billsState = { crud: { edit: vi.fn() } };
const departmentsState = { crud: { getOne: vi.fn() } };
const apiState = {
  dashboard: dashboardState,
  bills: billsState,
  departments: departmentsState,
};

vi.mock('@/core/contexts/api.context', () => ({
  useApi: () => apiState,
}));

const authState = { user: null };
vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => authState,
}));

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  dashboardState.data = null;
  dashboardState.loading = false;
  dashboardState.fetch = vi.fn();
  billsState.crud.edit = vi.fn().mockResolvedValue({});
  departmentsState.crud.getOne = vi.fn().mockResolvedValue({
    outstandingCredit: 0,
    creditBalance: 0,
  });
  authState.user = null;
});

describe('Dashboard page', () => {
  it('shows a loading state while dashboard data is being fetched', () => {
    authState.user = { role: 'staff', name: 'Test Staff' };
    dashboardState.loading = true;

    renderDashboard();

    expect(screen.getByText(/assembling dashboard data/i)).toBeInTheDocument();
  });

  it('fetches dashboard data for the current user role on mount', () => {
    authState.user = { role: 'super_admin', name: 'Root' };

    renderDashboard();

    expect(dashboardState.fetch).toHaveBeenCalledWith('super_admin', { from: undefined, to: undefined });
  });

  it('does not fetch when there is no authenticated user role', () => {
    authState.user = { name: 'No Role' };

    renderDashboard();

    expect(dashboardState.fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['super_admin', 'Super Admin'],
    ['branch_admin', 'Branch Admin'],
    ['department_admin', 'Department Admin'],
    ['shop_admin', 'Shop Admin'],
    ['staff', 'Staff Member'],
  ])('shows a welcome banner for role "%s"', (role, label) => {
    authState.user = { role, name: 'Priya' };

    renderDashboard();

    expect(screen.getByText(/hello, priya!/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${label} Dashboard`, 'i'))).toBeInTheDocument();
  });

  it('navigates to the role-scoped bill-creation page from "New Invoice"', async () => {
    authState.user = { role: 'shop_admin', name: 'Shopkeeper' };
    const user = userEvent.setup();

    renderDashboard();
    await user.click(screen.getByRole('button', { name: /new invoice/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/shop_admin/bill-creation');
  });

  it('renders a fallback message for a role with no dashboard view', () => {
    authState.user = { role: 'mystery_role', name: 'Ghost' };

    renderDashboard();

    expect(screen.getByText(/no dashboard view defined for this role/i)).toBeInTheDocument();
  });

  describe('role-specific dashboards', () => {
    it('renders the Super Admin dashboard with its KPIs and quick actions', () => {
      authState.user = { role: 'super_admin', name: 'Root' };
      dashboardState.data = { stats: { totalRevenue: 1000, branches: 3, users: 10, totalBills: 5 } };

      renderDashboard();

      expect(screen.getByText(/^Total Revenue$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Total Branches$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /manage branches/i })).toBeInTheDocument();
    });

    it('renders the Branch Admin dashboard with its KPIs and quick actions', () => {
      authState.user = { role: 'branch_admin', name: 'Bob' };
      dashboardState.data = { stats: { totalRevenue: 500, departments: 2, users: 4, totalBills: 3 } };

      renderDashboard();

      expect(screen.getByText(/^Branch Revenue$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /manage departments/i })).toBeInTheDocument();
    });

    it('renders the Department Admin dashboard with credit KPIs once loaded', async () => {
      authState.user = { role: 'department_admin', name: 'Dana', department: 'dept-1' };
      dashboardState.data = { stats: { users: 2, totalBills: 7 } };
      departmentsState.crud.getOne.mockResolvedValue({ outstandingCredit: 250, creditBalance: 900 });

      renderDashboard();

      await waitFor(() => {
        expect(departmentsState.crud.getOne).toHaveBeenCalledWith('dept-1');
      });
      expect(await screen.findByText('₹250')).toBeInTheDocument();
      expect(screen.getByText('₹900')).toBeInTheDocument();
    });

    it('renders the Shop Admin dashboard with its KPIs and quick actions', () => {
      authState.user = { role: 'shop_admin', name: 'Sam' };
      dashboardState.data = { stats: { totalRevenue: 200, inventoryProducts: 12, users: 3, totalBills: 6 } };

      renderDashboard();

      expect(screen.getByText(/shop revenue scope/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /billing logs/i })).toBeInTheDocument();
    });

    it('renders the Staff dashboard with personal KPIs', () => {
      authState.user = { role: 'staff', name: 'Steve' };
      dashboardState.data = {
        stats: { totalRevenue: 300, totalBills: 4, totalPaidBills: 3 },
      };

      renderDashboard();

      expect(screen.getByText(/your revenue generated/i)).toBeInTheDocument();
      expect(screen.getByText(/payment collection rate/i)).toBeInTheDocument();
      // efficiency = round(3/4 * 100) = 75%
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

});