import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApi } from '@/core/contexts/api.context';

const formatVariant = (variant) => {
  if (!variant) return '';
  const entries = typeof variant.entries === 'function' ? [...variant.entries()] : Object.entries(variant);
  if (entries.length === 0) return '';
  return `${entries.map(([k, v]) => `${k}: ${v}`).join(', ')}`;
};

export function BillingItemSearchCombobox({
  value = '',
  currentItemName = '',
  onSelect,
  placeholder = 'Select item...',
  searchPlaceholder = 'Search products or services...',
  className = '',
  showTypeBadge = true,
  showPrice = true,
  showStock = true,
  queryParams = {},
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { search } = useApi();

  useEffect(() => {
    let active = true;

    const fetchItems = async () => {
      if (searchQuery.trim().length < 2) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const results = await search.searchProducts(searchQuery, queryParams);
        if (active) {
          setItems(results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
      setLoading(false);
    };
  }, [searchQuery, JSON.stringify(queryParams)]);

  const selectedItem = items.find((item) => item._id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background text-left font-normal h-9 text-muted-foreground",
            className
          )}
        >
          <span className="truncate text-foreground">
            {value
              ? selectedItem?.name || currentItemName || "Selected Item"
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                Searching...
              </div>
            )}
            {!loading && items.length === 0 && (
              <CommandEmpty>No products or services found.</CommandEmpty>
            )}
            {!loading && items.length > 0 && (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item._id}
                    value={item._id}
                    onSelect={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col w-full min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{item.name}</span>
                        {item.type === 'InventoryProduct' && item.variant && (
                          <span className="text-[10px] bg-secondary text-secondary-foreground font-semibold px-1.5 py-0.5 rounded truncate max-w-[150px]">
                            {formatVariant(item.variant)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {showTypeBadge && (
                          <>
                            {item.type === 'InventoryProduct' ? 'Product' : 'Service'}
                            {(showPrice || (showStock && item.type === 'InventoryProduct')) && ' • '}
                          </>
                        )}
                        {showPrice && <>₹{item.price}</>}
                        {showStock && item.type === 'InventoryProduct' && (
                          <>{showPrice && ' • '}Stock: {item.quantity ?? 0}</>
                        )}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
