import { ENV } from '@config/env.config.js';
import app from './app.ts';
// Wrap the Express app in a raw http.Server so Socket.IO can attach to the
// same port instead of needing a second process/port for realtime.

app.listen(ENV.PORT as number, '0.0.0.0', () => {
  console.log(
    `✅SRM Xerox Server running on port ${ENV.PORT} (${ENV.NODE_ENV}) — REST + Socket.IO`
  );
});
