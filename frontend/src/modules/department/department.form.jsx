"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// import { Checkbox } from "@/components/ui/checkbox";

export default function DepartmentForm({ form }) {
  const fields = ["name", 'id'];

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
    </>
  );
}