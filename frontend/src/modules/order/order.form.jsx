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
import { Label } from "@/components/ui/label";

const formatVariant = (variant) => {
  if (!variant) return "";
  const entries =
    typeof variant.entries === "function"
      ? [...variant.entries()]
      : Object.entries(variant);
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
};

export default function OrderForm({
  form,
  branches = [],
  departments = [],
  BillingItemSearchCombobox, 
  searchProducts 
}) {
  const selectedBranch = useWatch({ control: form.control, name: "branch" });

  const filteredDepartments = selectedBranch
    ? departments.filter((d) => (d.branch?._id || d.branch) === selectedBranch)
    : departments;

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

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const {
    fields: sponsorFields,
    append: appendSponsor,
    remove: removeSponsor,
  } = useFieldArray({
    control: form.control,
    name: "sponsors",
  });

  const items = useWatch({ control: form.control, name: "items" }) || [];
  const sponsors = useWatch({ control: form.control, name: "sponsors" }) || [];
  const managementAmount =
    useWatch({ control: form.control, name: "managementAmount" }) || 0;

  const totalCost = items.reduce(
    (sum, i) => sum + (Number(i?.quantity) || 0) * (Number(i?.price) || 0),
    0
  );
  const totalSponsorship = sponsors.reduce(
    (sum, s) => sum + (Number(s?.amount) || 0),
    0
  );
  const totalAvailable = Number(managementAmount || 0) + totalSponsorship;
  const overBudget = totalCost > totalAvailable;

  const handleSelectItem = (selectedItem) => {
    const existingIndex = items.findIndex(
      (i) => String(i.item) === String(selectedItem._id)
    );

    if (existingIndex > -1) {
      const currentQty = form.getValues(`items.${existingIndex}.quantity`) || 1;
      form.setValue(`items.${existingIndex}.quantity`, currentQty + 1, {
        shouldValidate: true,
      });
    } else {
      appendItem({
        type: selectedItem.type,
        item: selectedItem._id,
        name: selectedItem.name,
        quantity: 1,
        price: selectedItem.price ?? 0,
        variant: selectedItem.variant,
      });
    }
  };

  return (
    <>
      {/* Branch */}
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

      {/* Department */}
      <FormField
        control={form.control}
        name="department"
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>Department</FormLabel>
            <Select
              onValueChange={f.onChange}
              value={f.value}
              disabled={!selectedBranch}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      selectedBranch
                        ? "Select a department"
                        : "Select a branch first"
                    }
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

      {/* Purpose */}
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

      {/* Management Amount */}
      <FormField
        control={form.control}
        name="managementAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Management Amount</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator className="my-2" />

      {/* Sponsors */}
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
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Amount"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="destructive"
            onClick={() => removeSponsor(index)}
          >
            Remove
          </Button>
        </div>
      ))}

      <Separator className="my-2" />

      {/* Items – search & add */}
      <div className="space-y-3">
        <FormLabel>Items</FormLabel>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Search and Add Products / Services
          </Label>

          {BillingItemSearchCombobox ? (
            <BillingItemSearchCombobox
              value=""
              currentItemName=""
              onSelect={handleSelectItem}
              placeholder="Search by product or service name..."
              searchProducts={searchProducts}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Search component not available
            </p>
          )}
        </div>

        {itemFields.length > 0 && (
          <>
            <div className="hidden sm:grid sm:grid-cols-[3fr_1fr_1.2fr_auto] gap-3 text-xs font-semibold text-muted-foreground px-1">
              <div>Item</div>
              <div>Qty</div>
              <div>Price</div>
              <div></div>
            </div>

            {itemFields.map((fieldItem, index) => {
              const currentType = items[index]?.type || "InventoryProduct";
              const currentVariant = items[index]?.variant;
              const qty = Number(items[index]?.quantity) || 0;
              const price = Number(items[index]?.price) || 0;

              return (
                <div
                  key={fieldItem.id}
                  className="grid grid-cols-1 sm:grid-cols-[3fr_1fr_1.2fr_auto] gap-3 items-start border-b pb-3 last:border-0"
                >
                  {/* Name + type/variant */}
                  <div className="flex flex-col gap-0.5 min-w-0 sm:pt-2">
                    <span className="font-medium text-sm truncate">
                      {items[index]?.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      {currentType === "InventoryProduct" ? (
                        <>
                          Product
                          {currentVariant &&
                            ` • ${formatVariant(currentVariant)}`}
                        </>
                      ) : (
                        "Service"
                      )}
                    </span>
                  </div>

                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sm:hidden">Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price (read-only) */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sm:hidden">Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">
                              ₹
                            </span>
                            <Input
                              type="number"
                              className="pl-6"
                              {...field}
                              disabled
                              readOnly
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Line total + remove */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ₹{(qty * price).toFixed(2)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <Separator className="my-2" />

      {/* Summary */}
      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex justify-between w-56">
          <span className="text-muted-foreground">Total Cost</span>
          <span>₹{totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between w-56">
          <span className="text-muted-foreground">Total Available</span>
          <span>₹{totalAvailable.toFixed(2)}</span>
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