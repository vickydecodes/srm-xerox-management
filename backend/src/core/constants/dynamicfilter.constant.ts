import prisma from '@config/prisma.config.js';

export interface SearchableRefConfig {
  field: string; // local relation field, e.g. 'branch'
  ref: string; // model name, e.g. 'Branch'
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
  full?: boolean;
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

export async function dynamicFilter<T>(
  model: any,
  config: FilterConfig<T>,
  queryParams: Record<string, any>,
  options: PaginationOptions & {
    extras?: {
      select?: string;
    };
    nestedPopulate?: any[];
    forcePopulate?: any[];
    visibility?: 'all' | 'active-only';
    rawQuery?: Record<string, any>;
  } = {}
): Promise<PaginatedResult<T>> {
  const prismaModelName = model.prismaModelName;
  if (!prismaModelName) {
    throw new Error(`Model must have a static 'prismaModelName' property`);
  }

  const delegate = (prisma as any)[prismaModelName];

  const {
    searchable = [],
    filterable = [],
    sortable = [],
    searchableRefs = [],
    defaultSort = 'createdAt',
  } = config;

  const visibility = options.visibility ?? 'active-only';
  const query: any = { ...options.rawQuery };

  const noActiveModels = ['order', 'bill', 'billItem', 'counter', 'creditPayment', 'errorLog', 'setting'];
  const noDeletedModels = ['billItem', 'counter', 'creditPayment', 'errorLog', 'setting'];

  if (visibility === 'active-only') {
    if (!noActiveModels.includes(prismaModelName)) {
      query.active = true;
    }
    if (!noDeletedModels.includes(prismaModelName)) {
      query.deleted = false;
    }
  }

  const isFullFetch = queryParams.full === 'true' || queryParams.full === true || options.full === true;

  filterable.forEach((field) => {
    const key = field as string;
    const value = queryParams[key];
    if (value === undefined || value === null || value === '') return;

    if (key.toLowerCase().includes('date')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) query[key] = d;
      return;
    }

    if (value === 'true' || value === 'false') {
      query[key] = value === 'true';
      return;
    }

    // Attempt to handle ObjectId filtering automatically? For now just assign
    query[key] = value;
  });

  if (queryParams.search && (searchable.length > 0 || searchableRefs.length > 0)) {
    const searchString = queryParams.search.trim();
    const orConditions: any[] = searchable.map((f) => ({
      [f]: { contains: searchString, mode: 'insensitive' }
    }));

    for (const { field, ref, matchOn } of searchableRefs) {
      const refModelName = ref.charAt(0).toLowerCase() + ref.slice(1);
      const refModel = (prisma as any)[refModelName];
      if (refModel) {
        try {
          const matchingRefs = await refModel.findMany({
            where: { [matchOn]: { contains: searchString, mode: 'insensitive' } },
            select: { id: true }
          });
          console.log("matchingRefs:", matchingRefs); const ids = matchingRefs.map((r: any) => r.id);
          if (ids.length > 0) {
            orConditions.push({ [field]: { in: ids } });
          }
        } catch (err) {
           // Skip if query fails
        }
      }
    }

    if (orConditions.length > 0) {
      query.OR = orConditions;
    } else {
      // If there are search conditions but none matched, ensure no results are returned
      query.id = 'NO_MATCH';
    }
  }

  let orderBy: any = {};
  const sortBy = queryParams.sortBy;

  if (sortBy && sortable.includes(sortBy)) {
    orderBy[sortBy] = queryParams.order === 'asc' ? 'asc' : 'desc';
  } else {
    let finalDefault = (defaultSort as string) || 'createdAt';
    let defaultOrder = 'asc';
    if (finalDefault.startsWith('-')) {
      defaultOrder = 'desc';
      finalDefault = finalDefault.slice(1);
    }
    orderBy[finalDefault] = queryParams.order ? (queryParams.order === 'asc' ? 'asc' : 'desc') : defaultOrder;
  }

  const page = isFullFetch ? 1 : Math.max(1, Number(queryParams.page) || 1);
  const limit = isFullFetch ? 0 : Math.min(100, Math.max(1, Number(queryParams.limit) || 10));

  let include: any = undefined;
  if (options.forcePopulate && options.forcePopulate.length > 0) {
    include = {};
    options.forcePopulate.forEach((pathObj: any) => {
      if (typeof pathObj === 'string') {
        const parts = pathObj.split(' ');
        parts.forEach(p => {
            if (p) include[p] = true;
        });
      } else if (pathObj.path) {
        include[pathObj.path] = pathObj.populate ? { include: buildInclude(pathObj.populate) } : true;
      }
    });
  }

  const findParams: any = {
    where: query,
    orderBy,
    include: Object.keys(include || {}).length > 0 ? include : undefined,
  };

  if (!isFullFetch) {
    findParams.skip = (page - 1) * limit;
    findParams.take = limit;
  }

  const [total, data] = await Promise.all([
    delegate.count({ where: query }),
    delegate.findMany(findParams)
  ]);

  const wrapperData = data.map((d: any) => model({ ...d, _id: d.id }));
  const pages = limit === 0 ? 1 : Math.ceil(total / limit);

  return {
    success: true,
    message: 'Data fetched successfully',
    data: wrapperData,
    pagination: {
      page,
      limit: limit === 0 ? total : limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
}

function buildInclude(populateArr: any[]): any {
    const inc: any = {};
    populateArr.forEach((pathObj: any) => {
      if (typeof pathObj === 'string') {
        inc[pathObj] = true;
      } else if (pathObj.path) {
        inc[pathObj.path] = pathObj.populate ? { include: buildInclude(pathObj.populate) } : true;
      }
    });
    return inc;
}