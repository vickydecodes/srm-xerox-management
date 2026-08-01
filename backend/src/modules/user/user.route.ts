import { Router } from "express";
// import { authMiddleware } from "@core/middlewares/auth.middleware.js";
// import { accessControl } from "@core/middlewares/access.middleware.js";
// import { zodValidate } from "@core/middlewares/zod.validator.js";
// import { userSchema } from "./user.validator.js";

import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    setUserActiveStatus,
    retrieveUser,
    eraseUser,
} from "./user.controller.js";

const router = Router();

// router.use(authMiddleware);
// router.use(accessControl);

// const MODULE = "-user";

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/active-status", setUserActiveStatus);
router.put("/:id/retrieve", retrieveUser);
router.delete("/:id/erase", eraseUser);

export default router;