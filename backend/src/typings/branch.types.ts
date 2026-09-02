import { createBranchSchema } from '@modules/branch/branch.validator.ts';
import z from 'zod';

export type CreateBranchPayload = z.infer<typeof createBranchSchema>;
export type UpdateBranchPayload = Partial<CreateBranchPayload>;