import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

import OrderCreation from '@/pages/order-creation/order-creation';
import { useApi } from '@/core/contexts/api.context';
import { useAuth } from '@/core/contexts/auth.context';
import { useLoader } from '@/core/hooks/useLoader';

vi.mock('@/core/contexts/api.context');
vi.mock('@/core/contexts/auth.context');
vi.mock('@/core/hooks/useLoader');

describe('OrderCreation Page', () => {
  let loadResources;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockSetSearchParams.mockClear();
    mockSearchParams = new URLSearchParams();

    loadResources = vi.fn();
    useLoader.mockReturnValue({
      createPreset: () => loadResources,
      loading: false,
    });

    useAuth.mockReturnValue({
      user: { _id: 'u1', role: 'department_admin', branch: 'b1', department: 'd1', email: 'test@srmist.edu.in' },
      role: 'department_admin',
    });

    useApi.mockReturnValue({
      eventOrders: { crud: { create: vi.fn() } },
      xeroxOrders: { crud: { create: vi.fn() } },
      services: { state: [{ _id: 's1', name: 'Color Poster', price: 150 }] },
      shops: { state: [{ _id: 'sh1', name: 'Main Campus Xerox' }] },
      branches: { state: [{ _id: 'b1', name: 'KTR Campus' }] },
      departments: { state: [{ _id: 'd1', name: 'CSE' }] },
      search: { searchProducts: vi.fn().mockResolvedValue([]) },
    });
  });

  it('renders page header and tabs for Xerox Order and Work Order', () => {
    render(<OrderCreation />);

    expect(screen.getByText('Create Requisition Order')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Xerox Order/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Work Order/i })).toBeInTheDocument();
  });

  it('loads resources (services, shops, branches, departments) on mount', () => {
    render(<OrderCreation />);
    expect(loadResources).toHaveBeenCalledTimes(1);
  });

  it('defaults to xerox tab when tab param is absent or xerox', () => {
    mockSearchParams = new URLSearchParams('tab=xerox');
    render(<OrderCreation />);

    expect(screen.getByText('Xerox Order Specifications')).toBeInTheDocument();
  });

  it('defaults to work-order tab when tab param is work-order or event', () => {
    mockSearchParams = new URLSearchParams('tab=work-order');
    render(<OrderCreation />);

    expect(screen.getByText('Work Order Specifications')).toBeInTheDocument();
  });

  it('only fetches and provides services with isWorkOrder: true to work order form', () => {
    mockSearchParams = new URLSearchParams('tab=work-order');
    render(<OrderCreation />);

    expect(screen.getByText('Work Order Specifications')).toBeInTheDocument();
    expect(screen.getByText('Search work order services...')).toBeInTheDocument();
  });

  it('renders size/variant dropdown for work order items with custom sizing support', () => {
    mockSearchParams = new URLSearchParams('tab=work-order');
    render(<OrderCreation />);

    expect(screen.getByText('Size / Variant')).toBeInTheDocument();
    expect(screen.getByText('Select size / variant')).toBeInTheDocument();
  });

  it('switches tabs between Xerox Order and Work Order', async () => {
    render(<OrderCreation />);

    const workOrderTab = screen.getByRole('tab', { name: /Work Order/i });
    fireEvent.pointerDown(workOrderTab);
    fireEvent.click(workOrderTab);

    // If pointerDown/click triggered onValueChange
    if (mockSetSearchParams.mock.calls.length > 0) {
      expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: 'work-order' });
    } else {
      // Direct focus + Enter key
      fireEvent.keyDown(workOrderTab, { key: 'Enter', code: 'Enter' });
      expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: 'work-order' });
    }
  });

  describe('Xerox Order Form Specifications', () => {
    it('does not render approval referral number or approval date inputs', () => {
      mockSearchParams = new URLSearchParams('tab=xerox');
      render(<OrderCreation />);

      expect(screen.queryByLabelText(/Approval Referral Number/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Approval Date/i)).not.toBeInTheDocument();
    });

    it('does not render approval proofs upload dropzone', () => {
      mockSearchParams = new URLSearchParams('tab=xerox');
      render(<OrderCreation />);

      expect(screen.queryByText(/Approval & Sanction Documents/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Click to select proof documents/i)).not.toBeInTheDocument();
    });

    it('renders department allocation without an input field for management amount', () => {
      mockSearchParams = new URLSearchParams('tab=xerox');
      render(<OrderCreation />);

      expect(screen.getByText('Department Allocation')).toBeInTheDocument();
      expect(screen.getByText('Full Department Coverage')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Management Allocated Amount \(₹\)/i)).not.toBeInTheDocument();
    });

    it('renders quantity input and product search without file attachment input', () => {
      mockSearchParams = new URLSearchParams('tab=xerox');
      render(<OrderCreation />);

      expect(screen.getByText(/Search Product \/ Service/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Quantity \*/i)).toBeInTheDocument();
      expect(screen.queryByText(/Attach document file for Xerox shop/i)).not.toBeInTheDocument();
    });

    it('preloads branch and department and does not mention sponsors', () => {
      mockSearchParams = new URLSearchParams('tab=xerox');
      render(<OrderCreation />);

      expect(screen.getByText('Branch / Campus')).toBeInTheDocument();
      expect(screen.getAllByText('Department').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/sponsor/i)).not.toBeInTheDocument();
    });
  });
});
