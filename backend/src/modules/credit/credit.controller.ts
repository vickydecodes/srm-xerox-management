import { Request, Response } from 'express';


import { AuthRequest } from '@core/middlewares/auth.middleware.ts';


import * as service from './credit.services.ts';


import {
  CreateCreditPaymentPayload,
  UpdateCreditPaymentPayload,
} from '@typings/credit.types.ts';


import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';


const controllers = {
  createCreditPayment: async (
    req: AuthRequest & {
      body: CreateCreditPaymentPayload;
    },
    res: Response
  ) => {
    const creditPayment = await service.createCreditPayment(
      req.body,
      req.user!.id
    );

    return sendResponse.created(
      res,
      'Credit Payment',
      creditPayment
    );
  },


  getAllCreditPayments: async (
    req: Request,
    res: Response
  ) => {
    const queries = buildQuery(req);

    const result = await service.getAllCreditPayments(
      queries
    );

    return sendResponse.paginated(
      res,
      'credit payment',
      result
    );
  },


  getCreditPaymentById: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const creditPayment =
      await service.getCreditPaymentById(id);

    if (!creditPayment)
      return sendResponse.notFound(
        res,
        'credit payment'
      );

    return sendResponse.fetched(
      res,
      'credit payment',
      creditPayment
    );
  },


  updateCreditPayment: async (
    req: Request<
      { id: string },
      {},
      UpdateCreditPaymentPayload
    >,
    res: Response
  ) => {
    const { id } = req.params;

    const creditPayment =
      await service.updateCreditPayment(
        id,
        req.body
      );

    if (!creditPayment)
      return sendResponse.notFound(
        res,
        'credit payment'
      );

    return sendResponse.updated(
      res,
      'credit payment',
      creditPayment
    );
  },
};


export const {
  createCreditPayment,
  getAllCreditPayments,
  getCreditPaymentById,
  updateCreditPayment,
} = wrapControllers(controllers);