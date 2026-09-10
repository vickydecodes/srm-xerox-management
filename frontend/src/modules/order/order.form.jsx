"use client";

import { useEffect } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { useAuth } from "@/core/contexts/auth.context";
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
  shops = [],
  BillingItemSearchCombobox,
  searchProducts,
  lockBranchDept = false,
}) {
  const { user } = useAuth();
  const selectedBranch = useWatch({ control: form.control, name: "branch" });

  const filteredDepartments = selectedBranch
    ? departments.filter(
        (d) => String(d.branch?._id || d.branch) === String(selectedBranch)
      )
    : departments;

  // Only clear department when data is loaded and the current value is invalid
  useEffect(() => {
    if (!selectedBranch || departments.length === 0 || lockBranchDept) return;

    const currentDept = form.getValues("department");
    if (!currentDept) return;

    const isValid = filteredDepartments.some(
      (d) => String(d._id) === String(currentDept)
    );

    if (!isValid) {
      form.setValue("department", "");
    }
  }, [selectedBranch, departments, filteredDepartments, form, lockBranchDept]);

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

  // Helper to get display names from user object
  const userBranchName =
    typeof user?.branch === "object" ? user.branch?.name : null;
  const userDeptName =
    typeof user?.department === "object" ? user.department?.name : null;

  return (
    <>
      {/* Branch */}
      {lockBranchDept ? (
        // Read-only display for department admin / branch admin
        <div className="space-y-1.5">
          <Label>Branch</Label>
          <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm">
            {userBranchName || "—"}
          </div>
          {/* Hidden form field so the ID is still submitted */}
          <FormField
            control={form.control}
            name="branch"
            render={({ field }) => <input type="hidden" {...field} />}
          />
        </div>
      ) : (
        // Editable Select for super admin
        <FormField
          control={form.control}
          name="branch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <FormControl>
                <Select
                  key={`branch-${branches.length}-${field.value}`}
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={String(branch._id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Department */}
      {lockBranchDept ? (
        // Read-only display for department admin / branch admin
        <div className="space-y-1.5">
          <Label>Department</Label>
          <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm">
            {userDeptName || "—"}
          </div>
          {/* Hidden form field so the ID is still submitted */}
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => <input type="hidden" {...field} />}
          />
        </div>
      ) : (
        // Editable Select for super admin
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Select
                  key={`dept-${filteredDepartments.length}-${field.value}`}
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={field.onChange}
                  disabled={!selectedBranch}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedBranch
                          ? "Select a department"
                          : "Select a branch first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map((dept) => (
                      <SelectItem key={dept._id} value={String(dept._id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Shop */}
      <FormField
        control={form.control}
        name="shop"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Attending Shop</FormLabel>
            <FormControl>
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a shop to deliver from" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop._id} value={String(shop._id)}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Type of Order */}
      <FormField
        control={form.control}
        name="orderType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type of Order</FormLabel>
            <FormControl>
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type of order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORK_ORDER">Work Order</SelectItem>
                  <SelectItem value="XEROX_ORDER">Xerox order</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
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

      {/* Attachment Email */}
      <FormField
        control={form.control}
        name="attachmentEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Attachment Sender Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="Email address from which you sent the attachments"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Items */}
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
                max={Math.max(0, totalCost - totalSponsorship)}
                step="0.01"
                placeholder="0.00"
                {...field}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    field.onChange("");
                    return;
                  }
                  const val = parseFloat(raw) || 0;
                  const maxVal = Math.max(0, totalCost - totalSponsorship);
                  const cappedVal = Math.min(val, maxVal);
                  field.onChange(cappedVal);
                }}
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
          disabled={totalAvailable >= totalCost}
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
            render={({ field }) => {
              const currentSponsorAmt = Number(sponsors[index]?.amount) || 0;
              const maxSponsorAmt = Math.max(
                0,
                totalCost -
                  Number(managementAmount || 0) -
                  (totalSponsorship - currentSponsorAmt)
              );
              return (
                <FormItem className="w-32">
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={maxSponsorAmt}
                      step="0.01"
                      placeholder="Amount"
                      {...field}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          field.onChange("");
                          return;
                        }
                        const val = parseFloat(raw) || 0;
                        const cappedVal = Math.min(val, maxSponsorAmt);
                        field.onChange(cappedVal);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
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