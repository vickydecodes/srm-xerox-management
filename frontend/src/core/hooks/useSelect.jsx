
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { SelectItem } from '@/components/ui/select';

export function useSelectItems(items = [], options = {}) {
  const {
    getKey = (i) => i._id,
    getValue = (i) => i._id,
    getLabel = (i) => i.name,
    badge = { need: false, getBadge: (i) => i.name },
    emptyText = 'No items available',
    placeholder = 'Select the item',
    emptyValue = '__empty__',
  } = options;

  const hasItems = Array.isArray(items) && items.length > 0;

  const renderedItems = useMemo(() => {
    if (!hasItems) {
      return (
        <SelectItem value={emptyValue} disabled>
          {emptyText}
        </SelectItem>
      );
    }

    return items.map((item) => {
      const badgeText = badge?.need && badge?.getBadge ? badge.getBadge(item) : null;
      return (
        <SelectItem key={getKey(item)} value={String(getValue(item))}>
          <div className="flex items-center justify-between w-full gap-4">
            <span>{getLabel(item)}</span>
            {badgeText && (
              <Badge variant="secondary" className="ml-2 font-normal text-[10px] bg-primary/10 text-primary border-none">
                {badgeText}
              </Badge>
            )}
          </div>
        </SelectItem>
      );
    });
  }, [items, hasItems, getKey, getValue, getLabel, badge?.need, badge?.getBadge, emptyText, emptyValue]);

  return {
    items: renderedItems,
    disabled: !hasItems,
    hasItems,
    placeholder,
  };
}