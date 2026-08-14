import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/core/contexts/api.context";
import { useAuth } from "@/core/contexts/auth.context";
import { createOrderSchema } from "@/modules/order/order.schema";

// Schema for Order creation/edit form in frontend
const defaultOrderValues = {
  department: "",
  branch: "",
  purpose: "",
  managementAmount: 0,
  sponsors: [],
  items: [],
  status: "draft",
};

export const View = ({ order }) => {
  if (!order) return null;

  const items = order.items || [];
  const sponsors = order.sponsors || [];
  const itemsTotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
    0
  );
  const sponsorsTotal = sponsors.reduce(
    (sum, sp) => sum + (sp.amount || 0),
    0
  );
  const totalFunding = (order.managementAmount || 0) + sponsorsTotal;

  return (
    <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
          Order: {order.code || "DRAFT REQUISITION"}
          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
            {order.status.toUpperCase().replace("_", " ")}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Requested by {order.createdBy?.name || "Department Admin"} on{" "}
          {new Date(order.createdAt).toLocaleDateString()}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 my-4">
        {/* Core Metadata */}
        <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg text-sm">
          <div>
            <span className="font-semibold text-muted-foreground block text-xs">BRANCH</span>
            <span>{order.branch?.name || "N/A"}</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground block text-xs">DEPARTMENT</span>
            <span>{order.department?.name || "N/A"}</span>
          </div>
          <div className="col-span-2">
            <span className="font-semibold text-muted-foreground block text-xs">PURPOSE</span>
            <span>{order.purpose || "No purpose provided."}</span>
          </div>
        </div>

        <Separator />

        {/* Requisition Items Table */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Requisition Items</h4>
          <Table className="border rounded-md">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs font-semibold uppercase">{item.type === "InventoryProduct" ? "Product" : "Service"}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.price} INR</TableCell>
                  <TableCell className="text-right font-medium">{(item.quantity * item.price).toLocaleString()} INR</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/20 font-semibold">
                <TableCell colSpan={4} className="text-right">Total Items Cost:</TableCell>
                <TableCell className="text-right text-primary">{itemsTotal.toLocaleString()} INR</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <Separator />

        {/* Funding details */}
        <div className="space-y-3 bg-indigo-50/50 dark:bg-indigo-950/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-950/30">
          <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-400">Funding Breakdown</h4>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span>Management Budget allocation:</span>
            <span className="text-right font-medium">{order.managementAmount || 0} INR</span>

            {sponsors.length > 0 && (
              <>
                <span className="col-span-2 font-medium mt-1 text-xs text-muted-foreground uppercase">Sponsorship details</span>
                {sponsors.map((sp, idx) => (
                  <React.Fragment key={idx}>
                    <span className="pl-2">• {sp.name}:</span>
                    <span className="text-right">{sp.amount} INR</span>
                  </React.Fragment>
                ))}
              </>
            )}

            <div className="col-span-2 border-t my-1" />
            <span className="font-bold text-indigo-900 dark:text-indigo-300">Total Available Funding:</span>
            <span className="text-right font-bold text-indigo-900 dark:text-indigo-300">{totalFunding.toLocaleString()} INR</span>
          </div>
        </div>

        {/* Approvals logs */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Approvals History</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Admin Approval */}
            <div className="border rounded-lg p-3 space-y-2 text-sm bg-card">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-muted-foreground">1. BRANCH ADMIN APPROVAL</span>
                <Badge className={
                  order.branchAdminApproval?.status === "approved"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : order.branchAdminApproval?.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }>
                  {order.branchAdminApproval?.status?.toUpperCase() || "PENDING"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remarks:</p>
                <p className="italic text-gray-700 dark:text-gray-300">"{order.branchAdminApproval?.remarks || "No remarks."}"</p>
              </div>
              {order.branchAdminApproval?.approver && (
                <div className="text-right text-xs text-muted-foreground">
                  By {order.branchAdminApproval.approver.name || "Branch Admin"} on {new Date(order.branchAdminApproval.date).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* VP Approval */}
            <div className="border rounded-lg p-3 space-y-2 text-sm bg-card">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs text-muted-foreground">2. VICE PRESIDENT / SUPER ADMIN</span>
                <Badge className={
                  order.vpApproval?.status === "approved"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : order.vpApproval?.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }>
                  {order.vpApproval?.status?.toUpperCase() || "PENDING"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remarks:</p>
                <p className="italic text-gray-700 dark:text-gray-300">"{order.vpApproval?.remarks || "No remarks."}"</p>
              </div>
              {order.vpApproval?.approver && (
                <div className="text-right text-xs text-muted-foreground">
                  By {order.vpApproval.approver.name || "Super Admin"} on {new Date(order.vpApproval.date).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {order.bill && (
          <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 p-4 rounded-lg flex items-center justify-between border border-emerald-200 dark:border-emerald-950/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5" />
              <div>
                <p className="font-semibold text-sm">Fulfillment Invoice Generated</p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-500/80">This requisition has been fully completed and billed.</p>
              </div>
            </div>
            {order.bill.code && <Badge className="bg-emerald-600 text-white font-mono">{order.bill.code}</Badge>}
          </div>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

export const CreateOrEdit = ({ order, submitFn, closeModal }) => {
  const { user } = useAuth();
  const { search, branches: branchModule, departments: departmentModule } = useApi();
  const { BillingItemSearchCombobox } = search;

  const isEdit = !!order;

  const form = useForm({
    resolver: zodResolver(createOrderSchema),
    defaultValues: order
      ? {
          department: order.department?._id || order.department || "",
          branch: order.branch?._id || order.branch || "",
          purpose: order.purpose || "",
          managementAmount: order.managementAmount || 0,
          sponsors: order.sponsors || [],
          items: order.items || [],
          status: order.status || "draft",
        }
      : {
          ...defaultOrderValues,
          branch: user?.branch?._id || user?.branch || "",
          department: user?.department?._id || user?.department || "",
        },
  });

  const { control, handleSubmit, watch, setValue } = form;

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: "items",
  });

  const { fields: sponsorFields, append: appendSponsor, remove: removeSponsor } = useFieldArray({
    control,
    name: "sponsors",
  });

  const watchItems = watch("items") || [];
  const watchSponsors = watch("sponsors") || [];
  const watchManagement = parseFloat(watch("managementAmount") || 0);

  const itemsTotal = watchItems.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
    0
  );
  const sponsorsTotal = watchSponsors.reduce(
    (sum, sp) => sum + (parseFloat(sp.amount) || 0),
    0
  );
  const totalFunding = watchManagement + sponsorsTotal;
  const fundingMismatch = itemsTotal > totalFunding;

  const onFormSubmit = async (data) => {
    try {
      await submitFn(data);
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">
          {isEdit ? `Edit Order Requisition ${order.code || ""}` : "Create Requisition Order"}
        </DialogTitle>
        <DialogDescription>
          Request products or services for your department. The requisition budget must cover the item totals.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 py-2">
          {/* Branch & Department selectors */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={user?.role === "department_admin"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branchModule.state.map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={user?.role === "department_admin"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departmentModule.state
                        .filter((d) => !watch("branch") || d.branch?._id === watch("branch") || d.branch === watch("branch"))
                        .map((d) => (
                          <SelectItem key={d._id} value={d._id}>
                            {d.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Purpose */}
          <FormField
            control={control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide details about the requisition purpose..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          {/* Item Search & Add */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Requisition Items</Label>
              <span className="text-xs text-muted-foreground font-mono">
                Items Total: {itemsTotal.toLocaleString()} INR
              </span>
            </div>
            <BillingItemSearchCombobox
              value=""
              currentItemName=""
              onSelect={(selectedItem) => {
                const existingIndex = watchItems.findIndex(
                  (f) => String(f.item) === String(selectedItem._id)
                );
                if (existingIndex > -1) {
                  const currentQty = parseFloat(watchItems[existingIndex].quantity) || 1;
                  setValue(`items.${existingIndex}.quantity`, currentQty + 1);
                } else {
                  appendItem({
                    type: selectedItem.type,
                    item: selectedItem._id,
                    name: selectedItem.name,
                    quantity: 1,
                    price: selectedItem.price,
                  });
                }
              }}
              placeholder="Search by product or service name..."
            />

            {itemFields.length > 0 ? (
              <Table className="border rounded-md">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-20 text-center">Qty</TableHead>
                    <TableHead className="w-28 text-right">Price</TableHead>
                    <TableHead className="w-28 text-right">Subtotal</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemFields.map((field, idx) => (
                    <TableRow key={field.id}>
                      <TableCell className="text-xs font-semibold uppercase">
                        {watchItems[idx]?.type === "InventoryProduct" ? "Product" : "Service"}
                      </TableCell>
                      <TableCell>{watchItems[idx]?.name}</TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          min="1"
                          className="h-8 text-center px-1"
                          {...form.register(`items.${idx}.quantity`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-right"
                          {...form.register(`items.${idx}.price`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {((watchItems[idx]?.quantity || 0) * (watchItems[idx]?.price || 0)).toLocaleString()} INR
                      </TableCell>
                      <TableCell className="p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
                No items added. Search and add products/services above.
              </div>
            )}
          </div>

          <Separator />

          {/* Funding Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Funding Allocation</Label>
              <div className="text-xs font-mono text-muted-foreground space-x-2">
                <span>Allocated: {totalFunding.toLocaleString()} INR</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField
                control={control}
                name="managementAmount"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Management Amount (INR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2 text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 ml-auto"
                  onClick={() => appendSponsor({ name: "", amount: 0 })}
                >
                  <Plus className="size-4" /> Add Sponsor
                </Button>
              </div>
            </div>

            {sponsorFields.length > 0 && (
              <div className="space-y-3 bg-muted/20 p-3 rounded-lg border">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Sponsorship Funding</Label>
                {sponsorFields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-[3fr_2fr_auto] gap-2 items-center">
                    <Input
                      placeholder="Sponsor Name"
                      className="h-8"
                      required
                      {...form.register(`sponsors.${idx}.name`)}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      min="0"
                      className="h-8"
                      required
                      {...form.register(`sponsors.${idx}.amount`, { valueAsNumber: true })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => removeSponsor(idx)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Mismatch Alert Warning */}
            {fundingMismatch && (
              <div className="bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 p-3 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-950/30 text-xs">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Budget Warning</p>
                  <p>Requisition cost ({itemsTotal.toLocaleString()} INR) exceeds current funding allocation ({totalFunding.toLocaleString()} INR) by {(itemsTotal - totalFunding).toLocaleString()} INR. Please increase the funding allocation or remove items before submitting.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={fundingMismatch || itemFields.length === 0}>
              {isEdit ? "Save Changes" : "Create Requisition"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const ApprovalDialog = ({ order, roleType, actionType, onConfirm, closeModal }) => {
  const [remarks, setRemarks] = React.useState("");

  const handleAction = async () => {
    try {
      await onConfirm(actionType, remarks);
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const isApprove = actionType === "approved";
  const items = order?.items || [];
  const itemsTotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.price || 0), 0);

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isApprove ? (
            <CheckCircle className="size-5 text-emerald-500" />
          ) : (
            <XCircle className="size-5 text-red-500" />
          )}
          {isApprove ? "Approve" : "Reject"} Requisition Order
        </DialogTitle>
        <DialogDescription>
          Perform {roleType === "branch" ? "Branch Admin" : "Vice President"} review action for requisition code{" "}
          <span className="font-mono font-bold text-foreground">{order?.code}</span>.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2 text-sm">
        <div className="flex justify-between bg-muted/40 p-3 rounded-lg text-xs font-mono">
          <span>Total Cost: {itemsTotal.toLocaleString()} INR</span>
          <span>Status: {order?.status}</span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="remarks" className="font-medium text-xs">
            Review Remarks ({isApprove ? "Optional" : "Required"})
          </Label>
          <Textarea
            id="remarks"
            placeholder={isApprove ? "Enter approval comments (e.g. Approved, budget fits)" : "Provide reasons for rejection..."}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          variant={isApprove ? "default" : "destructive"}
          onClick={handleAction}
          disabled={!isApprove && !remarks.trim()}
        >
          Confirm {isApprove ? "Approval" : "Rejection"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
