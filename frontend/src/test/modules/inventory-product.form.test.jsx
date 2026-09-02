import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { InventoryProductForm } from '@/modules/inventory-product/inventory-product.form';
import { SelectItem } from '@/components/ui/select';

vi.mock('@/core/hooks/useSelect', () => ({
  useSelectItems: () => ({
    items: <SelectItem value="p1">A4 Paper</SelectItem>,
    placeholder: 'Select a product',
    hasItems: true,
    disabled: false,
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

    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
  });
});