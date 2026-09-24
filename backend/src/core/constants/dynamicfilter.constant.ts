import prisma from '@config/prisma.config.js';
import { Prisma } from '@prisma/client';
import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';

/* ============================================================
   CONFIG SHAPE
   ------------------------------------------------------------
   Mongoose's version discovered `populatePaths` automatically by
   walking the live schema (analyzeSchemaPaths). Prisma has no
   equivalent for your actual refs, since most of them (Order.branch,
   BillItem.item, JSON-embedded approvers) aren't real @relations —
   so `enhanceRefs` must be declared explicitly per model instead of
   auto-discovered. This is the one piece that can't be a faithful
   port; it has to become opt-in config.
   ============================================================ */

export interface SearchableRefConfig {
  field: string; // column holding the id, e.g. 'branch'
  delegate: string; // prisma delegate name, e.g. 'branch'
  matchOn: string; // column on the referenced table to ILIKE match, e.g. 'name'
}

export type SortStrategy =
  | { type: 'plain' }
  | { type: 'smart' } // natural alphanumeric sort (was SMART_SORT_FIELDS)
  | { type: 'business'; map: Record<string, number> } // was BUSINESS_SORT_FIELDS
  | { type: 'derived'; sql: Prisma.Sql }; // was DERIVED_SORT_FIELDS — raw expression to sort by

export interface FilterConfig<T> {
  table: string; // plain Postgres table name, unquoted — e.g. 'Order', 'Branch'
  searchable?: (keyof T | string)[];
  searchableRefs?: SearchableRefConfig[];
  filterable?: (keyof T | string)[];
  // Either a flat list of plain-sort field names (the common case — no
  // custom strategy needed), or a field -> strategy map for fields that
  // need smart/business/derived sorting. Mixing both isn't supported —
  // if any field needs a strategy, list ALL sortable fields as a map
  // (plain ones just get { type: 'plain' }).
  sortable?: (keyof T | string)[] | Record<string, SortStrategy>;
  defaultSort?: string;
  hasActive?: boolean; // defaults to true
  hasDeleted?: boolean; // defaults to true
  enhanceRefs?: string[]; // refs to pass through enhanceDoc after fetch
  excludeFields?: string[]; // stripped from every row before returning — defaults to ['password']
}

function normalizeSortable(sortable: FilterConfig<any>['sortable']): Record<string, SortStrategy> {
  if (!sortable) return {};
  if (Array.isArray(sortable)) {
    return Object.fromEntries(sortable.map((f) => [f as string, { type: 'plain' as const }]));
  }
  return sortable;
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

/* ============================================================
   IMPLEMENTATION
   ============================================================ */

export async function dynamicFilter<T extends Record<string, any>>(
  delegateOrModel: any, // the "Model" shim (order.model.ts style) — used for enhanceDoc's `model` param
  config: FilterConfig<T>,
  queryParams: Record<string, any>,
  options: PaginationOptions & {
    extras?: { select?: string };
    forcePopulate?: string[];
    visibility?: 'all' | 'active-only';
    rawQuery?: Record<string, any>;
  } = {},
): Promise<PaginatedResult<T>> {
  const {
    searchable = [],
    searchableRefs = [],
    filterable = [],
    defaultSort = 'createdAt',
    hasActive = true,
    hasDeleted = true,
    enhanceRefs = [],
    excludeFields = ['password'],
  } = config;
  const sortable = normalizeSortable(config.sortable);

  const visibility = options.visibility ?? 'active-only';
  const tableName = config.table.replace(/"/g, ''); // plain, unquoted identifier
  const delegate = (prisma as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)];

  /* ---------- WHERE clause (Prisma where object, not raw) ---------- */

  const where: Record<string, any> = {};

  if (visibility === 'active-only') {
    if (hasActive) where.active = true;
    if (hasDeleted) where.deleted = false;
  }

  Object.assign(where, options.rawQuery ?? {});

  for (const field of filterable) {
    const key = field as string;
    const value = queryParams[key];
    if (value === undefined || value === null || value === '') continue;

    if (key.toLowerCase().includes('date')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) where[key] = d;
      continue;
    }
    if (value === 'true' || value === 'false') {
      where[key] = value === 'true';
      continue;
    }
    where[key] = value;
  }

  /* ---------- search: plain columns + searchableRefs ---------- */
  // searchableRefs can't be a Prisma relation filter (no real @relation
  // in most cases), so resolve matching parent ids via a separate query
  // first, then fold them into an `in` filter — same two-step idea as
  // the Mongo $lookup, just outside the aggregation pipeline.

  if (queryParams.search && (searchable.length > 0 || searchableRefs.length > 0)) {
    const term = String(queryParams.search).trim();
    const orConditions: any[] = searchable.map((f) => ({
      [f as string]: { contains: term, mode: 'insensitive' },
    }));

    for (const { field, delegate: refDelegateName, matchOn } of searchableRefs) {
      const refDelegate = (prisma as any)[refDelegateName];
      if (!refDelegate) continue;
      const matches = await refDelegate.findMany({
        where: { [matchOn]: { contains: term, mode: 'insensitive' } },
        select: { id: true },
      });
      if (matches.length) {
        orConditions.push({ [field]: { in: matches.map((m: any) => m.id) } });
      }
    }

    if (orConditions.length) where.OR = orConditions;
  }

  /* ---------- sort strategy ---------- */

  const sortBy = queryParams.sortBy && sortable[queryParams.sortBy] ? queryParams.sortBy : defaultSort;
  const order: 'asc' | 'desc' = queryParams.order === 'asc' ? 'asc' : 'desc';
  const strategy: SortStrategy = sortable[sortBy] ?? { type: 'plain' };

  const page = queryParams.full === 'true' ? 1 : Math.max(1, Number(queryParams.page) || 1);
  const limit = queryParams.full === 'true' ? 0 : Math.min(100, Math.max(1, Number(queryParams.limit) || 10));

  let data: any[];
  let total: number;

  if (strategy.type === 'plain') {
    // fast path — real orderBy + skip/take, one query does the work
    [data, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: { [sortBy]: order },
        ...(limit ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      delegate.count({ where }),
    ]);
  } else {
    // smart / business / derived — no Prisma orderBy equivalent, so use
    // raw SQL to keep sort + pagination in the database rather than
    // pulling the whole table into memory.
    const whereSql = buildRawWhere(where); // see helper below
    const orderExpr = buildSortExpr(sortBy, strategy, order);

    const quotedTable = Prisma.raw(quoteIdent(tableName));

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT * FROM ${quotedTable}
      ${whereSql}
      ORDER BY ${orderExpr}
      ${limit ? Prisma.sql`LIMIT ${limit} OFFSET ${(page - 1) * limit}` : Prisma.empty}
    `);

    const countRow = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(*) as count FROM ${quotedTable} ${whereSql}
    `);

    data = rows;
    total = Number(countRow[0]?.count ?? 0);
  }

  /* ---------- strip sensitive fields (was Mongo's $project: { password: 0 }) ---------- */

  if (excludeFields.length) {
    for (const row of data) {
      for (const f of excludeFields) delete row[f];
    }
  }

  /* ---------- enhance (populate) ---------- */

  if (enhanceRefs.length > 0) {
    data = await Promise.all(data.map((doc) => enhanceDoc(delegateOrModel, doc, enhanceRefs, options)));
  }

  const pages = limit === 0 ? 1 : Math.ceil(total / limit);

  return {
    success: true,
    message: 'Data fetched successfully',
    data,
    pagination: { page, limit, total, pages, hasNext: page < pages, hasPrev: page > 1 },
  };
}

/* ============================================================
   RAW SQL HELPERS
   ------------------------------------------------------------
   These translate a subset of a Prisma `where` object into SQL —
   deliberately NOT a general Prisma-where-to-SQL compiler (that's
   a much bigger job); it only needs to cover what filterable/search
   above actually produce: equality, `in`, `contains`/insensitive,
   and top-level `OR`.
   ============================================================ */

function buildRawWhere(where: Record<string, any>): Prisma.Sql {
  const clauses: Prisma.Sql[] = [];

  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR' && Array.isArray(value)) {
      const orParts = value.map((cond) => buildRawWhere(cond)).filter((s) => s.sql !== '');
      if (orParts.length) {
        clauses.push(Prisma.sql`(${Prisma.join(orParts.map(stripWherePrefix), ' OR ')})`);
      }
      continue;
    }
    if (value && typeof value === 'object' && 'in' in value) {
      clauses.push(Prisma.sql`${Prisma.raw(quoteIdent(key))} IN (${Prisma.join(value.in)})`);
      continue;
    }
    if (value && typeof value === 'object' && 'contains' in value) {
      clauses.push(Prisma.sql`${Prisma.raw(quoteIdent(key))} ILIKE ${'%' + value.contains + '%'}`);
      continue;
    }
    clauses.push(Prisma.sql`${Prisma.raw(quoteIdent(key))} = ${value}`);
  }

  if (!clauses.length) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}`;
}

function stripWherePrefix(sql: Prisma.Sql): Prisma.Sql {
  // buildRawWhere always prefixes with WHERE; strip it when nesting inside OR(...)
  return Prisma.raw(sql.sql.replace(/^WHERE\s+/i, ''));
}

function quoteIdent(name: string) {
  return `"${name}"`;
}

function buildSortExpr(field: string, strategy: SortStrategy, order: 'asc' | 'desc'): Prisma.Sql {
  const dir = Prisma.raw(order.toUpperCase());
  const col = Prisma.raw(quoteIdent(field));

  if (strategy.type === 'derived') {
    return Prisma.sql`${strategy.sql} ${dir}, "createdAt" DESC`;
  }

  if (strategy.type === 'business') {
    const cases = Object.entries(strategy.map)
      .map(([key, val]) => Prisma.sql`WHEN ${col} = ${key} THEN ${val}`);
    return Prisma.sql`(CASE ${Prisma.join(cases, ' ')} ELSE 999 END) ${dir}, "createdAt" DESC`;
  }

  // smart: natural alphanumeric — letters-first, then numeric part, then text
  return Prisma.sql`
    (CASE WHEN LOWER(TRIM(${col})) ~ '^[a-z]+$' THEN 0 ELSE 1 END) ASC,
    COALESCE(NULLIF(substring(LOWER(${col}) from '\\d+'), '')::int, 999999) ASC,
    LOWER(TRIM(${col})) ${dir}
  `;
}