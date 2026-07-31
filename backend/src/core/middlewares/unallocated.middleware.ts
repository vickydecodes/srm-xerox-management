// core/middlewares/notfound.middleware.ts
import { ApiError } from "@core/errors/api.error.ts";
import { Request, Response, NextFunction } from "express";

export function unallocatedHandler(req: Request, res: Response, next: NextFunction) {
  const err = new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND");
  next(err);
}