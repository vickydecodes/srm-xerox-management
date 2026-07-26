import { z } from "zod";
import { inventoryProductSchema } from "../modules/inventory-product/inventory-product.validator.ts";

export type CreateInventoryProductPayload =
    z.infer<typeof inventoryProductSchema>;

export type UpdateInventoryProductPayload =
    Partial<CreateInventoryProductPayload>;