import express, { Express, Request, Response } from 'express';
import { ENV } from '@config/env.config.js';
import prisma from '@config/prisma.config.js';
import errorHandler from '@core/errors/handler.error.ts';
import { applySecurityMiddlewares } from '@config/security.config.js';
import { maintenanceMode } from '@core/middlewares/maintenance.middleware.js';
import { loadRoutes } from './lib/routeloader.ts';
import { tracer } from '@core/middlewares/tracer.middleware.ts';
import { unallocatedHandler } from '@core/middlewares/unallocated.middleware.ts';
import '@db/models/branch.model.ts'; // ensures Branch schema is registered before any populate() calls
import '@db/models/inventory.model.ts';

const app: Express = express();

app.get('/', (req: Request, res: Response) => {
  res.send('SAP CRM API is running smoothly 🔐');
});

app.use(express.json());
app.use(tracer);

export const bootstrap = async (): Promise<void> => {
  await prisma.$connect();
  console.log('✅ Connected to PostgreSQL database via Prisma');

  applySecurityMiddlewares(app);
  app.use(maintenanceMode);

  await loadRoutes(app); // Reload trigger: new routes registered


  app.use(unallocatedHandler);
  app.use(errorHandler);
};

export default app;
