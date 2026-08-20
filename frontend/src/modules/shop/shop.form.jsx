"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function ShopForm({ form, isEdit = false }) {
  const fields = ["code", "name", "phone", "email"];

  return (
    <>
      {fields.map((field) => (
        <FormField
          key={field}
          control={form.control}
          name={field}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {field === "email" ? " (optional)" : ""}
              </FormLabel>
              <FormControl>
                <Input
                  {...f}
                  placeholder={`Enter ${field}`}
                  type={field === "email" ? "email" : "text"}
                  disabled={isEdit && field === "code"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </>
  );
}