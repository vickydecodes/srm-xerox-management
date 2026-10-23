import React, { useState, useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Printer,
  FileDown,
  RotateCcw,
  Receipt,
  Store,
  Layers,
  CheckCircle2,
  Clock,
  Coins,
} from "lucide-react";
import api, { downloadDocx, printPdf } from "@/core/api/api.service";
import { toast } from "sonner";

export const DepartmentReportModal = ({ department, departmentId, closeModal }) => {
  const deptId =
    departmentId ||
    (typeof department === "object" ? department?._id || department?.id : department);

  const [loading, setLoading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [report, setReport] = useState(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("ALL");

  const fetchReport = async () => {
    if (!deptId) return;
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (status && status !== "ALL") params.status = status;

      const res = await api.get(`/bills/department/${deptId}/report`, { params });
      setReport(res.data?.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load department report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [deptId]);

  const handleResetFilters = () => {
    setFrom("");
    setTo("");
    setStatus("ALL");
  };

  const handleDownloadDocx = async () => {
    if (!deptId) return;
    setDownloadingDocx(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (status && status !== "ALL") params.status = status;

      const deptCode = report?.department?.code || "report";
      await downloadDocx(
        `/bills/department/${deptId}/report/docx`,
        `department-report-${deptCode}.docx`,
        { params }
      );
      toast.success("Department report DOCX downloaded");
    } catch {
      toast.error("Failed to download report DOCX");
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handlePrint = async () => {
    if (!deptId) return;
    setPrinting(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (status && status !== "ALL") params.status = status;

      await printPdf(`/bills/department/${deptId}/report/pdf`, { params });
    } catch {
      toast.error("Failed to open report print preview");
    } finally {
      setPrinting(false);
    }
  };

  const deptData = report?.department || (typeof department === "object" ? department : {});
  const summary = report?.summary || {};
  const shopBreakdown = report?.shopBreakdown || [];
  const itemBreakdown = report?.itemBreakdown || [];
  const bills = report?.bills || [];

  const formatCurrency = (amt) =>
    `₹${Number(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
      <DialogHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              Department Billing & Item Report
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{deptData.name || "Department"}</span>
              {deptData.code && <span className="ml-1 text-primary">({deptData.code})</span>}
              {deptData.branch?.name && (
                <span className="ml-2 text-muted-foreground">· Branch: {deptData.branch.name}</span>
              )}
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={printing || loading}
              className="h-8 gap-1.5 text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
            >
              <Printer className="size-3.5" />
              {printing ? "Preparing..." : "Print Report"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDocx}
              disabled={downloadingDocx || loading}
              className="h-8 gap-1.5 text-xs text-blue-600 hover:text-blue-900 dark:text-blue-400"
            >
              <FileDown className="size-3.5" />
              {downloadingDocx ? "Exporting..." : "Download DOCX"}
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>From:</span>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-7 w-32 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>To:</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-7 w-32 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Status:</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-7 w-28 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Bills</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={fetchReport}
            disabled={loading}
            className="h-7 text-xs px-3"
          >
            Apply Filter
          </Button>
          {(from || to || status !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3" />
              Reset
            </Button>
          )}
        </div>
      </DialogHeader>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            Generating department report...
          </div>
        ) : (
          <>
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-muted/40 border border-border/60 rounded-lg">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-medium">TOTAL BILLS</span>
                  <Receipt className="size-3.5" />
                </div>
                <div className="text-xl font-bold text-foreground">{summary.totalBills || 0}</div>
                <div className="text-[10px] text-muted-foreground">All logged bills</div>
              </div>

              <div className="p-3 bg-muted/40 border border-border/60 rounded-lg">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-medium">TOTAL ITEMS</span>
                  <Layers className="size-3.5" />
                </div>
                <div className="text-xl font-bold text-foreground">{summary.totalItemsCount || 0}</div>
                <div className="text-[10px] text-muted-foreground">Total units billed</div>
              </div>

              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-lg">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                  <span className="text-[11px] font-medium">PAID BILLS</span>
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(summary.paidBillsTotal)}
                </div>
                <div className="text-[10px] text-emerald-600/80">
                  {summary.paidBillsCount || 0} bills settled
                </div>
              </div>

              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-lg">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                  <span className="text-[11px] font-medium">UNPAID DUES</span>
                  <Clock className="size-3.5" />
                </div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
                  {formatCurrency(summary.unpaidBillsTotal)}
                </div>
                <div className="text-[10px] text-amber-600/80">
                  {summary.unpaidBillsCount || 0} bills pending
                </div>
              </div>

              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-primary mb-1">
                  <span className="text-[11px] font-medium">TOTAL EXPENDITURE</span>
                  <Coins className="size-3.5" />
                </div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(summary.totalAmount)}
                </div>
                <div className="text-[10px] text-primary/70">Cumulative spend</div>
              </div>
            </div>

            {/* Tabs for Detailed Breakdowns */}
            <Tabs defaultValue="shops" className="w-full">
              <TabsList className="grid grid-cols-3 w-full sm:w-[460px] h-9">
                <TabsTrigger value="shops" className="text-xs">
                  <Store className="size-3.5 mr-1.5" />
                  Counters ({shopBreakdown.length})
                </TabsTrigger>
                <TabsTrigger value="items" className="text-xs">
                  <Layers className="size-3.5 mr-1.5" />
                  Item Counts ({itemBreakdown.length})
                </TabsTrigger>
                <TabsTrigger value="bills" className="text-xs">
                  <Receipt className="size-3.5 mr-1.5" />
                  Bills ({bills.length})
                </TabsTrigger>
              </TabsList>

              {/* Counter / Shop Breakdown */}
              <TabsContent value="shops" className="mt-3 border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="text-xs">
                      <TableHead>Service Counter / Shop</TableHead>
                      <TableHead className="text-right">Bills</TableHead>
                      <TableHead className="text-right">Items Qty</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Unpaid</TableHead>
                      <TableHead className="text-right font-semibold">Total Spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shopBreakdown.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                          No service counters found for this department.
                        </TableCell>
                      </TableRow>
                    ) : (
                      shopBreakdown.map((s) => (
                        <TableRow key={s.shopId} className="text-xs">
                          <TableCell className="font-semibold text-foreground flex items-center gap-2">
                            <Store className="size-3.5 text-muted-foreground" />
                            {s.shopName}
                          </TableCell>
                          <TableCell className="text-right font-medium">{s.billsCount}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{s.itemsCount}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-medium">
                            {formatCurrency(s.paidAmount)}
                          </TableCell>
                          <TableCell className="text-right text-amber-600 font-medium">
                            {formatCurrency(s.unpaidAmount)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatCurrency(s.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Item Breakdown */}
              <TabsContent value="items" className="mt-3 border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="text-xs">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Particulars / Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total Quantity</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                      <TableHead className="text-right font-semibold">Total Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemBreakdown.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                          No item records found in this range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      itemBreakdown.map((item, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {item.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{item.totalQuantity}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.billCount}</TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatCurrency(item.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Bill Register */}
              <TabsContent value="bills" className="mt-3 border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="text-xs">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Bill Code</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Counter</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right font-semibold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                          No bills match the selected criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bills.map((b, idx) => (
                        <TableRow key={b._id} className="text-xs">
                          <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-primary">{b.code}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(b.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{b.shopName}</TableCell>
                          <TableCell className="text-right">{b.itemsCount}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={b.status === "PAID" ? "default" : "outline"}
                              className={`text-[10px] font-medium ${
                                b.status === "PAID"
                                  ? "bg-emerald-600 text-white hover:bg-emerald-600"
                                  : "text-amber-600 border-amber-300"
                              }`}
                            >
                              {b.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatCurrency(b.total)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <DialogFooter className="pt-3 border-t border-border/60">
        <DialogClose asChild>
          <Button variant="outline" size="sm">
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

export default DepartmentReportModal;
