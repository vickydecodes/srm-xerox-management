"use client";

import { useEffect, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/core/api/api.request";
import { apiurls } from "@/core/api/api.urls";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function ServiceForm({ form, isEdit = false, inventoryProducts = [] }) {
  const fields = ["name", "description", "unit", "price"];

  const { fields: materialFields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  return (
    <>
      {isEdit && (
        <FormItem>
          <FormLabel>Code</FormLabel>
          <FormControl>
            <Input value={form.getValues("code") ?? ""} disabled readOnly />
          </FormControl>
        </FormItem>
      )}

      {fields.map((field) => (
        <FormField
          key={field}
          control={form.control}
          name={field}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>{field.charAt(0).toUpperCase() + field.slice(1)}</FormLabel>
              <FormControl>
                <Input placeholder={`Enter ${field}`} {...f} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}

      <FormField
        control={form.control}
        name="isWorkOrder"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs bg-muted/10">
            <div className="space-y-0.5">
              <FormLabel className="text-sm font-medium">Work Order Service</FormLabel>
              <p className="text-xs text-muted-foreground">
                Enable if this service is for Work Orders
              </p>
            </div>
            <FormControl>
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isCustomSize"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs bg-muted/10">
            <div className="space-y-0.5">
              <FormLabel className="text-sm font-medium">Allow Custom Size</FormLabel>
              <p className="text-xs text-muted-foreground">
                Enable if customers can specify custom dimensions for this service
              </p>
            </div>
            <FormControl>
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sizes"
        render={({ field }) => {
          const currentSizes = Array.isArray(field.value) ? field.value : [];
          return (
            <FormItem className="space-y-2 rounded-lg border p-3 bg-muted/10">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Fixed Sizes</FormLabel>
                <span className="text-xs text-muted-foreground">e.g. 6x3 ft, A4, 8x4 ft</span>
              </div>
              <div className="flex gap-2">
                <Input
                  id="new-size-input"
                  placeholder="Enter a size and click Add"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val && !currentSizes.includes(val)) {
                        field.onChange([...currentSizes, val]);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById("new-size-input");
                    const val = input?.value?.trim();
                    if (val && !currentSizes.includes(val)) {
                      field.onChange([...currentSizes, val]);
                      if (input) input.value = "";
                    }
                  }}
                >
                  Add Size
                </Button>
              </div>
              {currentSizes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentSizes.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-background border px-2.5 py-1 rounded text-xs"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive ml-1"
                        onClick={() => {
                          field.onChange(currentSizes.filter((_, i) => i !== idx));
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <div className="space-y-2">
        <FormLabel>Materials</FormLabel>
        {materialFields.map((item, index) => (
          <div key={item.id || item._id || index} className="flex gap-2 items-start">
            <FormField
              control={form.control}
              name={`materials.${index}.product`}
              render={({ field: f }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <MaterialProductCombobox
                      value={f.value}
                      initialItems={inventoryProducts}
                      onSelect={f.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`materials.${index}.quantity`}
              render={({ field: f }) => (
                <FormItem className="w-28">
                  <FormControl>
                    <Input type="number" placeholder="Qty" {...f} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="destructive" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => append({ product: "", quantity: 1 })}>
          Add Material
        </Button>
      </div>
    </>
  );
}

function MaterialProductCombobox({ value, onSelect, initialItems = [], disabled }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchedItems, setFetchedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const getItemLabel = (item) => {
    if (!item) return "";
    const prodName = item.product?.name || item.product || "Unknown Inventory Product";
    let variantStr = "";
    if (typeof item.variant === "object" && item.variant !== null) {
      if (item.variant.attributes) {
        variantStr = Object.entries(item.variant.attributes)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      } else {
        variantStr = Object.entries(item.variant)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      }
    } else if (item.variant) {
      variantStr = String(item.variant);
    }
    return `${prodName}${variantStr ? ` (${variantStr})` : ""}`.trim();
  };

  const allItemsMap = new Map();
  [...initialItems, ...fetchedItems].forEach((item) => {
    if (item && (item._id || item.id)) {
      allItemsMap.set(String(item._id || item.id), item);
    }
  });
  const allItems = Array.from(allItemsMap.values());

  useEffect(() => {
    let active = true;
    if (!open || !searchQuery) return;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const url = apiurls.inventoryProducts.getAll.url();
        const res = await apiRequest("get", url, { params: { search: searchQuery } });
        if (active) {
          setFetchedItems(res.data || []);
        }
      } catch (err) {
        console.error("Failed to search inventory products:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, open]);

  useEffect(() => {
    if (value && !selectedItem && !allItemsMap.has(String(value))) {
      const fetchInitial = async () => {
        try {
          const url = apiurls.inventoryProducts.getOne.url(value);
          const res = await apiRequest("get", url);
          if (res.data) setSelectedItem(res.data);
        } catch (e) {
          console.error("Failed to fetch initial material inventory product:", e);
        }
      };
      fetchInitial();
    }
  }, [value, selectedItem, allItemsMap]);

  const displayItem = allItemsMap.get(String(value)) || selectedItem;

  const displayedList = searchQuery
    ? allItems.filter((i) => getItemLabel(i).toLowerCase().includes(searchQuery.toLowerCase()))
    : allItems;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between overflow-hidden text-ellipsis whitespace-nowrap"
          disabled={disabled}
        >
          <span className="truncate">{displayItem ? getItemLabel(displayItem) : "Select an inventory product..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search inventory products..."
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
            {!loading && displayedList.length === 0 && (
              <CommandEmpty>No inventory products found.</CommandEmpty>
            )}
            {!loading && displayedList.length > 0 && (
              <CommandGroup>
                {displayedList.map((item) => {
                  const itemId = String(item._id || item.id);
                  return (
                    <CommandItem
                      key={itemId}
                      value={itemId}
                      onSelect={() => {
                        setSelectedItem(item);
                        onSelect(itemId);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          String(value) === itemId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{getItemLabel(item)}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}