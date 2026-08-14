import { z } from "zod";

export const createInventoryProductSchema = z.object({
  inventory: z
    .string()
    .trim()
    .min(1, "Inventory is required"),

  product: z
    .string()
    .trim()
    .min(1, "Product is required"),

  variant: z
    .string()
    .trim()
    .optional()
    .nullable()
    .default(null),

  quantity: z
    .number()
    .int()
    .min(0, "Quantity cannot be negative"),

  price: z
    .number()
    .min(0, "Price cannot be negative"),
});

export const updateInventoryProductSchema =
  createInventoryProductSchema.partial();

export const setInventoryProductActiveStatusSchema = z.object({
  active: z.boolean(),
});

export type InventoryProductInput = z.infer<
  typeof createInventoryProductSchema
>;