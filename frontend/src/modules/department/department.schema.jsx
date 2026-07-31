import { z } from "zod";


export const departmentCreateSchema = z.object({
    id: z.string().min(1, { error: 'Please give the id' }),
    name: z
        .string()
        .min(2, { error: "Please enter the branch name" }),
});