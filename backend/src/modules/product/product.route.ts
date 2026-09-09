import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import {
  createProductSchema,
  updateProductSchema,
  setProductActiveStatusSchema,
} from './product.validator.js';

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  setProductActiveStatus,
  retrieveProduct,
  eraseProduct,
} from './product.controller.js';

const router = Router();

router.use(authMiddleware);

router.use(accessControl);

// const MODULE = '-product';

router.post(
  '/',
  zodValidate(
    createProductSchema,
    'body',
    'CreateProductSchema'
  ),
  createProduct
);

router.get('/', getAllProducts);

router.get('/:id', getProductById);

router.put(
  '/:id',
  zodValidate(
    updateProductSchema,
    'body',
    'UpdateProductSchema'
  ),
  updateProduct
);

router.delete('/:id', deleteProduct);

router.patch(
  '/:id/active-status',
  zodValidate(
    setProductActiveStatusSchema,
    'body',
    'SetProductActiveStatusSchema'
  ),
  setProductActiveStatus
);

router.put('/:id/retrieve', retrieveProduct);

router.delete('/:id/erase', eraseProduct);

export default router;
