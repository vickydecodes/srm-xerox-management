import { Router } from "express";
import { authMiddleware } from "@core/middlewares/auth.middleware.js";
// import { accessControl } from "@core/middlewares/access.middleware.js";
import { zodValidate } from "@core/middlewares/zod.validator.js";
import {
  createUserSchema,
  updateUserSchema,
  setUserActiveStatusSchema,
} from "./user.validator.js";

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

router.use(authMiddleware);

// router.use(accessControl);

// const MODULE = "-user";

router.post(
  "/",
  zodValidate(
    createUserSchema,
    "body",
    "CreateUserSchema"
  ),
  createUser
);

router.get("/", getAllUsers);

router.get("/:id", getUserById);

router.put(
  "/:id",
  zodValidate(
    updateUserSchema,
    "body",
    "UpdateUserSchema"
  ),
  updateUser
);

router.delete("/:id", deleteUser);

router.patch(
  "/:id/active-status",
  zodValidate(
    setUserActiveStatusSchema,
    "body",
    "SetUserActiveStatusSchema"
  ),
  setUserActiveStatus
);

router.put("/:id/retrieve", retrieveUser);

router.delete("/:id/erase", eraseUser);

export default router;