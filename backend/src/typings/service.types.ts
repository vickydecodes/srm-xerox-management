import { z } from "zod";
import { serviceSchema } from "../modules/service/service.validator.ts";
export type CreateServicePayload = z.infer<typeof serviceSchema>;

export type UpdateServicePayload = Partial<CreateServicePayload>;