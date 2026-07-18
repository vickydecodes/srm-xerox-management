import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import sendResponse from '@core/constants/responsewrapper.constant.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const bearerToken = req.headers?.authorization?.split(' ')[1];
  const token = req.cookies?.access_token || bearerToken;

  if (!token) {
    return sendResponse.unauthorized(res, 'Unauthenticated');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Invalid Token:', err);
    return sendResponse.unauthorized(res, 'Invalid or expired token');
  }
};
