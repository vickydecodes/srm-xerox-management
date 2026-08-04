import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';

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

export function BillForm({
  products = [],
  branches = [],
  departments = [],
  onSubmit,
  loading = false,
}) {
  const form = useForm({
    resolver: zodResolver(createBillSchema),
    defaultValues: defaultBillValues,
  });

  const { control, handleSubmit, watch, setValue, reset } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const productItems = useSelectItems(products, {
    emptyText: 'No products available',
    placeholder: 'Select product',
  });
  const branchItems = useSelectItems(branches, {
    emptyText: 'No branches available',
    placeholder: 'Select branch',
  });
  const departmentItems = useSelectItems(departments, {
    emptyText: 'No departments available',
    placeholder: 'Select department',
  });

  const items = watch('items');
  const discount = watch('discount') || 0;
  const tax = watch('tax') || 0;
  const paymentMethod = watch('paymentMethod');
  const isCredit = paymentMethod === 'credit';

  const subtotal = items.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.price) || 0),
    0
  );
  const total = Math.max(subtotal - discount + tax, 0);

  const handleProductChange = (index, productId) => {
    const product = products.find((p) => String(p._id) === productId);
    setValue(`items.${index}.item`, productId, { shouldValidate: true });
    setValue(`items.${index}.name`, product?.name || '', { shouldValidate: true });
    // ASSUMPTION: no `price` on product schema, so it's NOT auto-filled here.
  };

  const handlePaymentMethodChange = (value) => {
    setValue('paymentMethod', value, { shouldValidate: true });
    if (value !== 'credit') {
      // clear branch/department so a stale selection can't leak into a
      // non-credit bill, and so their validation errors clear too
      setValue('branch', '', { shouldValidate: true });
      setValue('department', '', { shouldValidate: true });
    }
  };

  const submit = (data) => {
    onSubmit?.(data);
    reset(defaultBillValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <RadioGroup
                    value={field.value}
                    onValueChange={handlePaymentMethodChange}
                    className="flex flex-wrap gap-4"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <FormControl key={method.value}>
                        <Label
                          htmlFor={`payment-${method.value}`}
                          className="flex items-center gap-2 rounded-md border px-4 py-2 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                        >
                          <RadioGroupItem
                            id={`payment-${method.value}`}
                            value={method.value}
                          />
                          {method.label}
                        </Label>
                      </FormControl>
                    ))}
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCredit && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
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
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ item: '', name: '', quantity: 1, price: 0 })}
            >
              <Plus className="size-4" />
              Add item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id}>
                {index > 0 && <Separator className="mb-3" />}
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-start">
                  <FormField
                    control={control}
                    name={`items.${index}.item`}
                    render={({ field: itemField }) => (
                      <FormItem>
                        <FormLabel className="sm:hidden">Product</FormLabel>
                        <Select
                          onValueChange={(val) => handleProductChange(index, val)}
                          value={itemField.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={productItems.placeholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>{productItems.items}</SelectContent>
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
                            min={0}
                            {...qtyField}
                            onChange={(e) => qtyField.onChange(Number(e.target.value))}
                          />
                        </FormControl>
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
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...priceField}
                            onChange={(e) => priceField.onChange(Number(e.target.value))}
                          />
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
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adjustments</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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
                  <FormLabel>Tax</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <Separator />
          <CardFooter className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Subtotal: {subtotal.toFixed(2)}</div>
              <div className="font-semibold text-foreground">Total: {total.toFixed(2)}</div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create bill'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}