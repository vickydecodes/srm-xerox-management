import { Router } from 'express';
// import { authMiddleware } from '@core/middlewares/auth.middleware.js';
// import { accessControl } from '@core/middlewares/access.middleware.js';
// import { zodValidate } from '@core/middlewares/zod.validator.js';
// import { ProductSchema } from './product.validator.js';

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

// router.use(authMiddleware);
// router.use(accessControl);

// const MODULE = '-product';

router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/active-status', setProductActiveStatus);
router.put('/:id/retrieve', retrieveProduct);
router.delete('/:id/erase', eraseProduct);

export default router;
