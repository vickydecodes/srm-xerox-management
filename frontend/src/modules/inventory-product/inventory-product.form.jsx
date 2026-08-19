"use client";

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
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
} from "@/components/ui/select";
import { useSelectItems } from "@/core/hooks/useSelect";

export function InventoryProductForm({ form, products = [], isEdit = false }) {
  const selectedProductId = useWatch({ control: form.control, name: "product" });

  const selectedProduct = useMemo(
    () => products.find((p) => String(p._id) === String(selectedProductId)),
    [products, selectedProductId]
  );

  
  const variantsObj = selectedProduct?.attributes ?? {};
  const attributeKeys = Object.keys(variantsObj);

  const productSelect = useSelectItems(products, {
    emptyText: "No products available",
    placeholder: "Select a product",
  });

  return (
    <>
      <FormField
        control={form.control}
        name="product"
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>Product</FormLabel>
            <FormControl>
              <Select
                value={f.value ? String(f.value) : undefined}
                onValueChange={(val) => {
                  f.onChange(val);
                  if (!isEdit) form.setValue("variant", {});
                }}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productSelect.placeholder} />
                </SelectTrigger>
                <SelectContent>{productSelect.items}</SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {attributeKeys.map((key) => (
        <VariantKeyValueField
          key={key}
          form={form}
          attrKey={key}
          values={variantsObj[key]}
          disabled={isEdit}
        />
      ))}

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

function VariantKeyValueField({ form, attrKey, values = [], disabled = false }) {
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
            <Select value={f.value || undefined} onValueChange={f.onChange} disabled={disabled}>
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