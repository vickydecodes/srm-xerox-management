import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { departmentCreateSchema, departmentEditSchema } from "./department.schema";
import DepartmentForm from "./department.form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLoader } from "@/core/hooks/useLoader";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/core/api/api.request";
import { apiurls } from "@/core/api/api.urls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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


export const Create = ({ submitFn = () => { }, closeModal = () => { }, data, exported } = {}) => {
  const { createPreset } = useLoader();


  const form = useForm({
    resolver: zodResolver(data ? departmentEditSchema : departmentCreateSchema),
    defaultValues: data ? {
      code: data.code,
      name: data.name,
      branch: typeof data.branch === 'object' ? data.branch?._id : data.branch,
    } : {
      code: '',
      name: '',
      branch: '',
    },
  });

  const modal = createPreset(exported.branches)

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: closeModal,
  });

  useEffect(() => {
    modal();
  }, [])

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle>{data ? "Edit Department" : "Create Department"}</DialogTitle>
        <DialogDescription>Enter details of Department</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(onSubmit)}>
          <DepartmentForm form={form} isEdit={data} branches={exported.branches.state} />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" loading={loading} loadingText="Saving the department..">
              Save
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};


export const Delete = ({ id, name, submitFn = () => { }, closeModal = () => { } }) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const handleDelete = async () => {
    await run(id);
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Are you sure? {id} {name}</DialogTitle>
        <DialogDescription>
          This will be stored as deleted, this department record can be retrieved by Admin.
        </DialogDescription>
      </DialogHeader>

      {ErrorAlert}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button variant="destructive" loading={loading} onClick={handleDelete}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};



export const Erase = ({ id, submitFn, closeModal }) => (
  <DialogContent className="sm:max-w-[425px] pe-10">
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        <strong>Note:</strong> This operation is Permenent Delete. All the data related to this department
        will be lost.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button
        onClick={() => {
          submitFn(id);
          closeModal();
        }}
        variant="success"
      >
        Delete Permanently
      </Button>
    </DialogFooter>
  </DialogContent>
);
export const Retrieve = ({ id, submitFn, closeModal }) => (
  <DialogContent className="sm:max-w-[425px] pe-10">
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        <strong>Note:</strong> this operation is retrieve All the data related to this department will be
        back.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button
        onClick={() => {
          submitFn(id);
          closeModal();
        }}
        variant="destructive"
      >
        Retrieve
      </Button>
    </DialogFooter>
  </DialogContent>
);
export const ActiveStatus = ({
  id,
  status,
  submitFn,
  closeModal,
  exported,
}) => {
  const actionLabel = status ? 'Deactivate' : 'Activate';

  const onConfirm = async () => {
    await submitFn(id, {
      active: !status,
    });
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px] pe-10">
      <DialogHeader>
        <DialogTitle>{actionLabel} Branch</DialogTitle>

        <DialogDescription>
          {status ? (
            <>
              This will <strong>deactivate</strong> the Branch.
              <br />
              Students will no longer be able to Join this Branch.
            </>
          ) : (
            <>
              This will <strong>activate</strong> the Branch.
              <br />
              The Branch will become available again.
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={exported?.loading?.edit}>
            Cancel
          </Button>
        </DialogClose>

        <Button
          variant={status ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={exported?.loading?.edit}
        >
          {exported?.loading?.edit ? 'Updating...' : actionLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const View = ({ department } = {}) => {
  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {department?.name || "Department"}
          {department?.active !== undefined && (
            <Badge variant={department.active ? "default" : "secondary"}>
              {department.active ? "Active" : "Inactive"}
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          Created on{" "}
          {department?.createdAt
            ? new Date(department.createdAt).toLocaleDateString()
            : "—"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        {/* ID */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">ID</p>
          <p className="text-sm font-mono">{department?.id || "—"}</p>
        </div>

        <Separator />

        {/* Name */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Name</p>
          <p className="text-sm">{department?.name || "—"}</p>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

export const ManageCredit = ({ department, exported, closeModal }) => {
  const [amount, setAmount] = React.useState(department?.outstandingCredit || 0);
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");
  const [remarks, setRemarks] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (department) {
      setAmount(department.outstandingCredit || 0);
    }
  }, [department]);

  const handleClearCredit = async (e) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Clear amount must be greater than 0");
      return;
    }
    setLoading(true);
    try {
      const config = apiurls.departments.clearCredit;
      const updatedDept = await apiRequest({
        ...config,
        url: config.url(department._id),
        data: {
          amount,
          paymentMethod,
          remarks,
        },
      });

      // Update the department in list
      if (exported && exported.departments) {
        exported.departments.update(department._id, updatedDept);
      }
      toast.success(`${amount} INR credit cleared successfully`);
      closeModal();
    } catch (err) {
      toast.error(err.message || "Failed to clear credit");
    } finally {
      setLoading(false);
    }
  };

  const payments = department?.creditPayments || [];
  const remainingCredit = (department?.creditLimit || 0) - (department?.outstandingCredit || 0);

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex justify-between items-center pr-6">
          <span>Manage Credit: {department?.name}</span>
          <span className="font-mono text-xs text-muted-foreground">{department?.code}</span>
        </DialogTitle>
        <DialogDescription>
          View department credit balance, history, and clear outstanding amounts.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 my-2">
        {/* Credit Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-3 text-center bg-muted/20">
            <span className="text-xs text-muted-foreground block uppercase font-semibold">Credit Limit</span>
            <span className="text-lg font-bold">{(department?.creditLimit || 0).toLocaleString()} INR</span>
          </div>
          <div className="border rounded-lg p-3 text-center bg-amber-50/55 dark:bg-amber-950/10 border-amber-100">
            <span className="text-xs text-amber-700 dark:text-amber-400 block uppercase font-semibold">Outstanding</span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {(department?.outstandingCredit || 0).toLocaleString()} INR
            </span>
          </div>
          <div className="border rounded-lg p-3 text-center bg-emerald-50/55 dark:bg-emerald-950/10 border-emerald-100">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 block uppercase font-semibold">Remaining</span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {remainingCredit.toLocaleString()} INR
            </span>
          </div>
        </div>

        <Separator />

        {/* Clear Credit Form */}
        {department?.outstandingCredit > 0 ? (
          <form onSubmit={handleClearCredit} className="space-y-4 bg-muted/40 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm">Clear Outstanding Credit</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="clear-amount" className="text-xs">Amount to Clear (INR)</Label>
                <Input
                  id="clear-amount"
                  type="number"
                  min="1"
                  max={department.outstandingCredit}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment-method" className="text-xs">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">CASH</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                Clear Credit
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clear-remarks" className="text-xs">Payment Remarks (Optional)</Label>
              <Input
                id="clear-remarks"
                placeholder="E.g., Monthly bulk clearing by dept head"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </form>
        ) : (
          <div className="text-center py-4 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg border border-emerald-100">
            This department currently has no outstanding credit balance!
          </div>
        )}

        <Separator />

        {/* Payments History */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Credit Payments History</h4>
          {payments.length > 0 ? (
            <Table className="border rounded-md">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Cleared By</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...payments].reverse().map((pay, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs">
                      {new Date(pay.date).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-700 dark:text-emerald-400">
                      -{pay.amount.toLocaleString()} INR
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{pay.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{pay.paidBy?.name || "System"}</TableCell>
                    <TableCell className="text-xs italic text-muted-foreground">{pay.remarks || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
              No payments logged yet.
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};