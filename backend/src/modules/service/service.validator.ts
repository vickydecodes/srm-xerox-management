import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "Service name is too short"),

  description: z.string().trim().optional(),

  unit: z.string().trim().min(1, "Unit is required"),

  price: z.number().min(0, "Price cannot be negative"),

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