import { Router } from 'express';
// import { authMiddleware } from '@core/middlewares/auth.middleware.js';
// import { accessControl } from '@core/middlewares/access.middleware.js';
// import { zodValidate } from '@core/middlewares/zod.validator.js';
// import { inventoryProductSchema } from './product.validator.js';

import {
  createInventoryProduct,
  getAllInventoryProducts,
  getInventoryProductById,
  updateInventoryProduct,
  deleteInventoryProduct,
  setInventoryProductActiveStatus,
  retrieveInventoryProduct,
  eraseInventoryProduct,
} from './product.controller.js';

const router = Router();

// router.use(authMiddleware);
// router.use(accessControl);

// const MODULE = 'inventory-product';

router.post('/products', createInventoryProduct);
router.get('/products', getAllInventoryProducts);
router.get('/products/:id', getInventoryProductById);
router.put('/products/:id', updateInventoryProduct);
router.delete('/products/:id', deleteInventoryProduct);
router.patch('/products/:id/active-status', setInventoryProductActiveStatus);
router.put('/products/:id/retrieve', retrieveInventoryProduct);
router.delete('/products/:id/erase', eraseInventoryProduct);

export default router;
