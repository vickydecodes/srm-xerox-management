"use client";

import { useEffect } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrderForm({
  form,
  branches = [],
  departments = [],
  inventoryProducts  = [],
  services = [],
}) {
  const selectedBranch = useWatch({ control: form.control, name: "branch" });

  const filteredDepartments = selectedBranch
    ? departments.filter((d) => (d.branch?._id || d.branch) === selectedBranch)
    : departments;

  useEffect(() => {
    const currentDept = form.getValues("department");
    if (currentDept && !filteredDepartments.some((d) => d._id === currentDept)) {
      form.setValue("department", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { fields: sponsorFields, append: appendSponsor, remove: removeSponsor } = useFieldArray({
    control: form.control,
    name: "sponsors",
  });

  const items = useWatch({ control: form.control, name: "items" }) || [];
  const sponsors = useWatch({ control: form.control, name: "sponsors" }) || [];
  const managementAmount = useWatch({ control: form.control, name: "managementAmount" }) || 0;

  const totalCost = items.reduce(
    (sum, i) => sum + (Number(i?.quantity) || 0) * (Number(i?.price) || 0),
    0
  );
  const totalSponsorship = sponsors.reduce((sum, s) => sum + (Number(s?.amount) || 0), 0);
  const totalAvailable = Number(managementAmount || 0) + totalSponsorship;
  const overBudget = totalCost > totalAvailable;

  // pick the right catalog list based on the item's selected type
  const getCatalog = (type) => (type === 'Service' ? services : inventoryProducts);

  const handleItemSelect = (index, catalogId) => {
    const type = form.getValues(`items.${index}.type`);
    const catalog = getCatalog(type);
    const selected = catalog.find((c) => c._id === catalogId);
    if (!selected) return;

    form.setValue(`items.${index}.item`, selected._id);
    form.setValue(`items.${index}.name`, selected.name);
    form.setValue(`items.${index}.price`, selected.price ?? 0);
  };

  const handleTypeChange = (index, type) => {
    form.setValue(`items.${index}.type`, type);
    // reset dependent fields since the catalog changed
    form.setValue(`items.${index}.item`, "");
    form.setValue(`items.${index}.name`, "");
    form.setValue(`items.${index}.price`, 0);
  };

  return (
    <>
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
        name="purpose"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Purpose</FormLabel>
            <FormControl>
              <Textarea placeholder="Reason for this order" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="managementAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Management Amount</FormLabel>
            <FormControl>
              <Input type="number" min={0} step="0.01" placeholder="0.00" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator className="my-2" />

      <div className="flex items-center justify-between">
        <FormLabel>Sponsors</FormLabel>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => appendSponsor({ name: "", amount: 0 })}
        >
          Add Sponsor
        </Button>
      </div>

      {sponsorFields.map((item, index) => (
        <div key={item.id} className="flex gap-2 items-start">
          <FormField
            control={form.control}
            name={`sponsors.${index}.name`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Sponsor name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`sponsors.${index}.amount`}
            render={({ field }) => (
              <FormItem className="w-32">
                <FormControl>
                  <Input type="number" min={0} step="0.01" placeholder="Amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" variant="destructive" onClick={() => removeSponsor(index)}>
            Remove
          </Button>
        </div>
      ))}

      <Separator className="my-2" />

      <div className="flex items-center justify-between">
        <FormLabel>Items</FormLabel>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            appendItem({ type: "InventoryProduct", item: "", name: "", quantity: 1, price: 0 })
          }
        >
          Add Item
        </Button>
      </div>

      {itemFields.map((fieldItem, index) => {
        const currentType = items[index]?.type || 'InventoryProduct';
        const catalog = getCatalog(currentType);
        const qty = Number(items[index]?.quantity) || 0;
        const price = Number(items[index]?.price) || 0;

        return (
          <div key={fieldItem.id} className="grid grid-cols-12 gap-2 items-start">
            <FormField
              control={form.control}
              name={`items.${index}.type`}
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <Select
                    value={field.value}
                    onValueChange={(val) => handleTypeChange(index, val)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="InventoryProduct">Product</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`items.${index}.item`}
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      handleItemSelect(index, val);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={currentType === 'Service' ? 'Select a service' : 'Select a product'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {catalog.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
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
              name={`items.${index}.quantity`}
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormControl>
                    <Input type="number" min={1} placeholder="Qty" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`items.${index}.price`}
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormControl>
                    <Input type="number" placeholder="Price" {...field} disabled readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-1 flex items-center gap-1 pt-2">
              <span className="text-xs text-muted-foreground">{(qty * price).toFixed(2)}</span>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(index)}>
                ✕
              </Button>
            </div>
          </div>
        );
      })}

      <Separator className="my-2" />

      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex justify-between w-56">
          <span className="text-muted-foreground">Total Cost</span>
          <span>{totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between w-56">
          <span className="text-muted-foreground">Total Available</span>
          <span>{totalAvailable.toFixed(2)}</span>
        </div>
        {overBudget && (
          <span className="text-destructive text-xs">
            Order total exceeds available funds (management + sponsorship)
          </span>
        )}
      </div>
    </>
  );
}