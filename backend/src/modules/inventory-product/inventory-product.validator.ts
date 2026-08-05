import { z } from "zod";

export const inventoryProductSchema = z.object({
    inventory: z
     .string()
     .trim()
     .min(1, "Inventory is required"),

    product: z
     .string()
     .trim()
     .min(1, "Product is required"),

    variant: z
     .record(z.string(), z.string())
     .default({}),

    quantity: z
     .number()
     .int()
     .min(0, "Quantity cannot be negative"),

    price: z
     .number()
     .min(0, "Price cannot be negative"),

});

export type InventoryProductInput = z.infer<
 typeof inventoryProductSchema>;