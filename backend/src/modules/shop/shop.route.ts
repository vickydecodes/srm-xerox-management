import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';

import {
  createShopSchema,
  updateShopSchema,
  setShopActiveStatusSchema,
} from './shop.validator.js';

import {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  setShopActiveStatus,
  retrieveShop,
  eraseShop,
} from './shop.controller.js';

const router = Router();

router.use(authMiddleware);

router.use(accessControl);

// const MODULE = '-shop';

router.post(
  '/',
  zodValidate(
    createShopSchema,
    'body',
    'CreateShopSchema'
  ),
  createShop
);

router.get('/', getAllShops);

router.get('/:id', getShopById);

router.put(
  '/:id',
  zodValidate(
    updateShopSchema,
    'body',
    'UpdateShopSchema'
  ),
  updateShop
);

router.delete('/:id', deleteShop);

router.patch(
  '/:id/active-status',
  zodValidate(
    setShopActiveStatusSchema,
    'body',
    'SetShopActiveStatusSchema'
  ),
  setShopActiveStatus
);

router.put('/:id/retrieve', retrieveShop);

router.delete('/:id/erase', eraseShop);

export default router;
