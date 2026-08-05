import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name is too short'),

  code: z.string().trim().min(1, 'Department code is required'),

  branch: z.string().trim(),
});

export const updateDepartmentSchema =
  createDepartmentSchema.partial();

export const setDepartmentActiveStatusSchema = z.object({
  active: z.boolean(),
});