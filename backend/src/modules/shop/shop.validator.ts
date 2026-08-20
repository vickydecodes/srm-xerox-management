import { z } from 'zod';


export const createShopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Shop name is too short'),

  code: z
    .string()
    .trim()
    .min(1, 'Shop code is required'),

  phone: z
    .string()
    .trim()
    .min(1, 'Shop phone is required'),

  email: z
    .string()
    .trim()
    .optional(),
});


export const updateShopSchema =
  createShopSchema.partial();


export const setShopActiveStatusSchema = z.object({
  active: z.boolean(),
});