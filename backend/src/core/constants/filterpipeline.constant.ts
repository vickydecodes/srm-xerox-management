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

export async function filterPipeline<T>(
  model: any,
  config: FilterConfig,
  queryParams: Record<string, any> = {},
  options: {
    rawQuery?: any;
    include?: any;
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

  const prismaModelName = model.prismaModelName;
  if (!prismaModelName) {
    throw new Error(`Model must have a static 'prismaModelName' property`);
  }
  
  // dynamically import prisma to prevent circular dependencies if any
  const prisma = (await import('@config/prisma.config.js')).default;
  const delegate = (prisma as any)[prismaModelName];

  const where: any = { ...options.rawQuery };

  if (queryParams.search && searchable.length > 0) {
    const searchString = String(queryParams.search).trim();
    where.OR = searchable.map(f => ({
      [f]: { contains: searchString, mode: 'insensitive' }
    }));
  }

  for (const field of filterable) {
    const value = queryParams[field];
    if (value == null || value === '') continue;

    if (value === 'true' || value === 'false') {
      where[field] = value === 'true';
    } else if (!isNaN(Number(value)) && value !== '') {
      where[field] = Number(value); // Prisma needs actual numbers
    } else {
      where[field] = value;
    }
  }

  if (dateRangeField && (queryParams.dateFrom || queryParams.dateTo)) {
    where[dateRangeField] = {};
    if (queryParams.dateFrom) where[dateRangeField].gte = new Date(queryParams.dateFrom);
    if (queryParams.dateTo) where[dateRangeField].lte = new Date(queryParams.dateTo);
  }

  const rawSortBy = queryParams.sortBy as string | undefined;
  const order = queryParams.order === 'asc' ? 'asc' : 'desc';
  const sortBy = rawSortBy && sortable.includes(rawSortBy) ? rawSortBy : defaultSort;

  // We fetch everything matching the query first if we need complex in-memory sort
  const isComplexSort = businessSort[sortBy] || smartSort.includes(sortBy);
  const isFullFetch = queryParams.full === 'true' || queryParams.full === true;
  const page = isFullFetch ? 1 : Math.max(1, Number(queryParams.page) || 1);
  const limit = isFullFetch ? 0 : Math.min(100, Math.max(1, Number(queryParams.limit) || 10));

  const findArgs: any = { where, include: options.include };

  // If simple sort, we can use Prisma's native orderBy
  if (!isComplexSort) {
    if (sortBy === 'createdAt') {
      findArgs.orderBy = { createdAt: order };
    } else {
      findArgs.orderBy = [
        { [sortBy]: order },
        { createdAt: 'desc' }
      ];
    }
    if (!isFullFetch) {
      findArgs.skip = (page - 1) * limit;
      findArgs.take = limit;
    }
  }

  const [total, fetchedData] = await Promise.all([
    delegate.count({ where }),
    delegate.findMany(findArgs)
  ]);

  let data = fetchedData.map((d: any) => model({ ...d, _id: d.id }));

  // Apply complex in-memory sorts if needed
  if (isComplexSort) {
    if (businessSort[sortBy]) {
      const map = businessSort[sortBy];
      data.sort((a: any, b: any) => {
        const valA = a[sortBy] as string;
        const valB = b[sortBy] as string;
        const bizA = map[valA] ?? 999;
        const bizB = map[valB] ?? 999;
        
        if (bizA !== bizB) {
          return order === 'asc' ? bizA - bizB : bizB - bizA;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // secondary sort
      });
    } else if (smartSort.includes(sortBy)) {
      data.sort((a: any, b: any) => {
        const valA = String(a[sortBy] || '').toLowerCase().trim();
        const valB = String(b[sortBy] || '').toLowerCase().trim();
        
        const isAlphaA = /^[a-z]+$/.test(valA) ? 0 : 1;
        const isAlphaB = /^[a-z]+$/.test(valB) ? 0 : 1;
        
        if (isAlphaA !== isAlphaB) return isAlphaA - isAlphaB;
        
        const numMatchA = valA.match(/\d+/);
        const numMatchB = valB.match(/\d+/);
        const numA = numMatchA ? parseInt(numMatchA[0], 10) : 999999;
        const numB = numMatchB ? parseInt(numMatchB[0], 10) : 999999;
        
        if (numA !== numB) return numA - numB;
        
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination post-sort if we did an in-memory sort
    if (!isFullFetch) {
      const startIndex = (page - 1) * limit;
      data = data.slice(startIndex, startIndex + limit);
    }
  }

  const pages = limit === 0 ? 1 : Math.ceil(total / limit);

  return {
    success: true,
    message: 'Data fetched successfully',
    data,
    pagination: { page, limit, total, pages, hasNext: page < pages, hasPrev: page > 1 },
  };
}
