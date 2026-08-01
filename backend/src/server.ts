// server.ts
import { ENV } from '@config/env.config.js';
import app, { bootstrap } from './app.ts';

(async () => {
  try {
    await bootstrap();

    app.listen(ENV.PORT as number, '0.0.0.0', () => {
      console.log(`✅ SRM Xerox Server running on port ${ENV.PORT} (${ENV.NODE_ENV}) — REST`);
    });
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
})();