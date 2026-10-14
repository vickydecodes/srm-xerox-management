import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import OrderForm from '@/modules/order/order.form';

vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => ({ user: { role: 'super_admin' } }),
}));

function Wrapper(props) {
  const form = useForm({
    defaultValues: {
      shop: '',
      orderType: 'XEROX_ORDER',
      attachmentEmail: '',
      fundingMethod: '',
      managementAmount: 0,
      items: [],
      self_supports: [],
      proofFiles: [],
    },
  });
  return (
    <Form {...form}>
      <OrderForm
        form={form}
        branches={[]}
        departments={[]}
        shops={[{ _id: 's1', name: 'Main Shop' }]}
        searchProducts={vi.fn().mockResolvedValue([
          {
            _id: 'product-1',
            type: 'InventoryProduct',
            name: 'A4 Paper',
            price: 5,
            quantity: 10,
          },
        ])}
        {...props}
      />
    </Form>
  );
}

describe('OrderForm', () => {
  it('renders shop / order type fields', () => {
    render(<Wrapper />);

    expect(screen.getByText('Attending Shop')).toBeInTheDocument();
    expect(screen.getByText('Type of Order')).toBeInTheDocument();
    expect(screen.getByLabelText('Event Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Event Date')).toBeInTheDocument();
  });

  it('renders proof documents upload section for admin', () => {
    render(<Wrapper />);

    expect(screen.getByText(/Proof Documents & Signatures/i)).toBeInTheDocument();
    expect(screen.getByText(/Required before saving/i)).toBeInTheDocument();
  });

  it('adds the selected product when Add more product is clicked', async () => {
    const user = userEvent.setup();
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    try {
      render(<Wrapper />);

      await user.click(screen.getByLabelText('Select a Product / Service'));
      await user.click(await screen.findByRole('option', { name: /A4 Paper/ }));
      await user.click(screen.getByRole('button', { name: 'Add more product' }));

      expect(screen.getByText('A4 Paper')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  it('shows only the amount field for the selected payment method', async () => {
    const user = userEvent.setup();
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    try {
      render(<Wrapper />);

      expect(screen.queryByLabelText('Management Amount')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Self Support Amount')).not.toBeInTheDocument();

      await user.click(screen.getByRole('combobox', { name: 'Payment Method' }));
      await user.click(screen.getByRole('option', { name: 'Self Support Amount' }));
      expect(screen.getByLabelText('Self Support Amount')).toBeInTheDocument();
      expect(screen.queryByLabelText('Management Amount')).not.toBeInTheDocument();

      await user.click(screen.getByRole('combobox', { name: 'Payment Method' }));
      await user.click(screen.getByRole('option', { name: 'Management Amount' }));
      expect(screen.getByLabelText('Management Amount')).toBeInTheDocument();
      expect(screen.queryByLabelText('Self Support Amount')).not.toBeInTheDocument();
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });
});