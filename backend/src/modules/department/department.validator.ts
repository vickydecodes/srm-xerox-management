import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name is too short'),

  code: z.string().trim().min(1, 'Department code is required'),

  branch: z.string().trim(),
});