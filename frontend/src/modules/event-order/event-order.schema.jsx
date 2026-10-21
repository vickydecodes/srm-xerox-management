import { z } from "zod";

export const eventOrderItemSchema = z.object({
  type: z.enum(['Service'], { error: 'Item type must be Service for Event Orders' }).default('Service'),
  item: z.string().min(1, { error: 'Please select a service' }),
  name: z.string().min(1, { error: 'Item name is required' }),
  quantity: z.coerce.number().min(1, { error: 'Quantity must be at least 1' }),
  price: z.coerce.number().min(0, { error: 'Price cannot be negative' }),
  size: z.string().optional(),
  customSize: z.string().optional(),
  sizes: z.array(z.union([z.string(), z.object({ size: z.string(), price: z.coerce.number().optional() })])).optional(),
  isCustomSize: z.boolean().optional(),
  customPriceAdded: z.boolean().optional(),
  customWidth: z.coerce.number().optional(),
  customHeight: z.coerce.number().optional(),
  customUnit: z.string().optional(),
  customRate: z.coerce.number().optional(),
  attachment: z.any().optional(),
  attachmentFile: z.any().optional(),
});

export const selfSupportSchema = z.object({
  name: z.string().min(1, { error: 'Self support sponsor name is required' }),
  amount: z.coerce.number().min(0, { error: 'Amount cannot be negative' }),
});

export const baseEventOrderSchema = z.object({
  branch: z.string().optional(),
  department: z.string().optional(),
  shop: z.string().optional(),
  eventName: z.string().min(1, { message: 'Event name is required' }),
  eventStartDate: z.string().min(1, { message: 'Event start date is required' }).refine(
    (val) => {
      if (!val) return false;
      const minDateStr = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return val >= minDateStr;
    },
    { message: 'Event order must be submitted at least 72 hours before the event start date' }
  ),
  eventEndDate: z.string().optional(),
  eventVenues: z.array(z.string()).default([]),
  convenors: z.array(z.string()).default([]),
  coordinators: z.array(z.string()).default([]),
  approvedReferralNumber: z.string().min(1, { message: 'Approved referral number is required' }),
  approvedDate: z.string().min(1, { message: 'Approved date is required' }),
  purpose: z.string().min(1, { message: 'Purpose is required' }),
  attachmentEmail: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .min(1, { message: 'Email is required' }),
  fundingMethod: z.enum(['management', 'self_support', 'registration_fee', 'combined'], {
    error: 'Please choose a funding source',
  }).default('management'),
  managementAmount: z.coerce.number().min(0).optional().default(0),
  self_supports: z.array(selfSupportSchema).default([]),
  registrationFeeAmount: z.coerce.number().min(0).optional().default(0),
  items: z.array(eventOrderItemSchema).min(1, { error: 'Add at least one service item' }),
  proofFiles: z.any().optional(),
});

const validateEventOrder = (data, ctx) => {
  if (Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (item.type !== 'Service') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Only services are allowed in Event Orders ("${item.name}" is not a service)`,
          path: ['items', index, 'type'],
        });
      }
      if (!item.attachment && !item.attachmentFile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Attach approved document is required for "${item.name}" (item #${index + 1})`,
          path: ['items', index, 'attachment'],
        });
      }
    });
  }

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
        message: 'Self support sponsor amount must be greater than 0',
        path: ['self_supports'],
      });
    }
  } else if (data.fundingMethod === 'registration_fee') {
    if (data.registrationFeeAmount === undefined || data.registrationFeeAmount === null || Number(data.registrationFeeAmount) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Registration fee amount must be greater than 0',
        path: ['registrationFeeAmount'],
      });
    }
  }
};

export const eventOrderCreateSchema = baseEventOrderSchema.superRefine(validateEventOrder);

export const eventOrderEditSchema = baseEventOrderSchema.partial().superRefine((data, ctx) => {
  if (data.items) {
    validateEventOrder(data, ctx);
  }
});

export const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    required_error: 'Please select an approval status',
  }),
  remarks: z.string().optional(),
  verifyProofs: z.boolean().optional(),
});
