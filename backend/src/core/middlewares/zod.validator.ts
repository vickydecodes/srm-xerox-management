import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import sendResponse from '@core/constants/responsewrapper.constant.js';

const isDev = process.env.NODE_ENV !== 'production';

export const zodValidate =
  (
    schema: ZodSchema,
    property: 'body' | 'query' | 'params' = 'body',
    schemaName = 'UnknownSchema'
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (isDev) {
      console.log('────────────────────────────────────');
      console.log('🔍 ZOD VALIDATION STARTED');
      console.log('📌 Schema:', schemaName);
      console.log('📌 Property:', property);
      console.log('📌 Route:', `${req.method} ${req.originalUrl}`);
      console.log('📥 Incoming Data:', req[property]);
    }

    const result = schema.safeParse(req[property]);

    if (!result.success) {
      const issues = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      if (isDev) {
        console.log('❌ VALIDATION FAILED');
        console.log('🧨 Errors:', issues);
        console.log('────────────────────────────────────');
      }

      return sendResponse.validationError(res, issues.map((i) => i.message).join(', '));
    }

    if (isDev) {
      console.log('✅ VALIDATION PASSED');
      console.log('🧼 Sanitized Data:', result.data);
      console.log('➡️ Forwarding to controller');
      console.log('────────────────────────────────────');
    }

    req[property] = result.data;
    next();
  };
