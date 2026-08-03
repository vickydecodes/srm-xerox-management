import { z } from "zod";

export const serviceMaterialSchema = z.object({
  product: z.string().min(1, { error: 'Please select a product' }),
  quantity: z.coerce.number().min(0, { error: 'Quantity cannot be negative' }),
});

export const serviceCreateSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Please enter the service name" }),
  description: z.string().optional(),
  unit: z.string().min(1, { error: 'Please enter the unit' }),
  price: z.coerce.number().min(0, { error: 'Price cannot be negative' }),
  active: z.boolean().default(true),
  materials: z.array(serviceMaterialSchema).default([]),
});

export const serviceEditSchema = serviceCreateSchema;