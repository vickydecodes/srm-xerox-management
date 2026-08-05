import mongoose, { Model, Document, PipelineStage, Types } from 'mongoose';
import { analyzeSchemaPaths } from '@utils/schemaanalyzer.util.ts';
import { castObjectIds } from '@core/utils/parseid.util.js';

export interface SearchableRefConfig {
  field: string; // local field holding the ObjectId, e.g. 'branch'
  ref: string; // model name registered with mongoose, e.g. 'Branch'
  matchOn: string; // field on the referenced model to regex-match, e.g. 'name'
}

export interface FilterConfig<T> {
  searchable?: (keyof T | string)[];
  searchableRefs?: SearchableRefConfig[];
  filterable?: (keyof T | string)[];
  sortable?: (keyof T | string)[];
  defaultSort?: keyof T | string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function dynamicFilter<T extends Document>(
  model: Model<T>,
  config: FilterConfig<T>,
  queryParams: Record<string, any>,
  options: PaginationOptions & {
    extras?: {
      select?: string;
    };
    nestedPopulate?: any[];
    forcePopulate?: any[]; // ← add this

    visibility?: 'all' | 'active-only';
    rawQuery?: Record<string, any>;
  } = {}
): Promise<PaginatedResult<T>> {
  mongoose.set('strictPopulate', false);
  const {
    searchable = [],
    filterable = [],
    sortable = [],
    searchableRefs = [],
    defaultSort = 'name',
  } = config;

  const { populatePaths, refIdPaths, dynamicRefPaths } = analyzeSchemaPaths(model.schema);
  console.log('populatePaths:', populatePaths);
  const dynamicRefPathSet = new Set(dynamicRefPaths.map((d) => d.path));

  const query: Record<string, any> = {};

  const visibility = options.visibility ?? 'active-only';
  const SMART_SORT_FIELDS = ['name'];
  const BUSINESS_SORT_FIELDS: any = {
    status: {
      paid: 1,
      partial: 2,
      pending: 3,
    },
  };
  const DERIVED_SORT_FIELDS: any = {
    'paymentHistory.statusUpdatedAt': {
      field: 'lastPaymentAt',
    },
  };

  if (visibility === 'active-only') {
    if (model.schema.path('active')) query.active = true;
    if (model.schema.path('deleted')) query.deleted = false;
  }

  const isFullFetch = queryParams.full === 'true' || queryParams.full === true;

  const rawQuery = (options as any).rawQuery ?? {};

  Object.assign(query, rawQuery);

  castObjectIds(query);

  filterable.forEach((field) => {
    const key = field as string;
    const value = queryParams[key];
    if (!value) return;

    const isId = Types.ObjectId.isValid(value);

    if (refIdPaths.includes(key)) {
      query[key] = isId ? new Types.ObjectId(value) : value;
      return;
    }

    if (isId) {
      query[key] = new Types.ObjectId(value);
      return;
    }

    if (key.toLowerCase().includes('date')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) query[key] = d;
      return;
    }

    if (value === 'true' || value === 'false') {
      query[key] = value === 'true';
      return;
    }

    query[key] = value;
  });

  const lookupStages: PipelineStage[] = [];
  const searchUnsetFields: string[] = [];

  if (queryParams.search && (searchable.length > 0 || searchableRefs.length > 0)) {
    const r = new RegExp(queryParams.search.trim(), 'i');
    const orConditions: Record<string, any>[] = searchable.map((f) => ({ [f]: { $regex: r } }));

    searchableRefs.forEach(({ field, ref, matchOn }) => {
      const refModel = mongoose.model(ref);
      const alias = `__search_${field.replace(/\./g, '_')}`;

      lookupStages.push({
        $lookup: {
          from: refModel.collection.name,
          localField: field,
          foreignField: '_id',
          as: alias,
        },
      });

      searchUnsetFields.push(alias);
      orConditions.push({ [`${alias}.${matchOn}`]: { $regex: r } });
    });

    query.$or = orConditions;
  }

  const sort: Record<string, 1 | -1> = { createdAt: -1 };
  const sortBy = queryParams.sortBy;

  if (sortBy && sortable.includes(sortBy)) {
    sort[sortBy] = queryParams.order === 'asc' ? 1 : -1;
  } else {
    sort[defaultSort as string] = 1;
  }

  const page = isFullFetch ? 1 : Math.max(1, Number(queryParams.page) || 1);
  const limit = isFullFetch ? 0 : Math.min(100, Math.max(1, Number(queryParams.limit) || 10));

  const sortField = Object.keys(sort)[0];
  const sortOrder = sort[sortField];

  const pipeline: PipelineStage[] = [...lookupStages, { $match: query }];

  if (DERIVED_SORT_FIELDS[sortField]) {
    pipeline.push({
      $addFields: {
        lastPaymentAt: {
          $max: {
            $map: {
              input: '$paymentHistory',
              as: 'p',
              in: {
                $ifNull: ['$$p.statusUpdatedAt', '$$p.createdAt'],
              },
            },
          },
        },
      },
    });

    pipeline.push({
      $sort: {
        lastPaymentAt: sortOrder,
        createdAt: -1, // stable secondary sort
      },
    });
  } else if (BUSINESS_SORT_FIELDS[sortField]) {
    const map = BUSINESS_SORT_FIELDS[sortField];

    pipeline.push(
      {
        $addFields: {
          __businessOrder: {
            $switch: {
              branches: Object.entries(map).map(([key, value]) => ({
                case: { $eq: [`$${sortField}`, key] },
                then: value,
              })),
              default: 999,
            },
          },
        },
      },
      {
        $sort: {
          __businessOrder: sortOrder,
          createdAt: -1, // stable secondary sort
        },
      },
      {
        $project: {
          __businessOrder: 0,
        },
      }
    );
  } else if (SMART_SORT_FIELDS.includes(sortField)) {
    pipeline.push(
      {
        $addFields: {
          __cleanValue: {
            $toLower: {
              $trim: { input: { $toString: `$${sortField}` } },
            },
          },

          __typePriority: {
            $cond: [
              {
                $regexMatch: {
                  input: '$__cleanValue',
                  regex: /^[a-z]+$/,
                },
              },
              0,
              1,
            ],
          },

          __numericPart: {
            $let: {
              vars: {
                match: {
                  $regexFind: {
                    input: '$__cleanValue',
                    regex: /\d+/,
                  },
                },
              },
              in: {
                $cond: [{ $ne: ['$$match', null] }, { $toInt: '$$match.match' }, 999999],
              },
            },
          },
        },
      },
      {
        $sort: {
          __typePriority: 1,
          __numericPart: 1,
          __cleanValue: sortOrder,
        },
      },
      {
        $project: {
          __cleanValue: 0,
          __typePriority: 0,
          __numericPart: 0,
        },
      }
    );
  } else {
    pipeline.push({ $sort: sort });
  }

  pipeline.push({
    $project: {
      password: 0,
      __v: 0,
      ...Object.fromEntries(searchUnsetFields.map((f) => [f, 0])),
    },
  });

  let data: any[];
  let total: number;

  if (isFullFetch) {
    data = await model.aggregate(pipeline);
    total = data.length;
  } else {
    const [result] = await model.aggregate([
      ...pipeline,
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    data = result?.data ?? [];
    total = result?.total?.[0]?.count ?? 0;
  }

  if (populatePaths.length > 0) {
    data = await model.populate(
      data,
      populatePaths.map((path) => {
        // NEW: dynamic refs (refPath) — let mongoose resolve the model per-document.
        // schemaPath.options.ref is undefined for these, so skip the static-ref logic below.
        if (dynamicRefPathSet.has(path)) {

          const selectByModel: Record<string, string> = {
            InventoryRequest: '_id status quantity createdAt',
            InventoryAllocation: '_id status quantity createdAt',
          };


          return { path };
        }

        const schemaPath: any = model.schema.path(path);
        let refModelName = null;

        if (schemaPath?.options?.ref) {
          refModelName = schemaPath.options.ref;
        }

        if (schemaPath?.$embeddedSchemaType?.options?.ref) {
          refModelName = schemaPath.$embeddedSchemaType.options.ref;
        }

        let match: any = undefined;

        if (refModelName) {
          const refSchema = mongoose.model(refModelName)?.schema;
          if (refSchema?.path('active') && refSchema?.path('deleted')) {
            match = { active: true, deleted: false };
          }
        }

        if (path === 'materials.product') {
          return {
            path: 'materials.product',
            match,
            select: '_id product variant price quantity active',
            populate: [
              { path: 'product', select: '_id name code' }
            ]
          };
        }

        if (path === 'inventory') {
          return {
            path: 'inventory',
            select: '_id code branch',
            options: { strictPopulate: false },
            populate: [
              {
                path: 'branch',
                select: '_id name code',
              }
            ],
          };
        }

        if (path === 'history.source') {
          return {
            path: 'history.source',
            select: '_id code branch',
            options: { strictPopulate: false },
            populate: [{ path: 'branch', select: '_id name code' }],
          };
        }

        const baseSelect = ['_id', 'name', 'code'];

        if (options?.extras?.select) {
          const extras = options.extras.select.split(/[\s,]+/).filter(Boolean);

          baseSelect.push(...extras);
        }

        const nestedPopulate = options?.nestedPopulate?.find((p) => p.path === path);

        return {
          path,
          match,
          select: baseSelect.join(' '),
          ...(nestedPopulate && { populate: nestedPopulate.populate }),
        };
      }),
    );

    if (options?.forcePopulate && options.forcePopulate.length > 0) {
      data = await model.populate(data, options.forcePopulate);
    }
  }

  const pages = limit === 0 ? 1 : Math.ceil(total / limit);

  return {
    success: true,
    message: 'Data fetched successfully',
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
}