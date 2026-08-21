import { z } from "zod";

const orderItemSchema = z.object({
  type: z.enum(['InventoryProduct', 'Service'], { error: 'Select item type' }),
  item: z.string().min(1, { error: 'Please select a product or service' }),
  name: z.string().min(1, { error: 'Item name is required' }),
  quantity: z.coerce.number().min(1, { error: 'Quantity must be at least 1' }),
  price: z.coerce.number().min(0, { error: 'Price cannot be negative' }),
});

const sponsorSchema = z.object({
  name: z.string().min(1, { error: 'Sponsor name is required' }),
  amount: z.coerce.number().min(0, { error: 'Amount cannot be negative' }),
});

export const orderCreateSchema = z.object({
  shop: z.string().min(1, { message: 'Please select a shop' }),
  orderType: z.enum(['Work Order', 'Xerox order'], {
    error: 'Please select type of order',
  }),
  department: z.string().optional(),
  branch: z.string().optional(),
  purpose: z.string().optional(),
  attachmentEmail: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .min(1, { message: 'Email is required' }),
  managementAmount: z.coerce.number().min(0).optional(),
  sponsors: z.array(sponsorSchema).default([]),
  items: z.array(orderItemSchema).min(1, { error: 'Add at least one item' }),
});

export const orderEditSchema = orderCreateSchema;

export const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected'], { error: 'Select approve or reject' }),
  remarks: z.string().optional(),
});