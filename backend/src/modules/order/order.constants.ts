import { Types } from 'mongoose';

const extractBranch = (queries: Record<string, unknown>) => {
  const branch = (queries as Record<string, any>).branch;

  if (branch) {
    delete (queries as Record<string, any>).branch;
  }

  return branch as string | undefined;
};

const UPDATE_OPTIONS = {
  new: true,
  runValidators: true,
  context: 'query',
} as const;

const SOFT_DELETE = {
  deleted: true,
  deletedAt: new Date(),
};

const RETRIEVE = {
  deleted: false,
  deletedAt: null,
};

const toObjectId = (
  value?: string | Types.ObjectId | null
) => {
  if (!value) return null;

  if (value instanceof Types.ObjectId) return value;

  if (Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }

  return null;
};

export {
  extractBranch,
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
};