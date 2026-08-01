import Department from '@db/models/department.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '@typings/department.types.ts';
import { Role } from '@typings/auth.types.js';
import {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
  getVisibility,
} from './department.constants.ts';
import { enhanceDepartment } from './department.util.ts';
import { departmentFilterConfig } from './department.filterconfig.ts';

export const createDepartment = async (
  data: CreateDepartmentPayload
) => {
  const department = await new Department(data).save();

  return enhanceDepartment(department);
};

export const getAllDepartments = async (
  queries: Record<string, unknown>,
  role?: Role,
  options?: { branchId?: string }
) => {
  const rawQuery = options?.branchId
    ? { branch: toObjectId(options.branchId) }
    : undefined;

  return dynamicFilter(
    Department,
    departmentFilterConfig,
    queries,
    {
      visibility: getVisibility(role),
      rawQuery,
    }
  );
};

export const getDepartmentById = async (
  id: string
) => {
  return Department.findById(id);
};

export const updateDepartment = async (
  id: string,
  data: UpdateDepartmentPayload
) => {
  const updated = await Department.findByIdAndUpdate(
    id,
    data,
    UPDATE_OPTIONS
  );

  if (!updated) return null;

  return enhanceDepartment(updated);
};

export const removeDepartment = async (
  id: string
) => {
  const removed = await Department.findByIdAndUpdate(
    id,
    SOFT_DELETE,
    { new: true }
  );

  if (!removed) return null;

  return enhanceDepartment(removed);
};

export const retrieveDepartment = async (
  id: string
) => {
  const retrieved = await Department.findByIdAndUpdate(
    id,
    RETRIEVE,
    { new: true }
  );

  if (!retrieved) return null;

  return enhanceDepartment(retrieved);
};

export const eraseDepartment = async (
  id: string
) => {
  const erased = await Department.findByIdAndDelete(id);

  if (!erased) return null;

  return enhanceDepartment(erased);
};

export const setDepartmentActiveStatus = async (
  id: string,
  active: boolean
) => {
  return Department.findByIdAndUpdate(
    id,
    {
      active,
      ...(active
        ? {
            deleted: false,
            deletedAt: null,
          }
        : {}),
    },
    { new: true }
  );
};