import { Router } from "express";
import { authMiddleware } from "@core/middlewares/auth.middleware.js";
// import { accessControl } from "@core/middlewares/access.middleware.js";
import { zodValidate } from "@core/middlewares/zod.validator.js";
import {
  createInventoryProductSchema,
  updateInventoryProductSchema,
  setInventoryProductActiveStatusSchema,
} from "./inventory-product.validator.js";

import {
  createInventoryProduct,
  getAllInventoryProducts,
  getInventoryProductById,
  updateInventoryProduct,
  deleteInventoryProduct,
  setInventoryProductActiveStatus,
  retrieveInventoryProduct,
  eraseInventoryProduct,
} from "./inventory-product.controller.js";

const router = Router();

router.use(authMiddleware);

// router.use(accessControl);

// const MODULE = "-inventory-product";

router.post(
  "/",
  zodValidate(
    createInventoryProductSchema,
    "body",
    "CreateInventoryProductSchema"
  ),
  createInventoryProduct
);

router.get("/", getAllInventoryProducts);

router.get("/:id", getInventoryProductById);

router.put(
  "/:id",
  zodValidate(
    updateInventoryProductSchema,
    "body",
    "UpdateInventoryProductSchema"
  ),
  updateInventoryProduct
);

router.delete("/:id", deleteInventoryProduct);

router.patch(
  "/:id/active-status",
  zodValidate(
    setInventoryProductActiveStatusSchema,
    "body",
    "SetInventoryProductActiveStatusSchema"
  ),
  setInventoryProductActiveStatus
);

router.put("/:id/retrieve", retrieveInventoryProduct);

router.delete("/:id/erase", eraseInventoryProduct);

export default router;