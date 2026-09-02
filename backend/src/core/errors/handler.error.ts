import { Request, Response, NextFunction } from 'express';
import sendResponse from '../constants/responsewrapper.constant.ts';
import { log, logErrorToDB } from '../constants/logger.constant.ts';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  
  if (!err.statusCode) {
    if (err.name === 'ValidationError') {
      err.statusCode = 400;
      err.code = err.code ?? 'VALIDATION_ERROR';
    } else if (err.name === 'CastError') {
      err.statusCode = 400;
      err.code = err.code ?? 'CAST_ERROR';
      err.message = `Invalid value for field "${err.path}": ${err.value}`;
    } else if (err.code === 11000) {
      
      err.statusCode = 409;
      err.code = err.code ?? 'DUPLICATE_KEY';
    }
  }

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
    stack: err.stack,
  });

  return sendResponse.error(res, err.caller || 'server', err);
};

export default errorHandler;