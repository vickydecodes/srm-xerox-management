import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BillForm } from '@/modules/bill/bill.form';

// Must be a real constructor — Radix does `new ResizeObserver(...)`
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
});

vi.mock('@/core/contexts/api.context', () => ({
  useApi: () => ({
    search: {
      BillingItemSearchCombobox: () => <div data-testid="search-combo" />,
      searchProducts: vi.fn(),
    },
  }),
}));

vi.mock('@/core/hooks/useSelect', () => ({
  useSelectItems: () => ({ items: [], props: {} }),
}));

describe('BillForm', () => {
  it('renders payment methods and submit area', () => {
    render(
      <BillForm
        inventoryProducts={[]}
        services={[]}
        onSubmit={vi.fn()}
        loading={false}
      />
    );

    // No order → form only shows UPI + Cash (credit is filtered out)
    expect(screen.getByText(/upi/i)).toBeInTheDocument();
    expect(screen.getByText(/cash/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /generate invoice/i })
    ).toBeInTheDocument();
  });
});