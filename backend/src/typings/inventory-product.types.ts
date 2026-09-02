import { z } from "zod";
import { createInventoryProductSchema } from "../modules/inventory-product/inventory-product.validator.ts";

export type CreateInventoryProductPayload =
  z.infer<typeof createInventoryProductSchema>;

export type UpdateInventoryProductPayload =
  Partial<CreateInventoryProductPayload>;