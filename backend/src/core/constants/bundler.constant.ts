import { Types } from 'mongoose';
import { Role } from '@typings/auth.types.js';
import { log } from '@core/constants/logger.constant.ts';

const ROLE = { SUPER_ADMIN: 'super_admin' } as const;

const UPDATE_OPTIONS = {
  new: true,
  runValidators: true,
  context: 'query',
} as const;

const SOFT_DELETE = () => ({
  active: false,
  deleted: true,
  deletedAt: new Date(),
});

const RETRIEVE = {
  active: true,
  deleted: false,
  deletedAt: null,
} as const;

const toObjectId = (value?: string | Types.ObjectId | null) => {
  if (!value) return null;
  if (value instanceof Types.ObjectId) return value;
  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
  return null;
};

const getVisibility = (role?: Role) => (role === ROLE.SUPER_ADMIN ? 'all' : 'active-only');

const extractBranch = (queries: Record<string, unknown>) => {
  const branch = (queries as Record<string, any>).branch;
  if (branch) delete (queries as Record<string, any>).branch;
  return branch as string | undefined;
};

/**
 * One entry per model owned by a module: the model itself, and how to
 * enhance a raw doc of that model.
 */
type ModelEntry<T> = {
  model: T;
  enhancer: (doc: any) => any;
};

type ModuleConstantsConfig = {
  module: string;
  models: Record<string, ModelEntry<any>>;
  extraHelpers?: Record<string, unknown>;
};

const buildModuleConstants = ({
  module,
  models,
  extraHelpers = {},
}: ModuleConstantsConfig) => ({
  module: module,
  models,
  log: {
    info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
    debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
    success: (message: string, meta?: Record<string, unknown>) => log('success', message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  },
  presets: {
    UPDATE_OPTIONS,
    SOFT_DELETE,
    RETRIEVE,
  },
  helpers: {
    toObjectId,
    getVisibility,
    extractBranch,
    ...extraHelpers,
  },
});

type ModuleBundle = ReturnType<typeof buildModuleConstants>;

const createModuleRegistry = <T extends ModuleBundle[]>(...bundles: T) =>
  bundles.reduce(
    (registry, bundle) => ({ ...registry, [bundle.module]: bundle }),
    {} as Record<string, ModuleBundle>
  );

export { buildModuleConstants, createModuleRegistry };
export type { ModelEntry, ModuleConstantsConfig, ModuleBundle };
