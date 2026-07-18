import express, { Express, Request, Response } from 'express';
import { ENV } from '@config/env.config.js';
import connectDB from '@config/db.config.js';
import errorHandler from '@core/errors/handler.error.ts';
import { applySecurityMiddlewares } from '@config/security.config.js';
import { maintenanceMode } from '@core/middlewares/maintenance.middleware.js';
import { loadRoutes } from './lib/routeloader.ts';
const app: Express = express();

app.get('/', (req: Request, res: Response) => {
  res.send('SAP CRM API is running smoothly 🔐');
});

app.use(express.json());

(async () => {
  try {
    console.log('Connecting to DB...');
    if (!ENV.MONGO_URI) throw new Error('MONGO_URI is not defined');
    await connectDB(ENV.MONGO_URI);

    applySecurityMiddlewares(app);

    app.use(maintenanceMode);

    console.log('Loading routes...');
    await loadRoutes(app);

    app.use(errorHandler);

    console.log('\n' + '═'.repeat(60));
    console.log('🚀  SAP CRM API SERVER');
    console.log('═'.repeat(60));
    console.log(`🌍  Environment   : ${ENV.NODE_ENV}`);
    console.log(`🔌  Database      : Connected`);
    console.log(`📦  Routes        : Loaded`);
    console.log(`🔒  Security      : Active`);
    console.log(`✅  Status        : Running on port ${ENV.PORT || 3000}`);
    console.log('═'.repeat(60) + '\n');
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
})();

export default app;
