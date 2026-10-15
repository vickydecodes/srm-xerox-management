import { z } from "zod";

const orderItemSchema = z.object({
  type: z.enum(['InventoryProduct', 'Service'], { error: 'Select item type' }),
  item: z.string().min(1, { error: 'Please select a product or service' }),
  name: z.string().min(1, { error: 'Item name is required' }),
  quantity: z.coerce.number().min(1, { error: 'Quantity must be at least 1' }),
  price: z.coerce.number().min(0, { error: 'Price cannot be negative' }),
  size: z.string().optional(),
  customSize: z.string().optional(),
  sizes: z.array(z.union([z.string(), z.object({ size: z.string(), price: z.coerce.number().optional() })])).optional(),
  isCustomSize: z.boolean().optional(),
  isWorkOrder: z.boolean().optional(),
  customPriceAdded: z.boolean().optional(),
  customWidth: z.coerce.number().optional(),
  customHeight: z.coerce.number().optional(),
  customUnit: z.string().optional(),
  customRate: z.coerce.number().optional(),
  attachment: z.any().optional(),
  attachmentFile: z.any().optional(),
});

const selfSupportSchema = z.object({
  name: z.string().min(1, { error: 'Self support name is required' }),
  amount: z.coerce.number().min(0, { error: 'Amount cannot be negative' }),
});

const baseOrderSchema = z.object({
  shop: z.string().optional(),
  orderType: z.enum(['WORK_ORDER', 'XEROX_ORDER'], {
    error: 'Please select type of order',
  }),
  fundingMethod: z.enum(['management', 'self_support'], {
    error: 'Please choose a payment method',
  }),
  eventName: z.string().min(1, { message: 'Event name is required' }),
  eventDate: z.string().min(1, { message: 'Event date is required' }).refine(
    (val) => {
      if (!val) return false;
      const minDateStr = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return val >= minDateStr;
    },
    { message: 'Order form must be submitted at least 72 hours before the event date' }
  ),
  approvedReferralNumber: z.string().min(1, { message: 'Approved referral number is required' }),
  approvedDate: z.string().min(1, { message: 'Approved date is required' }),
  purpose: z.string().min(1, { message: 'Purpose is required' }),
  attachmentEmail: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .min(1, { message: 'Email is required' }),
  managementAmount: z.coerce.number().min(0).optional(),
  self_supports: z.array(selfSupportSchema).default([]),
  items: z.array(orderItemSchema).min(1, { error: 'Add at least one item' }),
});

const validateOrder = (data, ctx) => {
  // In work order, only services should be selected and shown, and those services should be work order ones
  if (data.orderType === 'WORK_ORDER' && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (item.type !== 'Service') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Only services are allowed in Work Orders ("${item.name}" is a product)`,
          path: ['items', index, 'type'],
        });
      } else if (item.isWorkOrder === false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Only work order services are allowed in Work Orders ("${item.name}" is not a work order service)`,
          path: ['items', index, 'isWorkOrder'],
        });
      }
      if (item.type === 'Service' && !item.attachment && !item.attachmentFile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Attach approved document is required for "${item.name}" (item #${index + 1}) in Work Orders`,
          path: ['items', index, 'attachment'],
        });
      }
    });
  }

  // Payment method validation
  if (data.fundingMethod === 'management') {
    if (data.managementAmount === undefined || data.managementAmount === null || Number(data.managementAmount) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Management amount must be greater than 0',
        path: ['managementAmount'],
      });
    }
  } else if (data.fundingMethod === 'self_support') {
    if (!data.self_supports || data.self_supports.length === 0 || Number(data.self_supports[0]?.amount) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Self support amount must be greater than 0',
        path: ['self_supports'],
      });
    }
  }
};

export const orderCreateSchema = baseOrderSchema.extend({
  proofFiles: z.array(z.any()).optional().default([]),
}).superRefine(validateOrder);

export const orderEditSchema = baseOrderSchema.extend({
  proofFiles: z.array(z.any()).optional().default([]),
}).superRefine(validateOrder);

export const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected'], { error: 'Select approve or reject' }),
  remarks: z.string().optional(),
  verifyProofs: z.boolean().optional(),
});