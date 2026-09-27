"use client";

import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { useSelectItems } from "@/core/hooks/useSelect";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function InventoryProductForm({ form, selectedProduct, onProductSelect, isEdit = false, inventoryProduct }) {
  const currentVariant = useWatch({ control: form.control, name: "variant" }) ?? inventoryProduct?.variant;

  let variantLabel = null;
  if (typeof currentVariant === "object" && currentVariant !== null) {
    if (currentVariant.attributes) {
      variantLabel = Object.entries(currentVariant.attributes)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
    } else if (currentVariant.sku) {
      variantLabel = currentVariant.sku;
    }
  } else if (typeof currentVariant === "string" && currentVariant) {
    const matched = selectedProduct?.variants?.find(
      (v) => String(v.sku) === String(currentVariant) || String(v._id) === String(currentVariant) || String(v.id) === String(currentVariant)
    );
    if (matched?.attributes) {
      variantLabel = Object.entries(matched.attributes)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
    } else {
      variantLabel = currentVariant;
    }
  }

  const productName = selectedProduct?.name || inventoryProduct?.product?.name || "Unknown Product";
  const productCode = selectedProduct?.code || inventoryProduct?.product?.code;

  return (
    <>
      {isEdit ? (
        <div className="mb-4 pl-3 border-l-2 border-primary flex flex-col gap-1 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-md font-semibold text-foreground">
              {productName}
            </span>
            {productCode && (
              <span className="text-md text-muted-foreground font-mono">{productCode}</span>
            )}
          </div>
          {variantLabel && (
            <p className="text-sm text-muted-foreground">
              Variant: <span className="text-foreground font-medium">{variantLabel}</span>
            </p>
          )}
        </div>
      ) : (
        <>
          <FormField
            control={form.control}
            name="product"
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <FormControl>
                  <ProductSearchCombobox
                    value={f.value}
                    onSelect={(item) => {
                      f.onChange(item._id);
                      form.setValue("variant", null);
                      if (onProductSelect) {
                        onProductSelect(item);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedProduct?.variants?.length > 0 && (
            <FormField
              control={form.control}
              name="variant"
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Variant</FormLabel>
                  <FormControl>
                    <Select value={typeof f.value === 'string' ? f.value : undefined} onValueChange={f.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.variants.map((v) => {
                          const variantId = v.sku || v._id;
                          const label = Object.entries(v.attributes || {})
                            .map(([k, val]) => `${k}: ${val}`)
                            .join(", ");
                          return (
                            <SelectItem key={variantId} value={variantId}>
                              {label || variantId}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      )}

      <FormField
        control={form.control}
        name="quantity"
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>Quantity</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Enter quantity" {...f} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Enter price" {...f} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function VariantKeyValueField({ form, attrKey, values = [] }) {
  const valueSelect = useSelectItems(
    values.map((v) => ({ _id: v, name: v })),
    { emptyText: "No values available", placeholder: `Select ${attrKey}` }
  );

  return (
    <FormField
      control={form.control}
      name={`variant.${attrKey}`}
      render={({ field: f }) => (
        <FormItem>
          <FormLabel className="capitalize">{attrKey}</FormLabel>
          <FormControl>
            <Select value={f.value || undefined} onValueChange={f.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={valueSelect.placeholder} />
              </SelectTrigger>
              <SelectContent>{valueSelect.items}</SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ProductSearchCombobox({ value, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchItems = async () => {
      if (!open) return;
      setLoading(true);
      try {
        const url = apiurls.products.getAll.url();
        const res = await apiRequest('get', url, { params: { search: searchQuery } });
        if (active) {
          setItems(res.data || []);
        }
      } catch (err) {
        console.error(err);
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
    if (value && !selectedItem && !items.find(i => i._id === value)) {
      const fetchInitial = async () => {
        try {
          const url = apiurls.products.getOne.url(value);
          const res = await apiRequest('get', url);
          setSelectedItem(res.data);
        } catch (e) {
          console.error("Failed to fetch initial product:", e);
        }
      };
      fetchInitial();
    }
  }, [value, selectedItem, items]);

  const displayItem = items.find(i => i._id === value) || selectedItem;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
          disabled={disabled}
        >
          {displayItem ? displayItem.name : 'Select a product...'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search products...'
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading && (
              <div className='flex items-center justify-center py-6 text-sm text-muted-foreground'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin text-primary' />
                Searching...
              </div>
            )}
            {!loading && items.length === 0 && (
              <CommandEmpty>No products found.</CommandEmpty>
            )}
            {!loading && items.length > 0 && (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item._id}
                    value={item._id}
                    onSelect={() => {
                      setSelectedItem(item);
                      onSelect(item);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === item._id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {item.name} ({item.code})
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

