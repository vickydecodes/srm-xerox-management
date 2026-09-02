import { Request, Response } from 'express';

import * as service from './product.services.ts';

import { extractBranch } from './product.constants.ts';
import { CreateProductPayload, UpdateProductPayload } from '@typings/product.types.ts';
import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const productStatus = createStatusControllers(
  {
    remove: service.removeProduct,
    setActiveStatus: service.setProductActiveStatus,
    retrieve: service.retrieveProduct,
  },
  'product'
);

const controllers = {
  createProduct: async (req: Request<{}, {}, CreateProductPayload>, res: Response) => {
    const product = await service.createProduct(req.body);
    return sendResponse.created(res, 'Product', product);
  },

  getAllProducts: async (req: Request, res: Response) => {
    const queries = buildQuery(req);
    const branch = extractBranch(queries);
    const result = await service.getAllProducts(queries, 'super_admin', { branchId: branch });
    return sendResponse.paginated(res, 'product', result);
  },

  getProductById: async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const product = await service.getProductById(id);
    if (!product) return sendResponse.notFound(res, 'product');
    return sendResponse.fetched(res, 'product', product);
  },

  updateProduct: async (req: Request<{ id: string }, {}, UpdateProductPayload>, res: Response) => {
    const { id } = req.params;
    const product = await service.updateProduct(id, req.body);
    if (!product) return sendResponse.notFound(res, 'product');
    return sendResponse.updated(res, 'product', product);
  },

  deleteProduct: productStatus.softDelete,
  setProductActiveStatus: productStatus.setActiveStatus,
  retrieveProduct: productStatus.retrieve,

  eraseProduct: async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const product = await service.eraseProduct(id);
    if (!product) return sendResponse.notFound(res, 'product');
    return sendResponse.deleted(res, 'product');
  },
};

export const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  setProductActiveStatus,
  retrieveProduct,
  eraseProduct,
} = wrapControllers(controllers);
