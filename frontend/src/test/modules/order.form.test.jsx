import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
      orderType: 'Xerox order',
      attachmentEmail: '',
      items: [],
      sponsors: [],
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
        BillingItemSearchCombobox={() => null}
        searchProducts={vi.fn()}
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
  });

  it('renders proof documents upload section for admin', () => {
    render(<Wrapper />);

    expect(screen.getByText(/Proof Documents & Signatures/i)).toBeInTheDocument();
    expect(screen.getByText(/Required before saving/i)).toBeInTheDocument();
  });
});