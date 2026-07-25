import { Request, Response, NextFunction } from 'express';
import sendResponse from '../constants/responsewrapper.constant.ts';
import { log, logErrorToDB } from '../constants/logger.constant.ts';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = err.requestId ?? req.requestId;
  const statusCode = err.statusCode ?? 500;

  log(
    'error',
    `[${requestId ?? '-'}] ${err.caller ?? 'unknown'} failed — ${err.method ?? req.method} ${err.route ?? req.originalUrl} (${statusCode}) ${err.code ? `[${err.code}]` : ''} — ${err.message}`
  );

  logErrorToDB({
    ...err,
    requestId,
    message: err.message,
    stack: err.stack, // full stack still goes to DB, just not the console
  });

  return sendResponse.error(res, err.caller || "server", err);
};

export default errorHandler;
