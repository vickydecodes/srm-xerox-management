import { Model } from 'mongoose';
import { dynamicFilter, FilterConfig } from './dynamicfilter.constant.ts';

export interface MultiModelSearchConfig {
  model: Model<any>;
  config: FilterConfig<any>;
  type: string;
  mapFn: (item: any) => any;
  options?: {
    extras?: {
      select?: string;
    };
    nestedPopulate?: any[];
  };
}

export async function multiModelDynamicFilter(
  configs: MultiModelSearchConfig[],
  queryParams: Record<string, any>,
  options: {
    visibility?: 'all' | 'active-only';
  } = {}
) {
  // Disables the pagination limits in dynamicFilter so we get a full search
  const searchParams = {
    ...queryParams,
    full: 'true',
  };

  const resultsPromises = configs.map(async (cfg) => {
    const res = await dynamicFilter(
      cfg.model,
      cfg.config,
      searchParams,
      {
        visibility: options.visibility ?? 'active-only',
        ...cfg.options,
      }
    );

    return res.data.map((item) => cfg.mapFn(item));
  });

  const resolvedResults = await Promise.all(resultsPromises);
  const combined = resolvedResults.flat();

  // Sort combined results alphabetically by name
  combined.sort((a, b) => a.name.localeCompare(b.name));

  return combined;
}
