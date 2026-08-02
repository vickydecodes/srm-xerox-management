import { departmentSchema } from '@modules/department/department.validator.ts';
import z from 'zod';

export type CreateDepartmentPayload = z.infer<typeof departmentSchema>;
export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;