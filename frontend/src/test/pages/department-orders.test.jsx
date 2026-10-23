import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  useNavigate: () => vi.fn(),
}));

vi.mock('@/pages/event-order/event-order', () => ({
  default: () => <div data-testid="event-orders-content">Event Orders Table</div>,
}));

vi.mock('@/pages/xerox-order/xerox-order', () => ({
  default: () => <div data-testid="xerox-orders-content">Xerox Orders Table</div>,
}));

import DepartmentOrdersPage from '@/pages/order/department-orders';

describe('DepartmentOrdersPage', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    mockSetSearchParams.mockClear();
  });

  it('renders page header and tabs for Event Orders and Xerox Orders', () => {
    render(<DepartmentOrdersPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Department Orders/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Event Orders/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Xerox Orders/i })).toBeInTheDocument();
  });

  it('defaults to event orders tab when no param is provided', () => {
    render(<DepartmentOrdersPage />);

    expect(screen.getByTestId('event-orders-content')).toBeInTheDocument();
  });

  it('switches to xerox tab when clicking Xerox Orders tab', () => {
    render(<DepartmentOrdersPage />);

    const xeroxTab = screen.getByRole('tab', { name: /Xerox Orders/i });
    fireEvent.pointerDown(xeroxTab);
    fireEvent.click(xeroxTab);

    if (mockSetSearchParams.mock.calls.length > 0) {
      expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: 'xerox' });
    } else {
      fireEvent.keyDown(xeroxTab, { key: 'Enter', code: 'Enter' });
      expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: 'xerox' });
    }
  });

  it('renders xerox orders content when search param is tab=xerox', () => {
    mockSearchParams = new URLSearchParams('tab=xerox');
    render(<DepartmentOrdersPage />);

    expect(screen.getByTestId('xerox-orders-content')).toBeInTheDocument();
  });
});
