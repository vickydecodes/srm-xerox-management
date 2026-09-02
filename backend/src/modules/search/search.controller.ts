import { Request, Response } from 'express';
import * as service from './search.services.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const controllers = {
  searchProducts: async (
    req: Request,
    res: Response
  ) => {
    const { q, ...extraParams } = req.query as { q?: string; [key: string]: any };

    const results = await service.searchProducts(q || '', extraParams);

    return sendResponse.fetched(
      res,
      'products',
      results
    );
  },
};

export const { searchProducts } = wrapControllers(controllers);
