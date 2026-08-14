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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSelectItems } from "@/core/hooks/useSelect";

export default function DepartmentForm({
  form,
  isEdit = false,
  branches,
}) {
  const fields = ["name", "code", "branch"];

  const {
    items: branchItems,
    disabled: branchDisabled,
    placeholder: branchPlaceholder,
  } = useSelectItems(branches || [], {
    emptyText: "No branches available",
    placeholder: "Select a branch",
    badge: {
      need: true,
      getBadge: (branch) => branch.code,
    },
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
                    value={f.value}
                    defaultValue={f.value}
                    onValueChange={f.onChange}
                    disabled={isEdit || branchDisabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={branchPlaceholder} />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {branchItems}
                    </SelectContent>
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
                <FormLabel>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </FormLabel>

                <FormControl>
                  <Input
                    {...f}
                    placeholder={`Enter ${field}`}
                    disabled={isEdit && field === "code"}
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