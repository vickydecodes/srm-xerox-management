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
import { Checkbox } from "@/components/ui/checkbox";

export default function ServiceForm({ form }) {
  const fields = ["name", "description", "unit", "price"];

  const { fields: materialFields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  return (
    <>
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
        name="active"
        render={({ field: f }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl>
              <Checkbox checked={f.value} onCheckedChange={f.onChange} />
            </FormControl>
            <FormLabel className="!mt-0">Active</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <FormLabel>Materials</FormLabel>
        {materialFields.map((item, index) => (
          <div key={item.id} className="flex gap-2 items-start">
            <FormField
              control={form.control}
              name={`materials.${index}.product`}
              render={({ field: f }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Product ID" {...f} />
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