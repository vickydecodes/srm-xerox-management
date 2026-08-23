import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { InventoryProductForm } from '@/modules/inventory-product/inventory-product.form';

vi.mock('@/core/hooks/useSelect', () => ({
  useSelectItems: () => ({
    items: [{ value: 'p1', label: 'A4 Paper' }],
    props: {},
  }),
}));

function Wrapper() {
  const form = useForm({
    defaultValues: {
      product: '',
      variant: {},
      quantity: 0,
      price: 0,
      active: true,
    },
  });
  return (
    <Form {...form}>
      <InventoryProductForm
        form={form}
        products={[{ _id: 'p1', name: 'A4 Paper', attributes: {} }]}
      />
    </Form>
  );
}

describe('InventoryProductForm', () => {
  it('renders product field', () => {
    render(<Wrapper />);
    expect(screen.getByText(/product/i)).toBeInTheDocument();
  });
});