import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hint } from "@/core/utils/tooltip.util";
import formatDate from "@/core/utils/formatdate.util";
import { IconEye } from "@tabler/icons-react";

export const useCreditColumns = (credits) => {
  return [
    {
      accessorKey: "date",
      header: () => Hint("Date", "Transaction date"),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatDate(row.original.date || row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "department",
      header: () => Hint("Department", "Department name & code"),
      cell: ({ row }) => {
        const dept = row.original.department;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {dept?.name || "Unknown Department"}
            </span>
            <span className="text-2xs text-muted-foreground font-mono">
              {dept?.code}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => Hint("Amount Paid", "Total amount paid (given)"),
      cell: ({ row }) => (
        <span className="font-black text-emerald-600">
          {(row.original.amount || 0).toLocaleString()} INR
        </span>
      ),
    },
    {
      id: "billsTotal",
      header: () => Hint("Bills Value", "Total amount of cleared bills (received)"),
      cell: ({ row }) => {
        const bills = row.original.bills || [];
        const total = bills.reduce((sum, b) => sum + (b.total || 0), 0);
        return <span className="font-bold">{total.toLocaleString()} INR</span>;
      },
    },
    {
      id: "excess",
      header: () => Hint("Credit Balance Addition", "Excess payment that increased the credit balance"),
      cell: ({ row }) => {
        const amt = row.original.amount || 0;
        const bills = row.original.bills || [];
        const billsTotal = bills.reduce((sum, b) => sum + (b.total || 0), 0);
        const excess = Math.max(0, amt - billsTotal);
        return excess > 0 ? (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-300 font-extrabold text-2xs">
            +{excess.toLocaleString()} INR
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "paymentMethod",
      header: () => Hint("Method", "Payment method"),
      cell: ({ row }) => {
        const method = row.original.paymentMethod;
        const other = row.original.otherPaymentMethod;
        return (
          <Badge variant="secondary" className="font-bold text-2xs">
            {method === "OTHER" && other ? other.toUpperCase() : method}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paidBy",
      header: () => Hint("Cleared By", "User who processed the settlement"),
      cell: ({ row }) => {
        const user = row.original.paidBy;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {user?.name || "-"}
            </span>
            <span className="text-2xs text-muted-foreground font-mono">
              {user?.login_id}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "remarks",
      header: () => Hint("Remarks", "Transaction remarks"),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs truncate max-w-[150px] block">
          {row.getValue("remarks") || "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => Hint("Actions", "View bill details"),
      cell: ({ row }) => (
        <Button
          onClick={() => credits.openViewBills(row.original)}
          size="sm"
          variant="outline"
          className="h-7 px-2 cursor-pointer gap-1 font-bold text-2xs"
        >
          <IconEye className="w-3.5 h-3.5" />
          View Bills
        </Button>
      ),
    },
  ];
};
