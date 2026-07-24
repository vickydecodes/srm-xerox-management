import { Request, Response } from 'express';

import * as service from './product.services.ts';

import { extractBranch } from './product.constants.ts';
import {
  CreateInventoryProductPayload,
  UpdateInventoryProductPayload,
} from '@typings/inventory.types.ts';
import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { log } from '@core/constants/logger.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const productStatus = createStatusControllers(
  {
    remove: service.removeProduct,
    setActiveStatus: service.setProductActiveStatus,
    retrieve: service.retrieveProduct,
  },
  'inventory product'
);

const controllers = {
  createInventoryProduct: async (
    req: Request<{}, {}, CreateInventoryProductPayload>,
    res: Response
  ) => {
    log('info', 'Create inventory product request received');
    log('debug', 'Inventory product payload', { body: req.body });
    const product = await service.createProduct(req.body);
    log('success', 'Inventory product created', { productId: product?._id });
    return sendResponse.created(res, 'inventory product', product);
  },

  getAllInventoryProducts: async (req: Request, res: Response) => {
    log('info', 'Get all inventory products request received');
    log('debug', 'Inventory product list query', { query: req.query, role: 'super_admin' });
    const queries = buildQuery(req);
    const branch = extractBranch(queries);
    const result = await service.getAllProducts(queries, 'super_admin', { branchId: branch });
    log('success', 'Inventory products fetched', { count: result?.data?.length ?? 0 });
    return sendResponse.paginated(res, 'inventory product', result);
  },

  getInventoryProductById: async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    log('info', 'Get inventory product by id request', { id });
    const product = await service.getProductById(id);
    if (!product) {
      log('warn', 'Inventory product not found', { id });
      return sendResponse.notFound(res, 'inventory product');
    }
    log('success', 'Inventory product fetched', { id });
    return sendResponse.fetched(res, 'inventory product', product);
  },

  updateInventoryProduct: async (
    req: Request<{ id: string }, {}, UpdateInventoryProductPayload>,
    res: Response
  ) => {
    const { id } = req.params;
    log('info', 'Update inventory product request', { id });
    log('debug', 'Inventory product update payload', { id, body: req.body });
    const product = await service.updateProduct(id, req.body);
    if (!product) {
      log('warn', 'Inventory product not found for update', { id });
      return sendResponse.notFound(res, 'inventory product');
    }
    log('success', 'Inventory product updated', { id });
    return sendResponse.updated(res, 'inventory product', product);
  },

  deleteInventoryProduct: productStatus.softDelete,
  setInventoryProductActiveStatus: productStatus.setActiveStatus,
  retrieveInventoryProduct: productStatus.retrieve,

  eraseInventoryProduct: async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    log('info', 'Erase inventory product request', { id });
    const product = await service.eraseProduct(id);
    if (!product) {
      log('warn', 'Inventory product not found for erase', { id });
      return sendResponse.notFound(res, 'inventory product');
    }
    log('success', 'Inventory product erased', { id });
    return sendResponse.deleted(res, 'inventory product');
  },
};

export const {
  createInventoryProduct,
  getAllInventoryProducts,
  getInventoryProductById,
  updateInventoryProduct,
  deleteInventoryProduct,
  setInventoryProductActiveStatus,
  retrieveInventoryProduct,
  eraseInventoryProduct,
} = wrapControllers(controllers);
