import { useMemo } from 'react';
import { safeId } from '../utils/normalize-id';

export function useFilteredBy(
  list = [],
  conditions = {},
  options = { full: false }
) {
  return useMemo(() => {
    const entries = Object.entries(conditions);

    const active = entries.filter(
      ([, value]) => value !== '' && value !== null && value !== undefined
    );


    if (active.length === 0) {
      return options.full ? list : [];
    }

    return list.filter((item) =>
      active.every(([key, value]) => safeId(item[key]) === value)
    );
  }, [list, ...Object.values(conditions), options.emptyWhenNoMatch]);
}
