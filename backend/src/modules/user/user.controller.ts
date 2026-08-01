import { Request, Response } from 'express';

import * as service from './user.services.ts';

import { extractBranch } from './user.constants.ts';
import { CreateUserPayload, UpdateUserPayload } from '@typings/user.types.ts';
import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const userStatus = createStatusControllers(
  {
    remove: service.removeUser,
    setActiveStatus: service.setUserActiveStatus,
    retrieve: service.retrieveUser,
  },
  'user'
);

const controllers = {
  createUser: async (
    req: Request<{}, {}, CreateUserPayload>,
    res: Response
  ) => {
    const user = await service.createUser(req.body);
    return sendResponse.created(res, 'User', user);
  },

  getAllUsers: async (req: Request, res: Response) => {
    const queries = buildQuery(req);
    const branch = extractBranch(queries);

    const result = await service.getAllUsers(
      queries,
      'super_admin',
      { branchId: branch }
    );

    return sendResponse.paginated(res, 'user', result);
  },

  getUserById: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const user = await service.getUserById(id);

    if (!user) return sendResponse.notFound(res, 'user');

    return sendResponse.fetched(res, 'user', user);
  },

  updateUser: async (
    req: Request<{ id: string }, {}, UpdateUserPayload>,
    res: Response
  ) => {
    const { id } = req.params;

    const user = await service.updateUser(id, req.body);

    if (!user) return sendResponse.notFound(res, 'user');

    return sendResponse.updated(res, 'user', user);
  },

  deleteUser: userStatus.softDelete,

  setUserActiveStatus: userStatus.setActiveStatus,

  retrieveUser: userStatus.retrieve,

  eraseUser: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const user = await service.eraseUser(id);

    if (!user) return sendResponse.notFound(res, 'user');

    return sendResponse.deleted(res, 'user');
  },
};

export const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  setUserActiveStatus,
  retrieveUser,
  eraseUser,
} = wrapControllers(controllers);