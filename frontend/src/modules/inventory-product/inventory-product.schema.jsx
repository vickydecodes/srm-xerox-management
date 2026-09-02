import { z } from "zod";

export const inventoryProductCreateSchema = z.object({
  product: z.string().min(1, "Product is required"),
  variant: z.record(z.string(), z.string()).default({}),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative").default(0),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  active: z.boolean().default(true),
});

export const inventoryProductEditSchema = z.object({
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  active: z.boolean().optional(),
});


export const inventoryProductSchema = z.object({
  product: z.string().min(1, "Product is required"),
  variant: z.record(z.string(), z.string()).default({}),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative").default(0),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  active: z.boolean().default(true),
});