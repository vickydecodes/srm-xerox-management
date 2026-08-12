import { z } from 'zod';


const objectId = z.string().min(1, 'required');

const billItemSchema = z.object({
  type: z.enum(['InventoryProduct', 'Service']),
  item: objectId,
  name: z.string().trim().min(1, 'name is required'),
  quantity: z.coerce.number().min(1, 'quantity must be at least 1'),
  price: z.coerce.number().min(0, 'price cannot be negative'),
});

export const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit' },
];

export const createBillSchema = z
  .object({
    paymentMethod: z.enum(['upi', 'cash', 'credit'], {
      error: 'Select a payment method',
    }),
    status: z.enum(['paid', 'unpaid']).default('paid'),
    branch: z.string().optional(),
    department: z.string().optional(),
    items: z.array(billItemSchema).min(1, 'at least one item is required'),
    discount: z.coerce.number().min(0).optional(),
    tax: z.coerce.number().min(0).optional(),
  })
  
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
  status: 'paid',
  branch: '',
  department: '',
  items: [],
  discount: 0,
  tax: 0,
};