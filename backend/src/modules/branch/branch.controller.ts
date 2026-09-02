import { Request, Response } from 'express';

import * as service from './branch.services.ts';

import {
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@typings/branch.types.ts';
import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const branchStatus = createStatusControllers(
  {
    remove: service.removeBranch,
    setActiveStatus: service.setBranchActiveStatus,
    retrieve: service.retrieveBranch,
  },
  'branch'
);

const controllers = {
  createBranch: async (
    req: Request<{}, {}, CreateBranchPayload>,
    res: Response
  ) => {
    const branch = await service.createBranch(req.body);

    return sendResponse.created(
      res,
      'Branch',
      branch
    );
  },

  getAllBranches: async (
    req: Request,
    res: Response
  ) => {
    const queries = buildQuery(req);

    const result = await service.getAllBranches(
      queries,
      'super_admin'
    );

    return sendResponse.paginated(
      res,
      'branch',
      result
    );
  },

  getBranchById: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const branch = await service.getBranchById(id);

    if (!branch)
      return sendResponse.notFound(
        res,
        'branch'
      );

    return sendResponse.fetched(
      res,
      'branch',
      branch
    );
  },

  updateBranch: async (
    req: Request<
      { id: string },
      {},
      UpdateBranchPayload
    >,
    res: Response
  ) => {
    const { id } = req.params;

    const branch = await service.updateBranch(
      id,
      req.body
    );

    if (!branch)
      return sendResponse.notFound(
        res,
        'branch'
      );

    return sendResponse.updated(
      res,
      'branch',
      branch
    );
  },

  deleteBranch: branchStatus.softDelete,

  setBranchActiveStatus:
    branchStatus.setActiveStatus,

  retrieveBranch:
    branchStatus.retrieve,

  eraseBranch: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const branch = await service.eraseBranch(id);

    if (!branch)
      return sendResponse.notFound(
        res,
        'branch'
      );

    return sendResponse.deleted(
      res,
      'branch'
    );
  },
};

export const {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  setBranchActiveStatus,
  retrieveBranch,
  eraseBranch,
} = wrapControllers(controllers);