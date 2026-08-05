import { z } from "zod";

export const departmentCreateSchema = z.object({
  code: z.string().min(1, { error: 'Please enter the department code' }),
  name: z.string().min(2, { error: "Please enter the department name" }),
  branch: z.string().min(1, { error: "Please select a branch" }),
  active: z.boolean().default(true),
});

export const departmentEditSchema = departmentCreateSchema.extend({
  active: z.boolean().optional(),
});