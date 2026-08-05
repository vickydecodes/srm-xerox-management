import { z } from "zod";
import { createServiceSchema } from "../modules/service/service.validator.ts";

export type CreateServicePayload =
  z.infer<typeof createServiceSchema>;

export type UpdateServicePayload =
  Partial<CreateServicePayload>;