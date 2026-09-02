import { createDepartmentSchema } from '@modules/department/department.validator.ts';
import z from 'zod';

export type CreateDepartmentPayload = z.infer<
  typeof createDepartmentSchema
>;

export type UpdateDepartmentPayload =
  Partial<CreateDepartmentPayload>;