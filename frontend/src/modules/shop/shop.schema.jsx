import { z } from "zod";

export const shopCreateSchema = z.object({
  code: z.string().min(1, { error: "Please enter the shop code" }),
  name: z.string().min(2, { error: "Please enter the shop name" }),
  phone: z.string().min(1, { error: "Please enter the phone number" }),
  email: z
    .string()
    .email({ error: "Invalid email" })
    .optional()
    .or(z.literal("")),
  active: z.boolean().default(true),
});

export const shopEditSchema = shopCreateSchema.extend({
  active: z.boolean().optional(),
});