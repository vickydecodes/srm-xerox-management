import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Wallet, Banknote, CreditCard, ShoppingBag, Receipt, Percent } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useSelectItems } from '@/core/hooks/useSelect';
import {
  createBillSchema,
  defaultBillValues,
  PAYMENT_METHODS,
} from './bill.schema';

const formatVariant = (variant) => {
  if (!variant) return '';
  const entries = typeof variant.entries === 'function' ? [...variant.entries()] : Object.entries(variant);
  if (entries.length === 0) return '';
  return `${entries.map(([k, v]) => `${k}: ${v}`).join(', ')}`;
};

export function BillForm({
  inventoryProducts = [],
  services = [],
  branches = [],
  departments = [],
  onSubmit,
  loading = false,
  defaultValues,
  isEdit = false,
}) {
  const form = useForm({
    resolver: zodResolver(createBillSchema),
    defaultValues: defaultValues || defaultBillValues,
  });

  const { control, handleSubmit, watch, setValue, reset } = form;

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const inventoryProductSelect = useSelectItems(inventoryProducts, {
    emptyText: 'No products in inventory',
    placeholder: 'Select product',
    getLabel: (ip) => ip.product?.name || 'Unknown Product',
    badge: {
      need: true,
      getBadge: (ip) => formatVariant(ip.variant) || null,
    },
  });

  const serviceSelect = useSelectItems(services, {
    emptyText: 'No services available',
    placeholder: 'Select service',
    getLabel: (s) => s.name,
  });

  const branchItems = useSelectItems(branches, {
    emptyText: 'No branches available',
    placeholder: 'Select branch',
  });
  const departmentItems = useSelectItems(departments, {
    emptyText: 'No departments available',
    placeholder: 'Select department',
  });

  const items = watch('items') || [];
  const discount = watch('discount') || 0;
  const tax = watch('tax') || 0;
  const paymentMethod = watch('paymentMethod');
  const isCredit = paymentMethod === 'credit';

  const subtotal = items.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.price) || 0),
    0
  );
  const total = Math.max(subtotal - discount + tax, 0);

  const handleTypeChange = (index, value) => {
    setValue(`items.${index}.type`, value, { shouldValidate: true });
    setValue(`items.${index}.item`, '', { shouldValidate: true });
    setValue(`items.${index}.name`, '', { shouldValidate: true });
    setValue(`items.${index}.price`, 0, { shouldValidate: true });
    setValue(`items.${index}.quantity`, 1, { shouldValidate: true });
  };

  const handleItemChange = (index, itemId, type) => {
    setValue(`items.${index}.item`, itemId, { shouldValidate: true });
    if (type === 'InventoryProduct') {
      const ip = inventoryProducts.find((p) => String(p._id) === itemId);
      if (ip) {
        const variantStr = formatVariant(ip.variant);
        const name = variantStr 
          ? `${ip.product?.name || 'Unknown Product'} (${variantStr})`
          : (ip.product?.name || 'Unknown Product');
        setValue(`items.${index}.name`, name.trim(), { shouldValidate: true });
        setValue(`items.${index}.price`, ip.price, { shouldValidate: true });
      }
    } else {
      const s = services.find((srv) => String(srv._id) === itemId);
      if (s) {
        setValue(`items.${index}.name`, s.name, { shouldValidate: true });
        setValue(`items.${index}.price`, s.price, { shouldValidate: true });
      }
    }
  };

  const handlePaymentMethodChange = (value) => {
    setValue('paymentMethod', value, { shouldValidate: true });
    if (value === 'credit') {
      setValue('status', 'unpaid', { shouldValidate: true });
    } else {
      setValue('status', 'paid', { shouldValidate: true });
      setValue('branch', '', { shouldValidate: true });
      setValue('department', '', { shouldValidate: true });
    }
  };

  const submit = (data) => {
    onSubmit?.(data);
    reset(defaultBillValues);
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'gpay':
        return <Wallet className="size-4 text-violet-500 animate-pulse" />;
      case 'cash':
        return <Banknote className="size-4 text-emerald-500 animate-bounce" />;
      case 'credit':
        return <CreditCard className="size-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {}
        <div className="lg:col-span-2 space-y-6">
          {}
          <Card className="shadow-sm border-border/85 bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <ShoppingBag className="size-5 text-primary" />
                Billing Items
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ type: 'InventoryProduct', item: '', name: '', quantity: 1, price: 0 })}
                className="gap-1.5 h-9"
              >
                <Plus className="size-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {fields.map((field, index) => {
                const currentType = watch(`items.${index}.type`) || 'InventoryProduct';
                const currentItem = watch(`items.${index}.item`);
                const selectedIp = currentType === 'InventoryProduct' ? inventoryProducts.find((p) => String(p._id) === currentItem) : null;
                const maxQty = selectedIp ? selectedIp.quantity : undefined;

                return (
                  <div key={field.id} className="space-y-4">
                    {index > 0 && <Separator className="my-2" />}
                    <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_2.5fr_1fr_1.2fr_auto] gap-3 items-start">
                      <FormField
                        control={control}
                        name={`items.${index}.type`}
                        render={({ field: typeField }) => (
                          <FormItem>
                            <FormLabel className="sm:hidden">Type</FormLabel>
                            <Select
                              onValueChange={(val) => handleTypeChange(index, val)}
                              value={typeField.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-background">
                                  <SelectValue placeholder="Select type" />
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
                        control={control}
                        name={`items.${index}.item`}
                        render={({ field: itemField }) => (
                          <FormItem>
                            <FormLabel className="sm:hidden">Item</FormLabel>
                            <Select
                              key={currentType === 'InventoryProduct' ? (inventoryProductSelect.hasItems ? 'loaded' : 'loading') : (serviceSelect.hasItems ? 'loaded' : 'loading')}
                              onValueChange={(val) => handleItemChange(index, val, currentType)}
                              value={itemField.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-background">
                                  <SelectValue
                                    placeholder={
                                      currentType === 'InventoryProduct'
                                        ? inventoryProductSelect.placeholder
                                        : serviceSelect.placeholder
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {currentType === 'InventoryProduct'
                                  ? inventoryProductSelect.items
                                  : serviceSelect.items}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`items.${index}.quantity`}
                        render={({ field: qtyField }) => (
                          <FormItem>
                            <FormLabel className="sm:hidden">Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={maxQty}
                                {...qtyField}
                                onChange={(e) => qtyField.onChange(Number(e.target.value))}
                                className="bg-background"
                              />
                            </FormControl>
                            {maxQty !== undefined && (
                              <div className="text-[10px] text-muted-foreground mt-1 font-medium bg-secondary/40 py-0.5 px-1.5 rounded w-max">
                                Stock: {maxQty}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name={`items.${index}.price`}
                        render={({ field: priceField }) => (
                          <FormItem>
                            <FormLabel className="sm:hidden">Price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  {...priceField}
                                  onChange={(e) => priceField.onChange(Number(e.target.value))}
                                  className="pl-6 bg-background"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {}
          <Card className="shadow-sm border-border/80 bg-card">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Wallet className="size-5 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <RadioGroup
                      value={field.value}
                      onValueChange={handlePaymentMethodChange}
                      className="grid grid-cols-3 gap-4"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <FormControl key={method.value}>
                          <Label
                            htmlFor={`payment-${method.value}`}
                            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent/50 hover:text-accent-foreground cursor-pointer transition-all duration-200 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                          >
                            <RadioGroupItem
                              id={`payment-${method.value}`}
                              value={method.value}
                              className="sr-only"
                            />
                            {getPaymentIcon(method.value)}
                            <span className="font-semibold text-sm">{method.label}</span>
                          </Label>
                        </FormControl>
                      ))}
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold">Payment Status</FormLabel>
                      <div className="text-xs text-muted-foreground">
                        Toggle between Paid and Unpaid status
                      </div>
                    </div>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${field.value === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {field.value}
                        </span>
                        <Switch
                          checked={field.value === 'paid'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'paid' : 'unpaid')}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {isCredit && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                  <FormField
                    control={control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-xs">Branch</FormLabel>
                        <Select
                          key={branchItems.hasItems ? 'loaded' : 'loading'}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue placeholder={branchItems.placeholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>{branchItems.items}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-xs">Department</FormLabel>
                        <Select
                          key={departmentItems.hasItems ? 'loaded' : 'loading'}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue placeholder={departmentItems.placeholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>{departmentItems.items}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          <Card className="shadow-md border-primary/20 bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 py-4">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-primary">
                <Receipt className="size-5" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                        <Percent className="size-3.5 text-muted-foreground" />
                        Discount Amount
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="pl-6 bg-background/50 focus:bg-background"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                        <Percent className="size-3.5 text-muted-foreground" />
                        Tax Amount
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="pl-6 bg-background/50 focus:bg-background"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm text-muted-foreground font-medium">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>- ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-sm text-amber-600 font-medium">
                    <span>Tax</span>
                    <span>+ ₹{tax.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold">Total Amount</span>
                  <span className="text-2xl font-extrabold text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-primary/[0.02] border-t border-primary/5 p-6">
              <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold tracking-wide shadow-sm hover:shadow transition-all duration-200">
                {loading 
                  ? (isEdit ? 'Updating Invoice...' : 'Creating Invoice...') 
                  : (isEdit ? 'Update Invoice' : 'Generate Invoice')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
}