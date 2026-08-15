import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
// import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import {
  createCreditPaymentSchema,
  updateCreditPaymentSchema,
} from './credit.validator.js';


import {
  createCreditPayment,
  getAllCreditPayments,
  getCreditPaymentById,
  updateCreditPayment,
} from './credit.controller.js';


const router = Router();


router.use(authMiddleware);


// router.use(accessControl);


// const MODULE = '-credit';


router.post(
  '/',
  zodValidate(
    createCreditPaymentSchema,
    'body',
    'CreateCreditPaymentSchema'
  ),
  createCreditPayment
);


router.get('/', getAllCreditPayments);


router.get('/:id', getCreditPaymentById);


router.put(
  '/:id',
  zodValidate(
    updateCreditPaymentSchema,
    'body',
    'UpdateCreditPaymentSchema'
  ),
  updateCreditPayment
);


export default router;