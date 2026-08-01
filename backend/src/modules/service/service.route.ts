import { Router } from "express";
// import { authMiddleware } from "@core/middlewares/auth.middleware.js";
// import { accessControl } from "@core/middlewares/access.middleware.js";
// import { zodValidate } from "@core/middlewares/zod.validator.js";
// import { serviceSchema } from "./service.validator.js";

import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    setServiceActiveStatus,
    retrieveService,
    eraseService,
} from "./service.controller.js";

const router = Router();

// router.use(authMiddleware);
// router.use(accessControl);

// const MODULE = "-service";

router.post("/", createService);
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.put("/:id", updateService);
router.delete("/:id", deleteService);
router.patch("/:id/active-status", setServiceActiveStatus);
router.put("/:id/retrieve", retrieveService);
router.delete("/:id/erase", eraseService);

export default router;