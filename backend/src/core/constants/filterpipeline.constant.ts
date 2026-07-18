import { Model, Document, PipelineStage, Types } from 'mongoose';

export interface FilterConfig {
  searchable?: string[];

  filterable?: string[];

  sortable?: string[];

  defaultSort?: string;

  dateRangeField?: string;

  businessSort?: Record<string, Record<string, number>>;

  smartSort?: string[];
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

export async function filterPipeline<T extends Document>(
  model: Model<T>,
  basePipeline: PipelineStage[],
  config: FilterConfig,
  queryParams: Record<string, any> = {},
  options: {
    prependStages?: PipelineStage[];
  } = {}
): Promise<PaginatedResult<T>> {
  const {
    searchable = [],
    filterable = [],
    sortable = [],
    defaultSort = 'createdAt',
    dateRangeField,
    businessSort = {},
    smartSort = [],
  } = config;

  const pipeline: PipelineStage[] = [...(options.prependStages ?? []), ...basePipeline];

  const match: Record<string, any> = {};

  if (queryParams.search && searchable.length > 0) {
    const regex = new RegExp(String(queryParams.search).trim(), 'i');
    match.$or = searchable.map((f) => ({ [f]: { $regex: regex } }));
  }

  for (const field of filterable) {
    const value = queryParams[field];
    if (value == null || value === '') continue;

    const looksLikeObjectId = field.endsWith('._id') || field.endsWith('Id');

    if (looksLikeObjectId && Types.ObjectId.isValid(value)) {
      match[field] = new Types.ObjectId(value);
    } else if (value === 'true' || value === 'false') {
      match[field] = value === 'true';
    } else if (!isNaN(Number(value)) && value !== '') {
      match[field] = value;
    } else {
      match[field] = value;
    }
  }

  if (dateRangeField && (queryParams.dateFrom || queryParams.dateTo)) {
    const range: Record<string, Date> = {};
    if (queryParams.dateFrom) range.$gte = new Date(queryParams.dateFrom);
    if (queryParams.dateTo) range.$lte = new Date(queryParams.dateTo);
    match[dateRangeField] = range;
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  const rawSortBy = queryParams.sortBy as string | undefined;
  const order: 1 | -1 = queryParams.order === 'asc' ? 1 : -1;
  const sortBy = rawSortBy && sortable.includes(rawSortBy) ? rawSortBy : defaultSort;

  if (businessSort[sortBy]) {
    const map = businessSort[sortBy];
    pipeline.push(
      {
        $addFields: {
          __biz: {
            $switch: {
              branches: Object.entries(map).map(([k, v]) => ({
                case: { $eq: [`$${sortBy}`, k] },
                then: v,
              })),
              default: 999,
            },
          },
        },
      },
      { $sort: { __biz: order, createdAt: -1 } },
      { $project: { __biz: 0 } }
    );
  } else if (smartSort.includes(sortBy)) {
    pipeline.push(
      {
        $addFields: {
          __cv: { $toLower: { $trim: { input: { $toString: `$${sortBy}` } } } },
          __tp: {
            $cond: [
              {
                $regexMatch: {
                  input: { $toLower: { $trim: { input: { $toString: `$${sortBy}` } } } },
                  regex: /^[a-z]+$/,
                },
              },
              0,
              1,
            ],
          },
          __np: {
            $let: {
              vars: {
                m: {
                  $regexFind: {
                    input: { $toLower: { $trim: { input: { $toString: `$${sortBy}` } } } },
                    regex: /\d+/,
                  },
                },
              },
              in: { $cond: [{ $ne: ['$$m', null] }, { $toInt: '$$m.match' }, 999999] },
            },
          },
        },
      },
      { $sort: { __tp: 1, __np: 1, __cv: order } },
      { $project: { __cv: 0, __tp: 0, __np: 0 } }
    );
  } else {
    if (sortBy === 'createdAt') {
      pipeline.push({ $sort: { createdAt: order } });
    } else {
      pipeline.push({ $sort: { [sortBy]: order, createdAt: -1 } });
    }
  }

  const isFullFetch = queryParams.full === 'true' || queryParams.full === true;
  const page = isFullFetch ? 1 : Math.max(1, Number(queryParams.page) || 1);
  const limit = isFullFetch ? 0 : Math.min(100, Math.max(1, Number(queryParams.limit) || 10));

  let data: T[] = [];
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

  const pages = limit === 0 ? 1 : Math.ceil(total / limit);

  return {
    success: true,
    message: 'Data fetched successfully',
    data,
    pagination: { page, limit, total, pages, hasNext: page < pages, hasPrev: page > 1 },
  };
}
