import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().trim().min(2, 'Branch name is too short'),
  code: z.string().trim().min(1, 'Branch code is required'),
});

export const updateBranchSchema = createBranchSchema.partial();

export const setBranchActiveStatusSchema = z.object({
  active: z.boolean(),
});