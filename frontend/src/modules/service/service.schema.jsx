import { z } from "zod";

export const serviceMaterialSchema = z.object({
  product: z.string().min(1, { error: 'Please select a product' }),
  quantity: z.coerce.number().min(0, { error: 'Quantity cannot be negative' }),
});

export const serviceSizeItemSchema = z.union([
  z.object({
    size: z.string().min(1, { error: 'Please enter a size' }),
    price: z.coerce.number().min(0, { error: 'Price cannot be negative' }),
  }),
  z.string().min(1),
]);

export const serviceCreateSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Please enter the service name" }),
  description: z.string().optional(),
  unit: z.string().min(1, { error: 'Please enter the unit' }),
  price: z.coerce.number().min(0, { error: 'Price cannot be negative' }).default(0),
  isWorkOrder: z.boolean().default(false),
  isCustomSize: z.boolean().default(false),
  hasMultipleSizes: z.boolean().default(false),
  sizes: z.array(serviceSizeItemSchema).default([]),
  active: z.boolean().default(true),
  materials: z.array(serviceMaterialSchema).default([]),
});

export const serviceEditSchema = serviceCreateSchema.extend({
  active: z.boolean().optional(),
  isWorkOrder: z.boolean().optional(),
  isCustomSize: z.boolean().optional(),
  hasMultipleSizes: z.boolean().optional(),
  sizes: z.array(serviceSizeItemSchema).optional(),
});