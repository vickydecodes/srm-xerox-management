import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';
import { ENV } from '@config/env.config.js';

const BYPASS_PATHS = ['/', '/health', '/api/v1/health'];

export const maintenanceMode = (req: Request, res: Response, next: NextFunction): void => {
  const isMaintenanceOn = ENV.MAINTENANCE_MODE === 'true';

  if (!isMaintenanceOn) return next();

  if (BYPASS_PATHS.includes(req.path)) return next();

  if (req.headers['x-maintenance-bypass'] === ENV.MAINTENANCE_BYPASS_KEY) {
    return next();
  }

  res.set('Retry-After', '3600');
  res.status(503).json({
    success: false,
    status: 'maintenance',
    message: 'SRM Xerox App is currently under maintenance. Please try again shortly.',
  });
};
