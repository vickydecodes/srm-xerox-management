import { z } from 'zod';

export const updateSettingSchema = z.object({
  srmCollegeEmail: z
    .string()
    .trim()
    .min(1, 'SRM College Email is required')
    .email('Invalid email address'),
});
