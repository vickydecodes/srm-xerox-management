import mongoose, { Model, Document, PipelineStage, Types } from 'mongoose';
import { analyzeSchemaPaths } from '@core/utils/schemaanalyzer.util.ts';
import { castObjectIds } from '@core/utils/parseid.util.js';
export interface FilterConfig<T> {
  searchable?: (keyof T | string)[];
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
    visibility?: 'all' | 'active-only';
    rawQuery?: Record<string, any>;
  } = {}
): Promise<PaginatedResult<T>> {
  const { searchable = [], filterable = [], sortable = [], defaultSort = 'name' } = config;

  const { populatePaths, refIdPaths } = analyzeSchemaPaths(model.schema);

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

  if (queryParams.search && searchable.length > 0) {
    const r = new RegExp(queryParams.search.trim(), 'i');
    query.$or = searchable.map((f) => ({ [f]: { $regex: r } }));
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

  const pipeline: PipelineStage[] = [{ $match: query }];

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
    $project: { password: 0, __v: 0 },
  });

  let data: any[] = [];
  let total = 0;

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
    const STUDENT_SELECT = '_id name loginId standard batches branch';

    data = await model.populate(
      data,
      populatePaths.map((path) => {
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

        if (path === 'student') {
          return {
            path: 'student',
            match,
            select: STUDENT_SELECT,
            populate: [
              { path: 'branch', select: '_id name code' },
              { path: 'standard', select: '_id name' },
              { path: 'batches', select: '_id name' },
            ],
          };
        }

        let baseSelect = ['_id', 'name'];

        if (options?.extras?.select) {
          const extras = options.extras.select.split(/[\s,]+/).filter(Boolean);

          baseSelect.push(...extras);
        }

        return {
          path,
          match,
          select: baseSelect.join(' '),
        };
      })
    );
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