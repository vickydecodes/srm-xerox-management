import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "Service name is too short"),

  description: z.string().trim().optional(),

  unit: z.string().trim().min(1, "Unit is required"),

  price: z.number().min(0, "Price cannot be negative"),

  isWorkOrder: z.boolean().optional().default(false),

  isCustomSize: z.boolean().optional().default(false),

  sizes: z.array(z.string().trim()).optional().default([]),

  materials: z
    .array(
      z.object({
        product: z.string().trim().min(1),
        quantity: z.number().min(0),
      })
    )
    .optional()
    .default([]),
});

export const updateServiceSchema =
  createServiceSchema.partial();

export const setServiceActiveStatusSchema = z.object({
  active: z.boolean(),
});