"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function StaffForm({ form, isEdit = false }) {
  const fields = isEdit
    ? ["name", "email", "phone", "address"]
    : ["name", "email", "phone", "address", "password"];

  return (
    <>
      {isEdit && (
        <FormItem>
          <FormLabel>Login ID</FormLabel>
          <FormControl>
            <Input value={form.getValues("login_id") ?? ""} disabled readOnly />
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
                <Input
                  type={field === "password" ? "password" : "text"}
                  placeholder={`Enter ${field}`}
                  {...f}
                />
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
    </>
  );
}