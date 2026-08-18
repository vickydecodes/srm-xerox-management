import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useAsync } from "@/core/hooks/useAsync";
import { useClearError } from "@/core/hooks/useClearError";
import { useSubmit } from "@/core/hooks/useSubmit";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  departmentCreateSchema,
  departmentEditSchema,
} from "./department.schema";
import DepartmentForm from "./department.form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

export const Create = ({
  submitFn = () => {},
  closeModal = () => {},
  data,
  exported,
} = {}) => {
  const { createPreset } = useLoader();

  const form = useForm({
    resolver: zodResolver(data ? departmentEditSchema : departmentCreateSchema),
    defaultValues: data
      ? {
          code: data.code,
          name: data.name,
          branch:
            typeof data.branch === "object" ? data.branch?._id : data.branch,
        }
      : {
          code: "",
          name: "",
          branch: "",
        },
  });

  const modal = createPreset(exported.branches);

  const { run, loading, ErrorAlert, clearError } = useAsync(submitFn);

  useClearError(form, clearError);

  const onSubmit = useSubmit({
    run,
    form,
    onSuccess: closeModal,
  });

  useEffect(() => {
    modal();
  }, []);

  return (
    <DialogContent className="w-xl">
      <DialogHeader>
        <DialogTitle>
          {data ? "Edit Department" : "Create Department"}
        </DialogTitle>
        <DialogDescription>Enter details of Department</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          className="grid gap-4 py-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <DepartmentForm
            form={form}
            isEdit={data}
            branches={exported.branches.state}
          />
          {ErrorAlert}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              loading={loading}
              loadingText="Saving the department.."
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export const ClearCreditByBill = ({ department, exported, closeModal }) => {
  const [bills, setBills] = React.useState([]);
  const [selectedBillIds, setSelectedBillIds] = React.useState([]);
  const [fetching, setFetching] = React.useState(true);
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");
  const [otherPaymentMethod, setOtherPaymentMethod] = React.useState("");
  const [remarks, setRemarks] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    const fetchBills = async () => {
      setFetching(true);
      try {
        const config = apiurls.bills.getByDepartment;
        const res = await apiRequest({
          ...config,
          url: config.url(department._id),
        });
        setBills(res?.data || []);
      } catch (err) {
        toast.error(err.message || "Failed to load department bills");
      } finally {
        setFetching(false);
      }
    };

    if (department?._id) fetchBills();
  }, [department]);

  const toggleBill = (billId) => {
    setSelectedBillIds((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId],
    );
  };

  const selectedBills = bills.filter((b) => selectedBillIds.includes(b._id));
  const totalAmount = selectedBills.reduce(
    (sum, b) => sum + Number(b.total || 0),
    0,
  );

  const handleClearCredit = async (e) => {
    e.preventDefault();
    if (selectedBillIds.length === 0) {
      toast.error("Please select at least one bill");
      return;
    }

    if (paymentMethod === "OTHER" && !otherPaymentMethod.trim()) {
      toast.error("Please specify the other payment method");
      return;
    }

    setLoading(true);
    try {
      const config = apiurls.departments.clearCredit;
      const updatedDept = await apiRequest({
        ...config,
        url: config.url(department._id),
        data: {
          billIds: selectedBillIds,
          amount: totalAmount,
          paymentMethod,
          otherPaymentMethod: paymentMethod === "OTHER" ? otherPaymentMethod.trim() : undefined,
          remarks,
        },
      });

      if (exported && exported.departments) {
        exported.departments.update(department._id, updatedDept);
      }
      toast.success(`Credit cleared for ${selectedBillIds.length} bill(s)`);
      closeModal();
    } catch (err) {
      toast.error(err.message || "Failed to clear credit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Clear Credit: {department?.name}</DialogTitle>
        <DialogDescription>
          Select one or more bills raised by this department and clear their
          outstanding credit.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleClearCredit} className="space-y-4 my-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Select Bills</Label>

          {fetching ? (
            <p className="text-sm text-muted-foreground">Loading bills...</p>
          ) : bills.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No bills found for this department.
            </p>
          ) : (
            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
              {bills.map((bill) => (
                <label
                  key={bill._id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedBillIds.includes(bill._id)}
                      onCheckedChange={() => toggleBill(bill._id)}
                    />
                    <span className="font-mono">{bill.code}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {bill.status}
                    </Badge>
                  </div>
                  <span className="font-medium">
                    {Number(bill.total || 0).toLocaleString()} INR
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {selectedBillIds.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/30 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bills Selected</span>
              <span className="font-semibold">{selectedBillIds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-semibold">
                {totalAmount.toLocaleString()} INR
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="clear-payment-method" className="text-xs">
            Payment Method
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger id="clear-payment-method">
              <SelectValue placeholder="Select Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">CASH</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="OTHER">OTHER</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod === "OTHER" && (
          <div className="space-y-1.5">
            <Label htmlFor="clear-other-payment-method" className="text-xs">
              Specify Other Payment Method
            </Label>
            <Input
              id="clear-other-payment-method"
              placeholder="e.g. Cheque, Card"
              value={otherPaymentMethod}
              onChange={(e) => setOtherPaymentMethod(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="clear-remarks" className="text-xs">
            Remarks (Optional)
          </Label>
          <Input
            id="clear-remarks"
            placeholder="E.g., Bulk clearing for March bills"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={loading || selectedBillIds.length === 0}
          >
            {loading
              ? "Clearing..."
              : `Clear Credit (${selectedBillIds.length})`}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export const Delete = ({
  id,
  name,
  submitFn = () => {},
  closeModal = () => {},
}) => {
  const { run, loading, ErrorAlert } = useAsync(submitFn);

  const handleDelete = async () => {
    await run(id);
    closeModal();
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          Are you sure? {id} {name}
        </DialogTitle>
        <DialogDescription>
          This will be stored as deleted, this department record can be
          retrieved by Admin.
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
        <strong>Note:</strong> This operation is Permenent Delete. All the data
        related to this department will be lost.
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
        <strong>Note:</strong> this operation is retrieve All the data related
        to this department will be back.
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
  const actionLabel = status ? "Deactivate" : "Activate";

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
          variant={status ? "destructive" : "default"}
          onClick={onConfirm}
          disabled={exported?.loading?.edit}
        >
          {exported?.loading?.edit ? "Updating..." : actionLabel}
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
  const [amount, setAmount] = React.useState(
    department?.outstandingCredit || 0,
  );
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");
  const [otherPaymentMethod, setOtherPaymentMethod] = React.useState("");
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

    if (paymentMethod === "OTHER" && !otherPaymentMethod.trim()) {
      toast.error("Please specify the other payment method");
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
          otherPaymentMethod: paymentMethod === "OTHER" ? otherPaymentMethod.trim() : undefined,
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
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex justify-between items-center pr-6">
          <span>Manage Credit: {department?.name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {department?.code}
          </span>
        </DialogTitle>
        <DialogDescription>
          View department credit balance, history, and clear outstanding
          amounts.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 my-2">
        {/* Credit Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-3 text-center bg-emerald-50/55 dark:bg-emerald-950/10 border-emerald-100">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 block uppercase font-semibold">
              Credit Balance
            </span>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {(department?.creditBalance || 0).toLocaleString()} INR
            </span>
          </div>
          <div className="border rounded-lg p-3 text-center bg-amber-50/55 dark:bg-amber-950/10 border-amber-100">
            <span className="text-xs text-amber-700 dark:text-amber-400 block uppercase font-semibold">
              Outstanding Credit
            </span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {(department?.outstandingCredit || 0).toLocaleString()} INR
            </span>
          </div>
        </div>

        <Separator />

        {/* Clear Credit Form */}
        <form
          onSubmit={handleClearCredit}
          className="space-y-4 bg-muted/40 p-4 rounded-lg border"
        >
          <h4 className="font-semibold text-sm">Settle Credit / Make Advance Payment</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="clear-amount" className="text-xs">
                Amount (INR)
              </Label>
              <Input
                id="clear-amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment-method" className="text-xs">
                  Payment Method
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">CASH</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                Clear Credit
              </Button>
            </div>

            {paymentMethod === "OTHER" && (
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="clear-other-payment-method" className="text-xs">
                  Specify Other Payment Method
                </Label>
                <Input
                  id="clear-other-payment-method"
                  placeholder="e.g. Cheque, Card"
                  value={otherPaymentMethod}
                  onChange={(e) => setOtherPaymentMethod(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="clear-remarks" className="text-xs">
                Payment Remarks (Optional)
              </Label>
              <Input
                id="clear-remarks"
                placeholder="E.g., Monthly bulk clearing by dept head"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </form>

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
                      <Badge variant="outline">
                        {pay.paymentMethod === "OTHER" && pay.otherPaymentMethod
                          ? pay.otherPaymentMethod.toUpperCase()
                          : pay.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {pay.paidBy?.name || "System"}
                    </TableCell>
                    <TableCell className="text-xs italic text-muted-foreground">
                      {pay.remarks || "-"}
                    </TableCell>
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
