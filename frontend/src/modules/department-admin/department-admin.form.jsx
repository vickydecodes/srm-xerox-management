"use client";

import { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { useFilteredBy } from "@/core/hooks/useFilterBy";
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

export default function DepartmentAdminForm({
  form,
  isEdit = false,
  branches = [],
  departments = [],
}) {
  const fields = ["name", "email", "phone", "address"];

  const selectedBranch = useWatch({ control: form.control, name: "branch" });

  const filteredDepartments = useFilteredBy(
    departments,
    { branch: selectedBranch },
    { full: false }
  );

  // reset department if it no longer belongs to the newly selected branch
  useEffect(() => {
    const currentDept = form.getValues("department");
    if (
      currentDept &&
      !filteredDepartments.some((d) => d._id === currentDept)
    ) {
      form.setValue("department", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

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
            <Select onValueChange={f.onChange} value={f.value}>
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
        name="department"
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>Department</FormLabel>
            <Select onValueChange={f.onChange} value={f.value} disabled={!selectedBranch}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={selectedBranch ? "Select a department" : "Select a branch first"}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {filteredDepartments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
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