import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Hint } from "@/core/utils/tooltip.util";
import { useAuth } from "@/core/contexts/auth.context";

export const useOrderColumns = (orders) => {
  const { role } = useAuth();

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Draft</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">Approved (Pending Bill)</Badge>;
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">Billed & Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getApprovalBadge = (approval) => {
    const status = approval?.status || "pending";
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-gray-500">Pending</Badge>;
      case "approved":
        return <Badge className="bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return [
    {
      accessorKey: "code",
      header: () => Hint("Order Code", "Unique reference code"),
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs">
          {row.getValue("code") || "DRAFT"}
        </span>
      ),
    },
    {
      accessorKey: "department",
      header: () => Hint("Department", "Requester department"),
      cell: ({ row }) => <span>{row.original.department?.name || "-"}</span>,
    },
    {
      accessorKey: "purpose",
      header: () => Hint("Purpose", "Purpose of requisition"),
      cell: ({ row }) => (
        <span className="truncate max-w-[200px] block">
          {row.getValue("purpose") || "-"}
        </span>
      ),
    },
    {
      id: "totalCost",
      header: () => Hint("Total Cost", "Requisition items value"),
      cell: ({ row }) => {
        const items = row.original.items || [];
        const total = items.reduce(
          (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
          0
        );
        return <span className="font-semibold">{total.toLocaleString()} INR</span>;
      },
    },
    {
      accessorKey: "status",
      header: () => Hint("Status", "Requisition workflow status"),
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "branchAdminApproval",
      header: () => Hint("Branch Admin", "Branch admin approval status"),
      cell: ({ row }) => getApprovalBadge(row.original.branchAdminApproval),
    },
    {
      id: "vpApproval",
      header: () => Hint("VP Approval", "Vice President/Super Admin approval status"),
      cell: ({ row }) => getApprovalBadge(row.original.vpApproval),
    },
    {
      id: "actions",
      header: () => Hint("Actions", "Actions available for this order"),
      cell: ({ row }) => {
        const order = row.original;
        const status = order.status;
        const branchApproved = order.branchAdminApproval?.status === "approved";
        const vpPending = order.vpApproval?.status === "pending" || !order.vpApproval?.status;

        const isCreator = role === "department_admin";
        const isBranchAdmin = role === "branch_admin";
        const isSuperAdmin = role === "super_admin";
        const isBillingStaff = role === "shop_admin" || role === "staff";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => orders.openView(order)}>
                View Details
              </DropdownMenuItem>

              {status === "draft" && (isCreator || isSuperAdmin) && (
                <>
                  <DropdownMenuItem onClick={() => orders.openEdit(order)}>
                    Edit Requisition
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => orders.submit(order._id)}>
                    Submit Requisition
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => orders.openDelete(order._id, order.code || "Draft")}
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}

              {status === "pending" && (isBranchAdmin || isSuperAdmin) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-emerald-600 focus:text-emerald-700"
                    onClick={() => orders.openApprovalDialog(order, "branch", "approved")}
                  >
                    Branch Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => orders.openApprovalDialog(order, "branch", "rejected")}
                  >
                    Branch Reject
                  </DropdownMenuItem>
                </>
              )}

              

              {status === "in_progress" && (isBillingStaff || isSuperAdmin) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100"
                    onClick={() => orders.convertToBill(order)}
                  >
                    Convert to Bill
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
