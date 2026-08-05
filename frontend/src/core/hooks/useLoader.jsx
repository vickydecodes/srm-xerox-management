import { useState, useCallback } from 'react';



export const useLoader = () => {
  const [loading, setLoading] = useState(false);

  
  const resolveItems = (items) => {
    const arr = Array.isArray(items) ? items : [items];

    return arr.flatMap((item) => {
      if (!item) return [];

      
      if (
        typeof item === 'object' &&
        item.module &&
        typeof item.module.fetch === 'function'
      ) {
        return [item];
      }

      
      if (
        typeof item === 'object' &&
        typeof item.fetch === 'function'
      ) {
        return [{ module: item, query: null }];
      }

      return [];
    });
  };

  
  const parseForce = (args) => {
    const last = args[args.length - 1];
    return typeof last === 'boolean' ? last : false;
  };

  
  const load = useCallback(async (...args) => {
    if (!args.length) return [];

    const force = parseForce(args);
    if (force) args = args.slice(0, -1);

    const targets = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;

    const items = resolveItems(targets);
    if (!items.length) return [];

    setLoading(true);



    try {
      const promises = items.map(async ({ module, query }) => {
        const state = module.state;

        if (
          !force &&
          Array.isArray(state) &&
          state.length > 0
        ) {
          console.log('Skipped:', module);
          return 'skipped';
        }

        const fetchFn = module.public || module.fetch;
        return fetchFn(query);
      });

      return await Promise.all(promises);
    } finally {
      setLoading(false);
    }
  }, []);

  
  const createPreset = useCallback(
    (...presetModules) =>
      (force = true, full = true) => {
        console.log('Preset Loader Debug', {
          presetModules: presetModules.map((m) => m),
          force,
          full,
        });
        const modules = full
          ? presetModules.map((m) => ({
            module: m,
            query: { full: true },
          }))
          : presetModules;

        return load(modules, force);
      },
    [load]
  );

  const loadOnly = useCallback(async (fetchFn) => {
    if (typeof fetchFn !== 'function') return;

    setLoading(true);
    try {
      return await fetchFn();
    } finally {
      setLoading(false);
    }
  }, []);


  return {
    load,
    createPreset,
    loadOnly,
    loading,
  };
};
