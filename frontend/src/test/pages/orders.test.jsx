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

import OrdersPage from '@/pages/order/orders';

describe('OrdersPage', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    mockSetSearchParams.mockClear();
  });

  it('renders custom title and description', () => {
    render(<OrdersPage title="Custom Orders" description="Custom Description" />);

    expect(screen.getByRole('heading', { level: 1, name: /Custom Orders/i })).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });

  it('defaults to Event Orders tab and allows switching to Xerox Orders', () => {
    render(<OrdersPage />);

    expect(screen.getByTestId('event-orders-content')).toBeInTheDocument();

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

  it('renders Xerox Orders when search param is tab=xerox', () => {
    mockSearchParams = new URLSearchParams('tab=xerox');
    render(<OrdersPage />);

    expect(screen.getByTestId('xerox-orders-content')).toBeInTheDocument();
  });
});
