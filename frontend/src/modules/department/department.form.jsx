"use client";

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/core/contexts/api.context";
import { useSelectItems } from "@/core/hooks/useSelect";

export default function DepartmentForm({ form, isEdit = false }) {
  const { branches } = useApi();
  const fields = ["name", "code", "branch"];

  const branchItems = useSelectItems(branches?.state || [], {
    emptyText: 'No branches available',
    badge: { need: true, label: 'code', variant: 'secondary' }
  });

  return (
    <>
      {fields.map((field) => {
        if (field === "branch") {
          return (
            <FormField
              key={field}
              control={form.control}
              name={field}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select
                    onValueChange={f.onChange}
                    defaultValue={f.value}
                    value={f.value}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>{branchItems}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        }

        return (
          <FormField
            key={field}
            control={form.control}
            name={field}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel>{field.charAt(0).toUpperCase() + field.slice(1)}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={`Enter ${field}`}
                    disabled={isEdit && field === "code"}
                    {...f}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      })}
    </>
  );
}