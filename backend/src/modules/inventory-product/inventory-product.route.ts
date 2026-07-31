import { Router } from "express";
// import { authMiddleware } from "@core/middlewares/auth.middleware.ts";
// import { accessControl } from "@core/middlewares/access.middleware.ts";
// import { zodValidate } from "@core/middlewares/zod.validator.ts";
// import { inventoryProductSchema } from "./inventory-product.validator.ts";

import {
    createInventoryProduct,
    getAllInventoryProducts,
    getInventoryProductById,
    updateInventoryProduct,
    deleteInventoryProduct,
    setInventoryProductActiveStatus,
    retrieveInventoryProduct,
    eraseInventoryProduct,
} from "./inventory-product.controller.ts";

const router = Router();

// router.use(authMiddleware);
// router.use(accessControl);

// const MODULE = "-inventory-product";

// router.post(
//     "/",
//     zodValidate(inventoryProductSchema),
//     createInventoryProduct
// );

router.post("/", createInventoryProduct);
router.get("/", getAllInventoryProducts);
router.get("/:id", getInventoryProductById);
router.put("/:id", updateInventoryProduct);
router.delete("/:id", deleteInventoryProduct);
router.patch(
    "/:id/active-status",
    setInventoryProductActiveStatus
);
router.put("/:id/retrieve", retrieveInventoryProduct);
router.delete("/:id/erase", eraseInventoryProduct);

export default router;