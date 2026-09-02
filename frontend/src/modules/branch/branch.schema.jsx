import { z } from "zod";

export const branchCreateSchema = z.object({
  code: z.string().min(1, { error: 'Please enter the branch code' }),
  name: z.string().min(2, { error: 'Please enter the branch name' }),
  active: z.boolean().default(true),
});

export const branchEditSchema = branchCreateSchema.extend({
  active: z.boolean().optional(),
});