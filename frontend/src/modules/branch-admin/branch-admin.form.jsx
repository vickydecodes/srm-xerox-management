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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BranchAdminForm({ form, isEdit = false, branches = [] }) {
  const fields = ["name", "email", "phone", "address"];

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
        name="branch"
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>Branch</FormLabel>
            <Select onValueChange={f.onChange} defaultValue={f.value} value={f.value}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch._id} value={branch._id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

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