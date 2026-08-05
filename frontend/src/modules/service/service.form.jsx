"use client";

import { useFieldArray } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSelectItems } from "@/core/hooks/useSelect";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const formatVariant = (variant) => {
  if (!variant) return '';
  const entries = typeof variant.entries === 'function' ? [...variant.entries()] : Object.entries(variant);
  if (entries.length === 0) return '';
  return `(${entries.map(([k, v]) => `${k}: ${v}`).join(', ')})`;
};

export default function ServiceForm({ form, isEdit = false, products }) {
  const fields = ["name", "description", "unit", "price"];

  const { fields: materialFields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  console.log(products)

  const productSelect = useSelectItems(products, {
    emptyText: "No products available",
    placeholder: "Select a product",
    getLabel: (i) => {
      const variantStr = formatVariant(i.variant);
      const name = i.product?.name || "Unknown Product";
      return `${name} ${variantStr}`.trim();
    }
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

      <div className="space-y-2">
        <FormLabel>Materials</FormLabel>
        {materialFields.map((item, index) => (
          <div key={item._id} className="flex gap-2 items-start">
            <FormField
              control={form.control}
              name={`materials.${index}.product`}
              render={({ field: f }) => (
                <FormItem className="flex-1">
                  <FormControl>
                  <Select
                value={f.value ? String(f.value) : undefined}
                onValueChange={f.onChange}
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