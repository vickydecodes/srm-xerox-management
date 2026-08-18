import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { apiRequest } from "@/core/api/api.request";
import { apiurls } from "@/core/api/api.urls";
import { toast } from "sonner";
import { IconCreditCard, IconBuildingCommunity } from "@tabler/icons-react";

export const Create = ({ closeModal, exported }) => {
  const { user } = exported || {};
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState("");

  const [unpaidBills, setUnpaidBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isDeptAdmin = user?.role === "department_admin";
  const userDeptId = user?.department?._id || user?.department;

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepts(true);
        const res = await apiRequest("get", apiurls.departments.getAll.url(), { params: { full: true } });
        if (res.success) {
          const allDepts = res.data || [];
          // Filter departments depending on role
          const filtered = allDepts.filter((d) => {
            if (user?.role === "super_admin") return true;
            if (user?.role === "branch_admin") {
              const uBranch = user.branch?._id || user.branch;
              const dBranch = d.branch?._id || d.branch;
              return String(uBranch) === String(dBranch);
            }
            if (isDeptAdmin) {
              return String(d._id) === String(userDeptId);
            }
            return false;
          });
          setDepartments(filtered);
          if (isDeptAdmin && filtered.length > 0) {
            setSelectedDeptId(String(filtered[0]._id));
          }
        }
      } catch (err) {
        console.error("Error loading departments in modal:", err);
      } finally {
        setLoadingDepts(false);
      }
    };
    loadDepartments();
  }, [user, isDeptAdmin, userDeptId]);

  // Load unpaid bills when department changes
  useEffect(() => {
    if (!selectedDeptId) {
      setUnpaidBills([]);
      setSelectedBillIds([]);
      setAmount(0);
      return;
    }
    const loadUnpaidBills = async () => {
      try {
        setLoadingBills(true);
        const res = await apiRequest("get", apiurls.bills.getAll.url(), {
          params: {
            department: selectedDeptId,
            paymentMethod: "CREDIT",
            status: "UNPAID",
            full: true,
          },
        });
        if (res.success) {
          setUnpaidBills(res.data || []);
          setSelectedBillIds([]);
          setAmount(0);
        }
      } catch (err) {
        console.error("Error loading bills in modal:", err);
      } finally {
        setLoadingBills(false);
      }
    };
    loadUnpaidBills();
  }, [selectedDeptId]);

  const handleToggleBill = (billId) => {
    setSelectedBillIds((prev) => {
      let next;
      if (prev.includes(billId)) {
        next = prev.filter((id) => id !== billId);
      } else {
        next = [...prev, billId];
      }
      const sum = unpaidBills
        .filter((b) => next.includes(b._id))
        .reduce((s, b) => s + (b.total || 0), 0);
      setAmount(sum);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedBillIds.length === unpaidBills.length) {
      setSelectedBillIds([]);
      setAmount(0);
    } else {
      const allIds = unpaidBills.map((b) => b._id);
      setSelectedBillIds(allIds);
      const sum = unpaidBills.reduce((s, b) => s + (b.total || 0), 0);
      setAmount(sum);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeptId) {
      toast.error("Please select a department");
      return;
    }
    if (selectedBillIds.length === 0) {
      toast.error("Please select at least one bill to clear");
      return;
    }

    const billsTotal = unpaidBills
      .filter((b) => selectedBillIds.includes(b._id))
      .reduce((sum, b) => sum + (b.total || 0), 0);

    if (amount < billsTotal) {
      toast.error(`Amount must be at least ${billsTotal.toLocaleString()} INR`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiRequest("post", apiurls.departments.clearCredit.url(selectedDeptId), {
        data: {
          billIds: selectedBillIds,
          amount,
          paymentMethod,
          remarks,
        },
      });
      if (res.success) {
        toast.success("Payment recorded successfully!");
        closeModal();
        if (exported?.fetch) {
          exported.fetch();
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to settle credit");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDeptDetails = useMemo(() => {
    return departments.find((d) => String(d._id) === String(selectedDeptId));
  }, [departments, selectedDeptId]);

  const selectedBillsSum = useMemo(() => {
    return unpaidBills
      .filter((b) => selectedBillIds.includes(b._id))
      .reduce((s, b) => s + (b.total || 0), 0);
  }, [unpaidBills, selectedBillIds]);

  const excess = Math.max(0, amount - selectedBillsSum);

  const formatCurrency = (amt) => `${(amt || 0).toLocaleString()} INR`;
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
          <IconCreditCard className="w-6 h-6 text-primary" />
          Create New Credit Payment
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Clear outstanding bills for a department. Excess payments increase the credit balance.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="my-4 space-y-4">
        {/* Department Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Department
          </label>
          {loadingDepts ? (
            <div className="h-10 flex items-center px-3 border rounded-md text-xs animate-pulse text-muted-foreground">
              Loading departments...
            </div>
          ) : !isDeptAdmin ? (
            <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select department..." />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.name} ({d.code}) — Balance: {formatCurrency(d.outstandingCredit)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-10 flex items-center px-3 bg-muted/40 border rounded-md text-sm font-semibold">
              {selectedDeptDetails?.name} (Code: {selectedDeptDetails?.code})
            </div>
          )}
        </div>

        {/* Selected Department Overview */}
        {selectedDeptDetails && (
          <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">Outstanding Balance:</span>
              <span className="font-extrabold text-amber-700 dark:text-amber-400 text-sm">
                {formatCurrency(selectedDeptDetails.outstandingCredit)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Credit Balance:</span>
              <span className="font-bold text-foreground text-sm">
                {formatCurrency(selectedDeptDetails.creditBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Unpaid Bills List */}
        {selectedDeptId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Select Bills to Settle
              </label>
              {unpaidBills.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleAll}
                  className="h-6 text-2xs cursor-pointer font-bold text-primary hover:bg-primary/5"
                >
                  {selectedBillIds.length === unpaidBills.length ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>

            {loadingBills ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground font-semibold animate-pulse">
                Loading unpaid credit invoices...
              </div>
            ) : unpaidBills.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg text-xs text-muted-foreground">
                No unpaid credit bills found for this department.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent h-8">
                      <TableHead className="w-12 text-center h-8"></TableHead>
                      <TableHead className="font-bold h-8 text-xs py-1">Code</TableHead>
                      <TableHead className="font-bold h-8 text-xs py-1">Date</TableHead>
                      <TableHead className="font-bold text-right h-8 text-xs py-1">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidBills.map((bill) => (
                      <TableRow
                        key={bill._id}
                        className="hover:bg-muted/10 h-9 cursor-pointer"
                        onClick={() => handleToggleBill(bill._id)}
                      >
                        <TableCell
                          className="text-center py-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedBillIds.includes(bill._id)}
                            onCheckedChange={() => handleToggleBill(bill._id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs py-1.5">{bill.code}</TableCell>
                        <TableCell className="text-2xs text-muted-foreground py-1.5">
                          {formatDate(bill.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-semibold py-1.5">
                          {formatCurrency(bill.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Payment Fields */}
        {selectedBillIds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Payment Amount Given
              </label>
              <Input
                type="number"
                min={selectedBillsSum}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="h-10 font-bold"
              />
              <div className="text-2xs text-muted-foreground font-semibold flex flex-col gap-0.5">
                <span>Sum of selected bills: {formatCurrency(selectedBillsSum)}</span>
                {excess > 0 && (
                  <span className="text-amber-600 font-extrabold">
                    + Excess payment: {formatCurrency(excess)} will increase the credit balance.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Payment Method
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">CASH</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Remarks */}
        {selectedBillIds.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Remarks
            </label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Payment confirmation details (optional)"
              rows={2}
              className="resize-none text-sm p-3"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 border-t pt-4 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={closeModal}
            className="cursor-pointer h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || selectedBillIds.length === 0}
            className="cursor-pointer font-bold h-10 px-6"
          >
            {submitting ? "Processing..." : "Record Clearance"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export const ViewBills = ({ closeModal, payment }) => {
  const formatCurrency = (amt) => `${(amt || 0).toLocaleString()} INR`;
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const billsTotal = payment?.bills?.reduce((s, b) => s + (b.total || 0), 0) || 0;
  const excess = Math.max(0, (payment?.amount || 0) - billsTotal);

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
          <IconBuildingCommunity className="w-6 h-6 text-primary" />
          Settlement Details: {payment?.department?.name}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Cleared on {formatDate(payment?.date || payment?.createdAt)} by{" "}
          <span className="font-semibold text-foreground">{payment?.paidBy?.name}</span>.
        </DialogDescription>
      </DialogHeader>

      <div className="my-4 space-y-4">
        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-4 bg-muted/40 p-4 rounded-lg border text-sm">
          <div>
            <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider mb-0.5">
              Amount Paid (Gave)
            </span>
            <span className="text-lg font-black text-emerald-600">
              {formatCurrency(payment?.amount)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider mb-0.5">
              Bills Cleared (Received)
            </span>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(billsTotal)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider mb-0.5">
              Credit Balance Addition (Excess)
            </span>
            <span className="text-lg font-bold text-amber-600">
              {formatCurrency(excess)}
            </span>
          </div>
        </div>

        {/* Bills list */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="hover:bg-transparent h-9">
                <TableHead className="font-bold h-9 py-1 text-xs">Bill Code</TableHead>
                <TableHead className="font-bold h-9 py-1 text-xs">Created Date</TableHead>
                <TableHead className="font-bold h-9 py-1 text-xs">Created By</TableHead>
                <TableHead className="font-bold h-9 py-1 text-xs">Payment Status</TableHead>
                <TableHead className="font-bold text-right h-9 py-1 text-xs">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payment?.bills && payment.bills.length > 0 ? (
                payment.bills.map((bill) => (
                  <TableRow key={bill._id} className="h-9">
                    <TableCell className="font-mono font-bold text-xs py-1.5">{bill.code}</TableCell>
                    <TableCell className="text-2xs text-muted-foreground py-1.5">
                      {formatDate(bill.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-1.5">
                      {bill.createdBy?.name || "Staff"}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-3xs font-extrabold uppercase border border-emerald-25">
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground py-1.5">
                      {formatCurrency(bill.total)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs">
                    No bills linked to this transaction.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Remarks */}
        {payment?.remarks && (
          <div className="text-sm bg-muted/10 p-3 rounded-lg border">
            <span className="font-bold block text-xs text-muted-foreground mb-1">Remarks</span>
            <p className="text-foreground text-xs">{payment.remarks}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={closeModal} variant="secondary" className="cursor-pointer">
          Close
        </Button>
      </div>
    </DialogContent>
  );
};
