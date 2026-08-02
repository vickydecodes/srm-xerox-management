import { Request, Response } from 'express';

import * as service from './department.services.ts';

import { extractBranch } from './department.constants.ts';
import {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '@typings/department.types.ts';
import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const departmentStatus = createStatusControllers(
  {
    remove: service.removeDepartment,
    setActiveStatus: service.setDepartmentActiveStatus,
    retrieve: service.retrieveDepartment,
  },
  'department'
);

const controllers = {
  createDepartment: async (
    req: Request<{}, {}, CreateDepartmentPayload>,
    res: Response
  ) => {
    const department = await service.createDepartment(req.body);

    return sendResponse.created(
      res,
      'Department',
      department
    );
  },

  getAllDepartments: async (
    req: Request,
    res: Response
  ) => {
    const queries = buildQuery(req);

    const branch = extractBranch(queries);

    const result = await service.getAllDepartments(
      queries,
      'super_admin',
      { branchId: branch }
    );

    return sendResponse.paginated(
      res,
      'department',
      result
    );
  },

  getDepartmentById: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const department = await service.getDepartmentById(id);

    if (!department)
      return sendResponse.notFound(
        res,
        'department'
      );

    return sendResponse.fetched(
      res,
      'department',
      department
    );
  },

  updateDepartment: async (
    req: Request<
      { id: string },
      {},
      UpdateDepartmentPayload
    >,
    res: Response
  ) => {
    const { id } = req.params;

    const department = await service.updateDepartment(
      id,
      req.body
    );

    if (!department)
      return sendResponse.notFound(
        res,
        'department'
      );

    return sendResponse.updated(
      res,
      'department',
      department
    );
  },

  deleteDepartment: departmentStatus.softDelete,

  setDepartmentActiveStatus:
    departmentStatus.setActiveStatus,

  retrieveDepartment:
    departmentStatus.retrieve,

  eraseDepartment: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const department = await service.eraseDepartment(id);

    if (!department)
      return sendResponse.notFound(
        res,
        'department'
      );

    return sendResponse.deleted(
      res,
      'department'
    );
  },
};

export const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  setDepartmentActiveStatus,
  retrieveDepartment,
  eraseDepartment,
} = wrapControllers(controllers);