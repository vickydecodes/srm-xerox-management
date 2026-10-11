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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ServiceForm({ form, isEdit = false, inventoryProducts = [] }) {
  const isCustomSize = form.watch("isCustomSize");
  const hasMultipleSizes = form.watch("hasMultipleSizes");
  const fields = isCustomSize ? ["name", "description"] : ["name", "description", "unit"];

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
        name="hasMultipleSizes"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs bg-muted/10">
            <div className="space-y-0.5">
              <FormLabel className="text-sm font-medium">Multiple Sizes & Prices</FormLabel>
              <p className="text-xs text-muted-foreground">
                Enable if this service has multiple sizes with different prices (e.g. A4, A3, 6x3 ft)
              </p>
            </div>
            <FormControl>
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    const currentSizes = form.getValues("sizes") || [];
                    if (currentSizes.length === 0) {
                      const currentPrice = form.getValues("price") || "";
                      form.setValue("sizes", [{ size: "A4", price: currentPrice }]);
                    }
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {!hasMultipleSizes && !isCustomSize && (
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (₹)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    className="pl-6 bg-background"
                    value={
                      field.value === 0 ||
                      field.value === "0" ||
                      field.value === "" ||
                      field.value === undefined
                        ? ""
                        : field.value
                    }
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? "" : Number(val));
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hasMultipleSizes && (
        <div className="space-y-3 rounded-lg border p-3 bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <FormLabel className="text-sm font-medium">Sizes & Pricing</FormLabel>
              <p className="text-xs text-muted-foreground">
                Specify each size with its individual price
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = form.getValues("sizes") || [];
                form.setValue("sizes", [...current, { size: "", price: "" }]);
              }}
            >
              + Add Size
            </Button>
          </div>

          <FormField
            control={form.control}
            name="sizes"
            render={({ field }) => {
              const currentSizes = Array.isArray(field.value) ? field.value : [];
              return (
                <div className="space-y-2">
                  {currentSizes.map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="Size (e.g. A4, A3, 6x3 ft)"
                          value={typeof s === "object" ? s.size : s}
                          onChange={(e) => {
                            const newSizes = [...currentSizes];
                            const currPrice = typeof s === "object" ? s.price : "";
                            newSizes[idx] = { size: e.target.value, price: currPrice };
                            field.onChange(newSizes);
                          }}
                        />
                      </div>
                      <div className="w-32 relative">
                        <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          className="pl-6 bg-background"
                          value={
                            typeof s === "object"
                              ? (s.price === 0 || s.price === "0" || s.price === "" || s.price === undefined
                                  ? ""
                                  : s.price)
                              : ""
                          }
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newSizes = [...currentSizes];
                            const currSize = typeof s === "object" ? s.size : s;
                            newSizes[idx] = { size: currSize, price: val === "" ? "" : Number(val) };
                            field.onChange(newSizes);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-9 w-9"
                        onClick={() => {
                          const newSizes = currentSizes.filter((_, i) => i !== idx);
                          field.onChange(newSizes);
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  {currentSizes.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No sizes added yet. Click "+ Add Size" to add one.
                    </p>
                  )}
                  <FormMessage />
                </div>
              );
            }}
          />
        </div>
      )}

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
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    const currUnit = form.getValues("unit");
                    if (!currUnit || (currUnit !== "inch" && currUnit !== "ft")) {
                      form.setValue("unit", "ft");
                    }
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {isCustomSize && (
        <div className="space-y-3 rounded-lg border p-3.5 bg-muted/10 border-primary/20">
          <div className="space-y-0.5">
            <FormLabel className="text-sm font-medium text-foreground">
              Custom Size Configuration
            </FormLabel>
            <p className="text-xs text-muted-foreground">
              Configure the dimension unit and price per unit for custom calculations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">
                    Measurement Unit
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value === "inch" ? "inch" : "ft"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select unit (ft or inch)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ft">Feet (ft)</SelectItem>
                        <SelectItem value="inch">Inches (inch)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">
                    Rate / {form.watch("unit") === "inch" ? "sq in" : "sq ft"} (₹)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        className="pl-6 bg-background"
                        value={
                          field.value === 0 ||
                          field.value === "0" ||
                          field.value === "" ||
                          field.value === undefined
                            ? ""
                            : field.value
                        }
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? "" : Number(val));
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

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