import { z } from 'zod';

// ASSUMPTION: same as before — no shared objectId validator found in codebase.
const objectId = z.string().min(1, 'required');

const billItemSchema = z.object({
  item: objectId,
  name: z.string().trim().min(1, 'name is required'),
  quantity: z.number().min(1, 'quantity must be at least 1'),
  price: z.number().min(0, 'price cannot be negative'),
});

export const PAYMENT_METHODS = [
  { value: 'gpay', label: 'GPay' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit' },
];

export const createBillSchema = z
  .object({
    paymentMethod: z.enum(['gpay', 'cash', 'credit'], {
      error: 'Select a payment method',
    }),
    branch: z.string().optional(),
    department: z.string().optional(),
    items: z.array(billItemSchema).min(1, 'at least one item is required'),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
  })
  // branch/department are only meaningful — and required — on credit bills
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'credit') {
      if (!data.branch) {
        ctx.addIssue({
          code: 'custom',
          path: ['branch'],
          message: 'Branch is required for credit bills',
        });
      }
      if (!data.department) {
        ctx.addIssue({
          code: 'custom',
          path: ['department'],
          message: 'Department is required for credit bills',
        });
      }
    }
  });

export const defaultBillValues = {
  paymentMethod: 'cash',
  branch: '',
  department: '',
  items: [{ item: '', name: '', quantity: 1, price: 0 }],
  discount: 0,
  tax: 0,
};