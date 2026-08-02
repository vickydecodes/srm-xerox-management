import Branch from '@db/models/branch.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import {
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@typings/branch.types.ts';
import { Role } from '@typings/auth.types.js';
import {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  getVisibility,
} from './branch.constants.ts';
import { enhanceBranch } from './branch.util.ts';
import { branchFilterConfig } from './branch.filterconfig.ts';

export const createBranch = async (
  data: CreateBranchPayload
) => {
  const branch = await new Branch(data).save();

  return enhanceBranch(branch);
};

export const getAllBranches = async (
  queries: Record<string, unknown>,
  role?: Role
) => {
  return dynamicFilter(
    Branch,
    branchFilterConfig,
    queries,
    {
      visibility: getVisibility(role),
    }
  );
};

export const getBranchById = async (
  id: string
) => {
  return Branch.findById(id);
};

export const updateBranch = async (
  id: string,
  data: UpdateBranchPayload
) => {
  const updated = await Branch.findByIdAndUpdate(
    id,
    data,
    UPDATE_OPTIONS
  );

  if (!updated) return null;

  return enhanceBranch(updated);
};

export const removeBranch = async (
  id: string
) => {
  const removed = await Branch.findByIdAndUpdate(
    id,
    SOFT_DELETE,
    { new: true }
  );

  if (!removed) return null;

  return enhanceBranch(removed);
};

export const retrieveBranch = async (
  id: string
) => {
  const retrieved = await Branch.findByIdAndUpdate(
    id,
    RETRIEVE,
    { new: true }
  );

  if (!retrieved) return null;

  return enhanceBranch(retrieved);
};

export const eraseBranch = async (
  id: string
) => {
  const erased = await Branch.findByIdAndDelete(id);

  if (!erased) return null;

  return enhanceBranch(erased);
};

export const setBranchActiveStatus = async (
  id: string,
  active: boolean
) => {
  return Branch.findByIdAndUpdate(
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