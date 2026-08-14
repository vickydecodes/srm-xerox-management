import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import { searchQuerySchema } from './search.validator.ts';
import { searchProducts } from './search.controller.ts';

const router = Router();

router.use(authMiddleware);

router.get(
  '/products',
  zodValidate(
    searchQuerySchema,
    'query',
    'SearchQuerySchema'
  ),
  searchProducts
);

export const basePath = '/search';

export default router;
