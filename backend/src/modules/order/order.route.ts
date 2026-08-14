import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
// import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';

import {
  createOrderSchema,
  updateOrderSchema,
} from './order.validator.js';


import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  retrieveOrder,
  eraseOrder,
  submitOrder,
  branchApproveOrder,
  vpApproveOrder,
} from './order.controller.js';


const router = Router();


router.use(authMiddleware);


// router.use(accessControl);


// const MODULE = '-order';


router.post(
  '/',
  zodValidate(
    createOrderSchema,
    'body',
    'CreateOrderSchema'
  ),
  createOrder
);


router.get('/', getAllOrders);


router.get('/:id', getOrderById);


router.put(
  '/:id',
  zodValidate(
    updateOrderSchema,
    'body',
    'UpdateOrderSchema'
  ),
  updateOrder
);


router.delete('/:id', deleteOrder);


router.put('/:id/retrieve', retrieveOrder);


router.delete('/:id/erase', eraseOrder);


router.patch('/:id/submit', submitOrder);
router.patch('/:id/branch-approve', branchApproveOrder);
router.patch('/:id/vp-approve', vpApproveOrder);


export default router;