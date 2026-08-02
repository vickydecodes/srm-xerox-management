import { z } from 'zod';

export const branchSchema = z.object({
  name: z.string().trim().min(2, 'Branch name is too short'),
  code: z.string().trim().min(1, 'Branch code is required'),
});