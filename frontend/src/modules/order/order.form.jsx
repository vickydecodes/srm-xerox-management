"use client";

import { useEffect, useMemo, useState } from "react";
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
import { DatePicker } from "@/components/ui/date-picker";

const formatVariant = (variant) => {
  if (!variant) return "";
  const entries =
    typeof variant.entries === "function"
      ? [...variant.entries()]
      : Object.entries(variant);
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
};

const DEFAULT_SERVICE_SIZES = [
  { size: "Standard", price: null },
  { size: "A4", price: null },
  { size: "A3", price: null },
  { size: "A2", price: null },
  { size: "A1", price: null },
  { size: "A0", price: null },
  { size: "Legal", price: null },
  { size: "Letter", price: null },
];

// Builds a fresh line-item object from a product/service record
const buildItemRow = (selectedItem) => {
  const isService = selectedItem.type === "Service";
  const rawSizes = selectedItem.sizes || selectedItem.details?.sizes || [];

  // Custom size and dimensions are supported for ALL services or items configured with isCustomSize
  const itemIsCustom =
    isService ||
    (selectedItem.isCustomSize ?? selectedItem.details?.isCustomSize ?? false);

  // For services: if rawSizes are configured, use them; if empty, provide standard service sizes
  let itemSizes = rawSizes;
  if (isService && rawSizes.length === 0) {
    itemSizes = DEFAULT_SERVICE_SIZES.map((s) => ({
      ...s,
      price: Number(selectedItem.price) || 0,
    }));
  } else if (itemIsCustom && rawSizes.length > 0) {
    itemSizes = rawSizes.filter((s) =>
      typeof s === "object" ? s.size !== "Standard" : s !== "Standard",
    );
  }

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
    firstSize.price !== undefined &&
    firstSize.price !== null &&
    Number(firstSize.price) > 0
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
    customSize: "",
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
    isWorkOrder: Boolean(
      selectedItem.isWorkOrder === true ||
      selectedItem.isWorkOrder === "true" ||
      selectedItem.details?.isWorkOrder === true ||
      selectedItem.details?.isWorkOrder === "true"
    ),
    customPriceAdded: false,
    attachment: null,
    attachmentFile: null,
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
  const eventDate = useWatch({ control: form.control, name: "eventDate" });
  const fundingMethod = useWatch({
    control: form.control,
    name: "fundingMethod",
  });
  const items = useWatch({ control: form.control, name: "items" }) || [];
  const selfSupports = useWatch({ control: form.control, name: "self_supports" }) || [];
  const managementAmount =
    useWatch({ control: form.control, name: "managementAmount" }) || 0;

  const minEventDateString = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const isLocked = Boolean(eventDate && eventDate < minEventDateString);

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
            item.isWorkOrder === true ||
            item.isWorkOrder === "true" ||
            item.details?.isWorkOrder === true ||
            item.details?.isWorkOrder === "true";

          if (orderType === "WORK_ORDER") {
            // Strictly only services configured for work order
            return item.type === "Service" && isWorkOrder;
          }
          return !isWorkOrder;
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

  const displayedAvailableItems = useMemo(() => {
    if (orderType === "WORK_ORDER") {
      return availableItems.filter((item) => {
        const isWO =
          item.isWorkOrder === true ||
          item.isWorkOrder === "true" ||
          item.details?.isWorkOrder === true ||
          item.details?.isWorkOrder === "true";
        return item.type === "Service" && isWO;
      });
    }
    return availableItems.filter((item) => {
      const isWO =
        item.isWorkOrder === true ||
        item.isWorkOrder === "true" ||
        item.details?.isWorkOrder === true ||
        item.details?.isWorkOrder === "true";
      return !isWO;
    });
  }, [availableItems, orderType]);

  // Clean up non-work-order items when orderType is switched to WORK_ORDER
  useEffect(() => {
    setSelectedItemId("");
    if (orderType === "WORK_ORDER") {
      const currentItems = form.getValues("items") || [];
      const workOrderServicesOnly = currentItems.filter((i) => {
        if (i.type && i.type !== "Service") return false;
        if (i.isWorkOrder === true) return true;
        if (i.isWorkOrder === false) return false;
        if (availableItems.length > 0) {
          const itemId = i.item || i.product || i.id;
          const match = availableItems.find(
            (a) => String(a._id) === String(itemId) || a.name === i.name,
          );
          if (match) {
            const matchIsWorkOrder =
              match.isWorkOrder === true ||
              match.isWorkOrder === "true" ||
              match.details?.isWorkOrder === true ||
              match.details?.isWorkOrder === "true";
            return match.type === "Service" && matchIsWorkOrder;
          }
          return false;
        }
        return i.type === "Service";
      });
      if (workOrderServicesOnly.length !== currentItems.length) {
        form.setValue("items", workOrderServicesOnly, { shouldValidate: true });
      }
    } else if (orderType === "XEROX_ORDER") {
      const currentItems = form.getValues("items") || [];
      const nonWorkOrderItems = currentItems.filter((i) => {
        if (i.isWorkOrder === true) return false;
        if (availableItems.length > 0) {
          const itemId = i.item || i.product || i.id;
          const match = availableItems.find(
            (a) => String(a._id) === String(itemId) || a.name === i.name,
          );
          if (match) {
            const matchIsWorkOrder =
              match.isWorkOrder === true ||
              match.isWorkOrder === "true" ||
              match.details?.isWorkOrder === true ||
              match.details?.isWorkOrder === "true";
            return !matchIsWorkOrder;
          }
        }
        return true;
      });
      if (nonWorkOrderItems.length !== currentItems.length) {
        form.setValue("items", nonWorkOrderItems, { shouldValidate: true });
      }
    }
  }, [orderType, availableItems, form]);

  const handleSelectItem = (selectedItem) => {
    const isWorkOrder =
      selectedItem.isWorkOrder === true ||
      selectedItem.isWorkOrder === "true" ||
      selectedItem.details?.isWorkOrder === true ||
      selectedItem.details?.isWorkOrder === "true";

    // If orderType is WORK_ORDER, ONLY allow Service items with isWorkOrder === true
    if (
      orderType === "WORK_ORDER" &&
      (selectedItem.type !== "Service" || !isWorkOrder)
    ) {
      return;
    }

    if (orderType !== "WORK_ORDER" && isWorkOrder) {
      return;
    }

    // Always add as a NEW line item (no merging with existing rows)
    appendItem(buildItemRow(selectedItem));
  };

  // Adds another row of the same product or service as the row at `index`
  const handleAddAnother = (index) => {
    const row = form.getValues(`items.${index}`);
    if (!row) return;

    if (orderType === "WORK_ORDER") {
      const isWO =
        row.type === "Service" &&
        row.isWorkOrder !== false;
      if (!isWO) return;
    }

    const itemId = row.item || row.product || row.id;
    const source = displayedAvailableItems.find(
      (a) => String(a._id) === String(itemId) || a.name === row.name,
    );

    if (source) {
      appendItem(buildItemRow(source));
      return;
    }

    // Fallback: product or service isn't in the loaded list, so clone the existing row
    const isCustomRow = row.size === "Custom";
    appendItem({
      ...row,
      quantity: 1,
      price: isCustomRow ? 0 : row.price,
      size:
        row.sizes && row.sizes.length > 0
          ? typeof row.sizes[0] === "object"
            ? row.sizes[0].size
            : row.sizes[0]
          : row.isCustomSize
            ? "Custom"
            : "",
      customSize: "",
      customWidth: "",
      customHeight: "",
      customPriceAdded: false,
      attachment: null,
      attachmentFile: null,
      isWorkOrder: Boolean(
        row.isWorkOrder === true ||
        row.isWorkOrder === "true" ||
        row.details?.isWorkOrder === true
      ),
    });
  };

  const recalcCustomPrice = (index, width, height, unit = "ft", rate) => {
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    const r = Number(rate) || 0;
    const isInch = unit === "inch" || unit === "in";

    if (w > 0 && h > 0) {
      const sqft = isInch
        ? Math.round(((w * h) / 144) * 100) / 100
        : Math.round(w * h * 100) / 100;
      const calculatedPrice = r > 0 ? Math.round(sqft * r * 100) / 100 : 0;
      const label = `${h}×${w} ${unit}${sqft > 0 ? ` (${sqft} sq.ft)` : ""}`;

      if (calculatedPrice > 0) {
        form.setValue(`items.${index}.price`, calculatedPrice, {
          shouldValidate: true,
        });
      }
      form.setValue(`items.${index}.customSize`, label, {
        shouldValidate: true,
      });
      form.setValue(`items.${index}.customWidth`, width, {
        shouldValidate: true,
      });
      form.setValue(`items.${index}.customHeight`, height, {
        shouldValidate: true,
      });
      form.setValue(`items.${index}.customUnit`, unit, {
        shouldValidate: true,
      });
      form.setValue(`items.${index}.customPriceAdded`, true, {
        shouldValidate: true,
      });
    } else {
      const label = w > 0 && h > 0 ? `${h}×${w} ${unit}` : "";
      form.setValue(`items.${index}.customSize`, label);
    }
  };

  return (
    <div className="space-y-4">
      {/* 72-Hour Lock Warning Banner */}
      {isLocked && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3.5 text-sm text-destructive flex items-center gap-3">
          <span className="text-xl">🔒</span>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-wider">Order Form Locked</h5>
            <p className="text-xs">
              Order form must be submitted at least 72 hours before the event date (earliest allowed event date is {minEventDateString}).
            </p>
          </div>
        </div>
      )}

      {/* 1. Type of Order */}
      <FormField
        control={form.control}
        name="orderType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Type of Order <span className="text-destructive">*</span>
            </FormLabel>
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

      {/* 2. Event Name */}
      <FormField
        control={form.control}
        name="eventName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Event Name <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Name of the event" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 3. Event Date */}
      <FormField
        control={form.control}
        name="eventDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Event Date <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-1.5 font-normal">
                (Must be submitted at least 72 hrs in advance)
              </span>
            </FormLabel>
            <FormControl>
              <DatePicker
                minDate={minEventDateString}
                placeholder="Select event date"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 4. Approved Referral Number */}
      <FormField
        control={form.control}
        name="approvedReferralNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Approved Referral Number <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Enter approved referral number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 5. Approved Date */}
      <FormField
        control={form.control}
        name="approvedDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Approved Date <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <DatePicker
                placeholder="Select approved date"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 6. Purpose */}
      <FormField
        control={form.control}
        name="purpose"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Purpose <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Textarea placeholder="Reason for this order" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 7. Enter your email */}
      <FormField
        control={form.control}
        name="attachmentEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Enter your Email <span className="text-destructive">*</span>
            </FormLabel>
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

      {/* 8. Select Product / Service + added items */}
      <div className="space-y-3 min-w-0 rounded-lg border p-4">
        <FormLabel className="text-base">
          Items <span className="text-destructive">*</span>
        </FormLabel>

        {itemFields.length === 0 && (
          <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
            No items added yet. Select a product or service below and click "Add
            product".
          </p>
        )}

        {itemFields.length > 0 && (
          <>
            <div
              className={cn(
                "hidden sm:grid gap-3 text-xs font-semibold text-muted-foreground px-1",
                orderType === "WORK_ORDER"
                  ? "sm:grid-cols-[2fr_2fr_0.8fr_1fr_auto]"
                  : "sm:grid-cols-[3fr_1fr_1.2fr_auto]",
              )}
            >
              <div>Item</div>
              {orderType === "WORK_ORDER" && <div>Attach Approved Document *</div>}
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
                  className={cn(
                    "grid grid-cols-1 gap-3 items-start border-b pb-3 last:border-0",
                    orderType === "WORK_ORDER"
                      ? "sm:grid-cols-[2fr_2fr_0.8fr_1fr_auto]"
                      : "sm:grid-cols-[3fr_1fr_1.2fr_auto]",
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0 sm:pt-2">
                    <span className="font-medium text-sm truncate">
                      {items[index]?.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                      {currentType === "Service" &&
                        (items[index]?.isWorkOrder || orderType === "WORK_ORDER") && (
                          <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold px-1.5 py-0.2 rounded">
                            Work Order
                          </span>
                        )}
                    </div>

                    {/* Size Selector for all services and products with sizes/custom size */}
                    {(currentType === "Service" ||
                      (items[index]?.sizes && items[index]?.sizes.length > 0) ||
                      items[index]?.isCustomSize) && (
                        <div className="mt-1.5 space-y-1.5 w-full max-w-[240px]">
                          <FormField
                            control={form.control}
                            name={`items.${index}.size`}
                            render={({ field }) => (
                              <FormItem className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <FormLabel className="text-[10px] font-medium text-muted-foreground">
                                    Size / Dimensions
                                  </FormLabel>
                                  {items[index]?.size === "Custom" && (
                                    <span className="text-[10px] text-primary font-medium">
                                      Custom Specs
                                    </span>
                                  )}
                                </div>
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
                                        matchedSize.price !== undefined &&
                                        matchedSize.price !== null &&
                                        Number(matchedSize.price) > 0
                                      ) {
                                        form.setValue(
                                          `items.${index}.price`,
                                          Number(matchedSize.price) || 0,
                                          { shouldValidate: true },
                                        );
                                      } else if (items[index]?.customRate) {
                                        form.setValue(
                                          `items.${index}.price`,
                                          Number(items[index]?.customRate) || 0,
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
                                    <SelectValue placeholder="Select size / specs" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {items[index]?.sizes?.map((sz) => {
                                      const szPrice =
                                        typeof sz === "object" ? sz.price : undefined;
                                      const szLabel =
                                        typeof sz === "object"
                                          ? szPrice !== undefined &&
                                            szPrice !== null &&
                                            Number(szPrice) > 0
                                            ? `${sz.size} (₹${szPrice})`
                                            : sz.size
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
                                    {(currentType === "Service" ||
                                      items[index]?.isCustomSize) && (
                                        <SelectItem
                                          value="Custom"
                                          className="text-xs font-semibold text-primary"
                                        >
                                          Custom (Enter Dimensions)
                                        </SelectItem>
                                      )}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          {/* Dimension inputs & Square Feet calculation when Custom is selected */}
                          {(items[index]?.isCustomSize ||
                            currentType === "Service") &&
                            items[index]?.size === "Custom" && (
                              <div className="rounded-md border p-2 bg-muted/20 space-y-1.5 mt-1.5 w-full min-w-[240px]">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                                  <span>Dimensions & Sq.Ft</span>
                                  <div className="flex items-center gap-1">
                                    <label className="text-[10px] text-muted-foreground">
                                      Unit:
                                    </label>
                                    <select
                                      className="h-5 text-[10px] rounded border bg-background px-1"
                                      value={items[index]?.customUnit || "ft"}
                                      onChange={(e) => {
                                        const newUnit = e.target.value;
                                        form.setValue(
                                          `items.${index}.customUnit`,
                                          newUnit,
                                        );
                                        recalcCustomPrice(
                                          index,
                                          items[index]?.customWidth,
                                          items[index]?.customHeight,
                                          newUnit,
                                          items[index]?.customRate,
                                        );
                                      }}
                                    >
                                      <option value="ft">Feet (ft)</option>
                                      <option value="inch">Inches (in)</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Length x Width */}
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-1">
                                    <Input
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      placeholder="Length"
                                      className="h-7 text-xs bg-background w-full"
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
                                          items[index]?.customUnit || "ft",
                                          items[index]?.customRate,
                                        );
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground font-bold">
                                    ×
                                  </span>
                                  <div className="flex-1">
                                    <Input
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      placeholder="Width"
                                      className="h-7 text-xs bg-background w-full"
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
                                          items[index]?.customUnit || "ft",
                                          items[index]?.customRate,
                                        );
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Square feet & Rate preview badge */}
                                {(() => {
                                  const w =
                                    Number(items[index]?.customWidth) || 0;
                                  const h =
                                    Number(items[index]?.customHeight) || 0;
                                  const u = items[index]?.customUnit || "ft";
                                  const r =
                                    Number(items[index]?.customRate) || 0;
                                  if (w > 0 && h > 0) {
                                    const sqft =
                                      u === "inch"
                                        ? Math.round(((w * h) / 144) * 100) / 100
                                        : Math.round(w * h * 100) / 100;
                                    return (
                                      <div className="text-[10px] text-primary flex items-center justify-between font-medium bg-background px-2 py-0.5 rounded border">
                                        <span>📐 {sqft} sq.ft</span>
                                        {r > 0 ? (
                                          <span>
                                            @ ₹{r}/sq.ft = ₹{(sqft * r).toFixed(2)}
                                          </span>
                                        ) : (
                                          <span>Custom size set</span>
                                        )}
                                      </div>
                                    );
                                  }
                                  return (
                                    <span className="text-[10px] text-muted-foreground italic">
                                      Enter length & width to calculate sq.ft & price
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                        </div>
                      )}

                    {/* Add another of this product / service */}
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto self-start p-0 mt-1.5 text-xs max-w-full justify-start text-primary"
                      onClick={() => handleAddAnother(index)}
                    >
                      <span className="truncate">
                        + Add another {items[index]?.name} (different size/specs)
                      </span>
                    </Button>
                  </div>

                  {/* Work Order Service Attachment on the SAME LINE */}
                  {orderType === "WORK_ORDER" && (
                    <div className="flex flex-col gap-1 w-full sm:pt-2">
                      <Label className="sm:hidden text-xs font-semibold text-primary">
                        Attach Approved Document <span className="text-destructive">*</span>
                      </Label>
                      {currentType === "Service" ? (
                        <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-2 space-y-1.5 w-full">
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-semibold text-primary flex items-center gap-1">
                              <span>📎 Attach Approved Document</span>
                              <span className="text-destructive">*</span>
                            </Label>
                            <span className="text-[9px] text-destructive font-medium uppercase tracking-wider">
                              Mandatory
                            </span>
                          </div>

                          {items[index]?.attachment ? (
                            <div className="flex items-center justify-between bg-background border rounded px-2 py-1 text-xs">
                              <span className="truncate max-w-[130px] font-medium text-foreground">
                                📄 {items[index]?.attachment?.filename || items[index]?.attachment?.name || "Attached approved document"}
                              </span>
                              <button
                                type="button"
                                className="text-destructive font-bold text-xs hover:text-destructive/80 ml-1.5 shrink-0"
                                onClick={() => {
                                  form.setValue(`items.${index}.attachment`, null, { shouldValidate: true });
                                  form.setValue(`items.${index}.attachmentFile`, null);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,application/pdf"
                                className="h-7 text-xs bg-background file:text-xs file:h-full cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    form.setValue(
                                      `items.${index}.attachment`,
                                      {
                                        filename: file.name,
                                        mimetype: file.type,
                                        fileData: reader.result,
                                      },
                                      { shouldValidate: true }
                                    );
                                    form.setValue(`items.${index}.attachmentFile`, file);
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                              {form.formState.errors?.items?.[index]?.attachment && (
                                <p className="text-[10px] text-destructive mt-0.5 font-medium">
                                  {form.formState.errors.items[index].attachment.message || "Attach approved document is required"}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="sm:pt-2">
                        <FormLabel className="sm:hidden">Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            className="h-8 text-xs"
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
                      <FormItem className="sm:pt-2">
                        <FormLabel className="sm:hidden">Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground">
                              ₹
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0"
                              className="h-8 text-xs bg-background pl-6 text-muted-foreground"
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

                  <div className="flex items-center gap-2 pt-2 sm:pt-3">
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
            {orderType === "WORK_ORDER"
              ? "Select a Work Order Service"
              : "Select a Product / Service"}
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selectedItemId}
              onValueChange={setSelectedItemId}
              disabled={itemsLoading || displayedAvailableItems.length === 0}
            >
              <SelectTrigger id="order-item-select" className="w-full min-w-0">
                <SelectValue
                  placeholder={
                    itemsLoading
                      ? orderType === "WORK_ORDER"
                        ? "Loading work order services..."
                        : "Loading products and services..."
                      : orderType === "WORK_ORDER"
                        ? displayedAvailableItems.length === 0
                          ? "No work order services available"
                          : "Select a work order service"
                        : displayedAvailableItems.length === 0
                          ? "No products or services available"
                          : "Select a product or service"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {displayedAvailableItems.map((item) => (
                  <SelectItem key={item._id} value={String(item._id)}>
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      <span>{item.name}</span>
                      {item.type === "InventoryProduct" && item.variant ? (
                        <span className="text-xs text-muted-foreground">
                          • {formatVariant(item.variant)}
                        </span>
                      ) : null}
                      {(item.isWorkOrder || item.details?.isWorkOrder) && (
                        <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold px-1.5 py-0.2 rounded">
                          Work Order
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        — {item.type === "InventoryProduct" ? "Product" : "Service"} • ₹{item.price}
                      </span>
                    </span>
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
                const selectedItem = displayedAvailableItems.find(
                  (item) => String(item._id) === selectedItemId,
                );
                if (selectedItem) {
                  handleSelectItem(selectedItem);
                  setSelectedItemId("");
                }
              }}
            >
              Add item
            </Button>
          </div>
          {itemsError && (
            <p role="alert" className="text-sm text-destructive">
              {itemsError}
            </p>
          )}
          {!itemsLoading && !itemsError && displayedAvailableItems.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {orderType === "WORK_ORDER"
                ? "No work order services available."
                : "No products or services available for this order type."}
            </p>
          )}
        </div>
      </div>

      {/* Payment method */}
      <FormField
        control={form.control}
        name="fundingMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Payment Method <span className="text-destructive">*</span>
            </FormLabel>
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
              <FormLabel>
                Management Amount <span className="text-destructive">*</span>
              </FormLabel>
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
              <FormLabel>
                Self Support Amount <span className="text-destructive">*</span>
              </FormLabel>
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
