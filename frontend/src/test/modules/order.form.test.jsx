import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import OrderForm from '@/modules/order/order.form';

vi.mock('@/core/contexts/auth.context', () => ({
  useAuth: () => ({ user: { role: 'super_admin' } }),
}));

function Wrapper({ defaultValues = {}, ...props }) {
  const form = useForm({
    defaultValues: {
      shop: '',
      orderType: 'XEROX_ORDER',
      eventName: '',
      eventDate: '',
      approvedReferralNumber: '',
      approvedDate: '',
      attachmentEmail: '',
      fundingMethod: '',
      managementAmount: 0,
      items: [],
      self_supports: [],
      proofFiles: [],
      ...defaultValues,
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
          {
            _id: 'service-1',
            type: 'Service',
            name: 'Flex Banner',
            price: 50,
            hasSize: true,
            isSquareFeet: true,
            isWorkOrder: true,
          },
          {
            _id: 'service-2',
            type: 'Service',
            name: 'Poster Printing',
            price: 80,
            isWorkOrder: true,
          },
        ])}
        {...props}
      />
    </Form>
  );
}

describe('OrderForm', () => {
  it('renders order type and newly added required fields without shop select', () => {
    render(<Wrapper />);

    expect(screen.queryByText('Select Shop')).not.toBeInTheDocument();
    expect(screen.getByText(/Type of Order/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Approved Referral Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Approved Date/i)).toBeInTheDocument();
  });

  it('does not render separate proof documents upload section as uploads are inlined on added items', () => {
    render(<Wrapper />);

    expect(screen.queryByText(/Approved Document Attachements/i)).not.toBeInTheDocument();
  });

  it('adds the selected product when Add item is clicked', async () => {
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
      await user.click(screen.getByRole('button', { name: 'Add item' }));

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

      expect(screen.queryByLabelText(/Management Amount/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Self Support Amount/i)).not.toBeInTheDocument();

      await user.click(screen.getByRole('combobox', { name: 'Payment Method' }));
      await user.click(screen.getByRole('option', { name: 'Self Support Amount' }));
      expect(screen.getByLabelText(/Self Support Amount/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Management Amount/i)).not.toBeInTheDocument();

      await user.click(screen.getByRole('combobox', { name: 'Payment Method' }));
      await user.click(screen.getByRole('option', { name: 'Management Amount' }));
      expect(screen.getByLabelText(/Management Amount/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Self Support Amount/i)).not.toBeInTheDocument();
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  it('renders service attachment field for Service item when orderType is WORK_ORDER', async () => {
    const user = userEvent.setup();
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    try {
      render(
        <Wrapper
          defaultValues={{
            orderType: 'WORK_ORDER',
            items: [
              {
                id: 'item-1',
                product: 'service-1',
                name: 'Flex Banner',
                type: 'Service',
                price: 50,
                quantity: 1,
                hasSize: true,
                isSquareFeet: true,
                size: { width: 10, height: 4, unit: 'feet' },
                totalAmount: 2000,
                attachment: null,
                attachmentFile: null,
              },
            ],
          }}
        />
      );

      expect(screen.getByText(/📎 Attach Approved Document/i)).toBeInTheDocument();
      expect(screen.getByText(/Mandatory/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add another Flex Banner/i })).toBeInTheDocument();
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  it('adds a separate line item when adding another banner with different size', async () => {
    const user = userEvent.setup();
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    try {
      render(
        <Wrapper
          defaultValues={{
            orderType: 'WORK_ORDER',
            items: [
              {
                id: 'item-1',
                product: 'service-1',
                name: 'Flex Banner',
                type: 'Service',
                price: 50,
                quantity: 1,
                hasSize: true,
                isSquareFeet: true,
                size: { width: 10, height: 4, unit: 'feet' },
                totalAmount: 2000,
                attachment: null,
                attachmentFile: null,
              },
            ],
          }}
        />
      );

      const addAnotherBtn = screen.getByRole('button', { name: /\+ Add another Flex Banner/i });
      await user.click(addAnotherBtn);

      const bannerHeadings = screen.getAllByText('Flex Banner');
      expect(bannerHeadings.length).toBe(2);

      const attachmentLabels = screen.getAllByText(/📎 Attach Approved Document/i);
      expect(attachmentLabels.length).toBe(2);
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  it('provides size selection, custom dimensions, and sq.ft for any service (not just banner)', async () => {
    const user = userEvent.setup();
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    try {
      render(
        <Wrapper
          defaultValues={{
            orderType: 'WORK_ORDER',
            items: [
              {
                id: 'item-2',
                product: 'service-2',
                name: 'Poster Printing',
                type: 'Service',
                price: 80,
                quantity: 1,
                size: 'Custom',
                isCustomSize: true,
                customWidth: 3,
                customHeight: 2,
                customUnit: 'ft',
                customRate: 80,
                customSize: '2×3 ft (6 sq.ft)',
                attachment: null,
                attachmentFile: null,
              },
            ],
          }}
        />
      );

      expect(screen.getByText('Poster Printing')).toBeInTheDocument();
      expect(screen.getByText(/Dimensions & Sq.Ft/i)).toBeInTheDocument();
      expect(screen.getByText(/6 sq.ft/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Add another Poster Printing/i })).toBeInTheDocument();
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  it('creates separate line items for all services instead of merging into quantity 2', async () => {
    const user = userEvent.setup();
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    try {
      render(
        <Wrapper
          defaultValues={{
            orderType: 'WORK_ORDER',
            items: [
              {
                id: 'item-2',
                product: 'service-2',
                name: 'Poster Printing',
                type: 'Service',
                price: 80,
                quantity: 1,
                size: 'A3',
                attachment: null,
                attachmentFile: null,
              },
            ],
          }}
        />
      );

      // Click + Add another Poster Printing (different size/specs)
      const addAnotherBtn = screen.getByRole('button', { name: /\+ Add another Poster Printing/i });
      await user.click(addAnotherBtn);

      // Both instances must exist as separate line items
      const posterItems = screen.getAllByText('Poster Printing');
      expect(posterItems.length).toBe(2);

      // Both must have independent attachment fields
      const attachments = screen.getAllByText(/📎 Attach Approved Document/i);
      expect(attachments.length).toBe(2);
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  it('shows only work order services in select dropdown when orderType is WORK_ORDER', async () => {
    const user = userEvent.setup();
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    try {
      render(
        <Wrapper
          defaultValues={{
            orderType: 'WORK_ORDER',
          }}
          searchProducts={vi.fn().mockResolvedValue([
            {
              _id: 'product-1',
              type: 'InventoryProduct',
              name: 'A4 Paper',
              price: 5,
            },
            {
              _id: 'service-regular',
              type: 'Service',
              name: 'Regular Xerox Photocopy',
              price: 2,
              isWorkOrder: false,
            },
            {
              _id: 'service-wo',
              type: 'Service',
              name: 'Vinyl Flex Banner',
              price: 150,
              isWorkOrder: true,
            },
          ])}
        />
      );

      // Verify dropdown label specifically indicates Work Order Service
      expect(screen.getByLabelText('Select a Work Order Service')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Select a Work Order Service'));

      // Vinyl Flex Banner (isWorkOrder: true) should be present
      expect(await screen.findByRole('option', { name: /Vinyl Flex Banner/ })).toBeInTheDocument();

      // Regular Xerox and Inventory Products should NOT be present in options
      expect(screen.queryByRole('option', { name: /A4 Paper/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /Regular Xerox Photocopy/ })).not.toBeInTheDocument();
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });

  it('only allows selecting and adding work order services in WORK_ORDER', async () => {
    const user = userEvent.setup();
    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    try {
      render(
        <Wrapper
          defaultValues={{
            orderType: 'WORK_ORDER',
          }}
          searchProducts={vi.fn().mockResolvedValue([
            {
              _id: 'service-wo',
              type: 'Service',
              name: 'Vinyl Flex Banner',
              price: 150,
              isWorkOrder: true,
            },
          ])}
        />
      );

      await user.click(screen.getByLabelText('Select a Work Order Service'));
      await user.click(await screen.findByRole('option', { name: /Vinyl Flex Banner/ }));
      await user.click(screen.getByRole('button', { name: 'Add item' }));

      expect(screen.getByText('Vinyl Flex Banner')).toBeInTheDocument();
      expect(screen.getByText('Service')).toBeInTheDocument();
      expect(screen.getAllByText('Work Order').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText(/📎 Attach Approved Document/i)).toBeInTheDocument();
    } finally {
      window.ResizeObserver = originalResizeObserver;
    }
  });
});