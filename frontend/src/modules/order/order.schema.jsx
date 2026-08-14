import { z } from "zod";

export const createOrderSchema = z.object({
  department: z.string().min(1, "Department is required"),
  branch: z.string().min(1, "Branch is required"),
  purpose: z.string().optional().default(""),
  managementAmount: z.number().min(0, "Management amount cannot be negative").default(0),
  sponsors: z
    .array(
      z.object({
        name: z.string().min(1, "Sponsor name is required"),
        amount: z.number().min(0, "Amount cannot be negative"),
      })
    )
    .default([]),
  items: z
    .array(
      z.object({
        type: z.enum(["InventoryProduct", "Service"]),
        item: z.string().min(1, "Item reference is required"),
        name: z.string().min(1, "Item name is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        price: z.number().min(0, "Price cannot be negative"),
      })
    )
    .min(1, "At least one item is required"),
  status: z.enum(["draft", "pending", "in_progress", "completed", "rejected"]).default("draft"),
});
