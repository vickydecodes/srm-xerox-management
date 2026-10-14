"use client";

import { useEffect, useState } from "react";
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
import { useAuth } from "@/core/contexts/auth.context";
import { cn } from "@/lib/utils";

const formatVariant = (variant) => {
  if (!variant) return "";
  const entries =
    typeof variant.entries === "function"
      ? [...variant.entries()]
      : Object.entries(variant);
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
};

// Builds a fresh line-item object from a product/service record
const buildItemRow = (selectedItem) => {
  const rawSizes = selectedItem.sizes || selectedItem.details?.sizes || [];
  const itemIsCustom =
    selectedItem.isCustomSize ?? selectedItem.details?.isCustomSize ?? false;
  const itemSizes = itemIsCustom
    ? rawSizes.filter((s) =>
        typeof s === "object" ? s.size !== "Standard" : s !== "Standard",
      )
    : rawSizes;
  const firstSize = itemSizes.length > 0 ? itemSizes[0] : null;
  const initialSize = firstSize
    ? typeof firstSize === "object"
      ? firstSize.size
      : firstSize
    : itemIsCustom
      ? "Custom"
      : "";
  let initialPrice = Number(selectedItem.price) || 0;
  if (
    firstSize &&
    typeof firstSize === "object" &&
    firstSize.price !== undefined
  ) {
    initialPrice = Number(firstSize.price) || 0;
  } else if (initialSize === "Custom") {
    initialPrice = 0;
  }

  return {
    type: selectedItem.type,
    item: selectedItem._id,
    name: selectedItem.name,
    quantity: 1,
    price: initialPrice,
    variant: selectedItem.variant,
    size: initialSize,
    customWidth: "",
    customHeight: "",
    customUnit:
      selectedItem.unit === "inch" || selectedItem.details?.unit === "inch"
        ? "inch"
        : "ft",
    customRate:
      Number(selectedItem.price) ||
      (firstSize && typeof firstSize === "object" && Number(firstSize.price)) ||
      0,
    sizes: itemSizes,
    isCustomSize: itemIsCustom,
    customPriceAdded: false,
  };
};

export default function OrderForm({ form, shops = [], searchProducts }) {
  const { user } = useAuth();
  const isDeptAdmin =
    user?.role === "department_admin" || user?.role === "super_admin";
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const orderType = useWatch({ control: form.control, name: "orderType" });
  const fundingMethod = useWatch({
    control: form.control,
    name: "fundingMethod",
  });
  const items = useWatch({ control: form.control, name: "items" }) || [];
  const selfSupports = useWatch({ control: form.control, name: "self_supports" }) || [];
  const managementAmount =
    useWatch({ control: form.control, name: "managementAmount" }) || 0;

  const totalCost = items.reduce(
    (sum, i) => sum + (Number(i?.quantity) || 0) * (Number(i?.price) || 0),
    0,
  );
  const totalSelfSupport = selfSupports.reduce(
    (sum, s) => sum + (Number(s?.amount) || 0),
    0,
  );
  const totalAvailable =
    fundingMethod === "management"
      ? Number(managementAmount || 0)
      : fundingMethod === "self_support"
        ? totalSelfSupport
        : 0;
  const overBudget = totalCost > totalAvailable;

  useEffect(() => {
    let active = true;
    setSelectedItemId("");
    setAvailableItems([]);
    setItemsError("");

    if (!searchProducts) {
      setItemsError("Product and service list is unavailable.");
      setItemsLoading(false);
      return () => {
        active = false;
      };
    }

    const loadItems = async () => {
      setItemsLoading(true);
      try {
        const results = await searchProducts("", { orderType });
        if (!Array.isArray(results)) {
          throw new Error(
            "Product and service search returned invalid results.",
          );
        }
        const filteredItems = results.filter((item) => {
          const isWorkOrder =
            item.isWorkOrder === true || item.details?.isWorkOrder === true;
          return orderType === "WORK_ORDER" ? isWorkOrder : !isWorkOrder;
        });

        if (active) setAvailableItems(filteredItems);
      } catch {
        if (active) {
          setItemsError(
            "Unable to load products and services. Please try again.",
          );
        }
      } finally {
        if (active) setItemsLoading(false);
      }
    };

    loadItems();
    return () => {
      active = false;
    };
  }, [orderType, searchProducts]);

  const handleSelectItem = (selectedItem) => {
    // If orderType is WORK_ORDER, only allow items with isWorkOrder === true (whether product or service)
    if (
      orderType === "WORK_ORDER" &&
      !selectedItem.isWorkOrder &&
      !selectedItem.details?.isWorkOrder
    ) {
      return;
    }

    // Always add as a NEW line item (no merging with existing rows)
    appendItem(buildItemRow(selectedItem));
  };

  // Adds another row of the same product as the row at `index`
  const handleAddAnother = (index) => {
    const row = form.getValues(`items.${index}`);
    if (!row) return;

    const source = availableItems.find(
      (a) => String(a._id) === String(row.item),
    );

    if (source) {
      appendItem(buildItemRow(source));
      return;
    }

    // Fallback: product isn't in the loaded list, so clone the existing row
    const isCustomRow = row.size === "Custom";
    appendItem({
      ...row,
      quantity: 1,
      price: isCustomRow ? 0 : row.price,
      customSize: "",
      customWidth: "",
      customHeight: "",
      customPriceAdded: false,
    });
  };

  const recalcCustomPrice = (index, width, height, unit = "ft", rate) => {
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    const r = Number(rate) || 0;

    if (w > 0 && h > 0) {
      const area = Math.round(w * h * 100) / 100;
      const calculatedPrice = r > 0 ? Math.round(area * r * 100) / 100 : 0;
      const label = `${h}x${w}`;

      if (calculatedPrice > 0) {
        form.setValue(`items.${index}.price`, calculatedPrice, {
          shouldValidate: true,
        });
      }
      form.setValue(`items.${index}.customSize`, label, {
        shouldValidate: true,
      });
      form.setValue(`items.${index}.customPriceAdded`, true, {
        shouldValidate: true,
      });
    } else {
      const label = w > 0 && h > 0 ? `${h}x${w}` : "";
      form.setValue(`items.${index}.customSize`, label);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Select Shop */}
      <FormField
        control={form.control}
        name="shop"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Shop</FormLabel>
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

      {/* 2. Type of Order */}
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

      {/* 3. Event Name */}
      <FormField
        control={form.control}
        name="eventName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Name</FormLabel>
            <FormControl>
              <Input placeholder="Name of the event (optional)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 4. Event Date */}
      <FormField
        control={form.control}
        name="eventDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Date</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 5. Purpose */}
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

      {/* 6. Enter your email */}
      <FormField
        control={form.control}
        name="attachmentEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Enter your Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="Email address from which you sent the Design File"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 7. Select Product / Service + added items */}
      <div className="space-y-3 min-w-0 rounded-lg border p-4">
        <FormLabel className="text-base">Items</FormLabel>

        {itemFields.length === 0 && (
          <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
            No items added yet. Select a product or service below and click "Add
            product".
          </p>
        )}

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

                    {/* Size Selector for services with fixed sizes or isCustomSize */}
                    {((items[index]?.sizes && items[index]?.sizes.length > 0) ||
                      items[index]?.isCustomSize) && (
                      <div className="mt-1.5 space-y-1.5 w-full max-w-[240px]">
                        <FormField
                          control={form.control}
                          name={`items.${index}.size`}
                          render={({ field }) => (
                            <FormItem className="space-y-0.5">
                              <FormLabel className="text-[10px] font-medium text-muted-foreground">
                                Size
                              </FormLabel>
                              <Select
                                value={
                                  field.value ? String(field.value) : undefined
                                }
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  if (val !== "Custom") {
                                    form.setValue(
                                      `items.${index}.customSize`,
                                      "",
                                    );
                                    form.setValue(
                                      `items.${index}.customWidth`,
                                      "",
                                    );
                                    form.setValue(
                                      `items.${index}.customHeight`,
                                      "",
                                    );
                                    form.setValue(
                                      `items.${index}.customPriceAdded`,
                                      false,
                                    );
                                    // Update price based on selected size
                                    const allSizes = items[index]?.sizes || [];
                                    const matchedSize = allSizes.find((sz) =>
                                      typeof sz === "object"
                                        ? sz.size === val
                                        : sz === val,
                                    );
                                    if (
                                      matchedSize &&
                                      typeof matchedSize === "object" &&
                                      matchedSize.price !== undefined
                                    ) {
                                      form.setValue(
                                        `items.${index}.price`,
                                        Number(matchedSize.price) || 0,
                                        { shouldValidate: true },
                                      );
                                    }
                                  } else {
                                    // Custom size selected: calculate from dimensions if already set
                                    const w = items[index]?.customWidth;
                                    const h = items[index]?.customHeight;
                                    const u = items[index]?.customUnit || "ft";
                                    const currentRate =
                                      items[index]?.customRate;
                                    const r =
                                      currentRate !== undefined &&
                                      currentRate !== ""
                                        ? Number(currentRate)
                                        : Number(items[index]?.price) || 0;
                                    if (
                                      currentRate === undefined ||
                                      currentRate === ""
                                    ) {
                                      form.setValue(
                                        `items.${index}.customRate`,
                                        r,
                                      );
                                    }
                                    recalcCustomPrice(index, w, h, u, r);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs bg-background">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                  {items[index]?.sizes?.map((sz) => {
                                    const szLabel =
                                      typeof sz === "object"
                                        ? `${sz.size} (₹${sz.price})`
                                        : sz;
                                    const szVal =
                                      typeof sz === "object" ? sz.size : sz;
                                    return (
                                      <SelectItem
                                        key={szVal}
                                        value={szVal}
                                        className="text-xs"
                                      >
                                        {szLabel}
                                      </SelectItem>
                                    );
                                  })}
                                  {items[index]?.isCustomSize && (
                                    <SelectItem
                                      value="Custom"
                                      className="text-xs font-semibold text-primary"
                                    >
                                      Custom
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        {/* Dimension inputs when Custom is selected */}
                        {items[index]?.isCustomSize &&
                          items[index]?.size === "Custom" && (
                            <div className="rounded-md border p-2 bg-muted/20 space-y-1.5 mt-1.5 w-full min-w-[200px]">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                <span>Dimensions</span>
                                <span className="text-[10px] text-primary">
                                  Length × Width
                                </span>
                              </div>

                              {/* Length x Width */}
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  placeholder="Length"
                                  className="h-7 text-xs bg-background flex-1"
                                  value={items[index]?.customHeight ?? ""}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    form.setValue(
                                      `items.${index}.customHeight`,
                                      val,
                                    );
                                    recalcCustomPrice(
                                      index,
                                      items[index]?.customWidth,
                                      val,
                                      items[index]?.customUnit,
                                      items[index]?.customRate,
                                    );
                                  }}
                                />
                                <span className="text-xs text-muted-foreground font-bold">
                                  ×
                                </span>
                                <Input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  placeholder="Width"
                                  className="h-7 text-xs bg-background flex-1"
                                  value={items[index]?.customWidth ?? ""}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    form.setValue(
                                      `items.${index}.customWidth`,
                                      val,
                                    );
                                    recalcCustomPrice(
                                      index,
                                      val,
                                      items[index]?.customHeight,
                                      items[index]?.customUnit,
                                      items[index]?.customRate,
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Add another of this product */}
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto self-start p-0 mt-1.5 text-xs max-w-full justify-start"
                      onClick={() => handleAddAnother(index)}
                    >
                      <span className="truncate">
                        + Add another {items[index]?.name}
                      </span>
                    </Button>
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
                              step="0.01"
                              min="0"
                              placeholder="0"
                              className="bg-background pl-6 text-muted-foreground"
                              value={
                                field.value === 0 ||
                                field.value === "0" ||
                                field.value === "" ||
                                field.value === undefined
                                  ? ""
                                  : field.value
                              }
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
                    {items[index]?.type === "Service" &&
                    items[index]?.size === "Custom" &&
                    (!price || price === 0) ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                        — (Enter dimensions)
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ₹{(qty * price).toFixed(2)}
                      </span>
                    )}
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

        {/* Select Product / Service (now below the added items) */}
        <div className="space-y-2 pt-1">
          <Label htmlFor="order-item-select" className="text-sm font-medium">
            Select a Product / Service
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selectedItemId}
              onValueChange={setSelectedItemId}
              disabled={itemsLoading || availableItems.length === 0}
            >
              <SelectTrigger id="order-item-select" className="w-full min-w-0">
                <SelectValue
                  placeholder={
                    itemsLoading
                      ? "Loading products and services..."
                      : "Select a product or service"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item._id} value={String(item._id)}>
                    {item.name}
                    {item.type === "InventoryProduct" && item.variant
                      ? ` • ${formatVariant(item.variant)}`
                      : ""}
                    {` — ${item.type === "InventoryProduct" ? "Product" : "Service"} • ₹${item.price}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={!selectedItemId || itemsLoading}
              onClick={() => {
                const selectedItem = availableItems.find(
                  (item) => String(item._id) === selectedItemId,
                );
                if (selectedItem) {
                  handleSelectItem(selectedItem);
                  setSelectedItemId("");
                }
              }}
            >
              Add product
            </Button>
          </div>
          {itemsError && (
            <p role="alert" className="text-sm text-destructive">
              {itemsError}
            </p>
          )}
          {!itemsLoading && !itemsError && availableItems.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No products or services available for this order type.
            </p>
          )}
        </div>
      </div>

      {/* 8. Attachment (Department Admin Only) */}
      {isDeptAdmin && (
        <FormField
          control={form.control}
          name="proofFiles"
          render={({ field }) => (
            <FormItem className="space-y-2 rounded-lg border p-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-semibold">
                  Approved Document Attachements
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <span className="text-[11px] text-muted-foreground">
                  Required before saving
                </span>
              </div>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const current = field.value || [];
                    field.onChange([...current, ...files]);
                  }}
                />
              </FormControl>
              <FormMessage />
              {Array.isArray(field.value) && field.value.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {field.value.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded text-xs"
                    >
                      <span className="truncate max-w-[180px]">
                        📄 {f.name}
                      </span>
                      <button
                        type="button"
                        className="text-red-500 font-bold ml-1 hover:text-red-700"
                        onClick={() => {
                          const updated = field.value.filter(
                            (_, idx) => idx !== i,
                          );
                          field.onChange(updated);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </FormItem>
          )}
        />
      )}

      {/* 9. Payment method */}
      <FormField
        control={form.control}
        name="fundingMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Payment Method</FormLabel>
            <FormControl>
              <Select
                value={field.value || undefined}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "management") {
                    form.setValue("self_supports", [], { shouldValidate: true });
                  } else {
                    form.setValue("managementAmount", 0, {
                      shouldValidate: true,
                    });
                    form.setValue(
                      "self_supports",
                      [
                        {
                          name: "Self Support",
                          amount: totalSelfSupport,
                        },
                      ],
                      { shouldValidate: true },
                    );
                  }
                }}
              >
                <SelectTrigger id="funding-method" aria-label="Payment Method">
                  <SelectValue placeholder="Choose a payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="management">Management Amount</SelectItem>
                  <SelectItem value="self_support">
                    Self Support Amount
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {fundingMethod === "management" && (
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
                  max={totalCost}
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      field.onChange("");
                      return;
                    }
                    field.onChange(Math.min(parseFloat(raw) || 0, totalCost));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {fundingMethod === "self_support" && (
        <FormField
          control={form.control}
          name="self_supports.0.amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Self Support Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={totalCost}
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      field.onChange("");
                      return;
                    }
                    field.onChange(Math.min(parseFloat(raw) || 0, totalCost));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

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
          <span className="text-destructive text-xs text-right">
            Order total exceeds available funds (management + self support)
          </span>
        )}
      </div>
    </div>
  );
}
