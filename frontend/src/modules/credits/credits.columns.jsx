import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Hint } from "@/core/utils/tooltip.util";
import formatDate from "@/core/utils/formatdate.util";
import { IconEye } from "@tabler/icons-react";

export const useCreditColumns = (credits) => {
  return [
    {
      accessorKey: "date",
      header: () => Hint("Date", "Transaction date"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
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
            <span>{dept?.name || "Unknown Department"}</span>
            <span className="text-xs text-muted-foreground">
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
        <span className="font-semibold">
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
        return <span>{total.toLocaleString()} INR</span>;
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
          <Badge variant="outline">
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
          <Badge variant="secondary">
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
            <span>{user?.name || "-"}</span>
            <span className="text-xs text-muted-foreground">
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
        <span className="text-muted-foreground truncate max-w-[150px] block">
          {row.getValue("remarks") || "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => Hint("Actions", "More actions"),
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => credits.openViewBills(row.original)}>
              <IconEye className="mr-2 h-4 w-4" />
              View Bills
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
};
