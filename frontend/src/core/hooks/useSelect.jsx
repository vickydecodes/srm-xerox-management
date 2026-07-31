// useSelect.js
import { SelectItem } from '@/components/ui/select';

export function useSelectItems(items = [], options = {}) {
  const {
    getKey = (i) => i._id,
    getValue = (i) => i._id,
    getLabel = (i) => i.name,
    emptyText = 'No items available',
    placeholder = 'Select the item',
    emptyValue = '__empty__',
  } = options;

  const hasItems = Array.isArray(items) && items.length > 0;

  const renderedItems = hasItems
    ? items.map((item) => (
        <SelectItem
          key={getKey(item)}
          value={String(getValue(item))}
        >
          {getLabel(item)}
        </SelectItem>
      ))
    : (
        <SelectItem value={emptyValue} disabled>
          {emptyText}
        </SelectItem>
      );

  return {
    items: renderedItems,
    disabled: false,
    hasItems,
    placeholder,
  };
}