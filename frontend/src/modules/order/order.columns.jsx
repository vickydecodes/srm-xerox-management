import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Hint } from "@/core/utils/tooltip.util"
import formatdate from "@/core/utils/formatdate.util"

import { useAuth } from "@/core/contexts/auth.context";
import {
  IconBuildingCommunity,
  IconUsers,
  IconReceipt,
  IconCoin,
  IconClipboardList,
} from "@tabler/icons-react";

const statusVariant = {
  draft: 'outline',
  pending: 'secondary',
  in_progress: 'default',
  completed: 'default',
  rejected: 'destructive',
};

export const useOrderColumns = (orders) => {

  const { user } = useAuth();


  return [
    {
      accessorKey: 'code',
      header: () => Hint('Code', 'Auto-generated order code'),
      cell: ({ row }) => <span>{row.getValue('code') || 'Draft'}</span>,
    },
    {
      accessorKey: 'department',
      header: () => Hint('Department', 'Department that raised this order'),
      cell: ({ row }) => {
        const department = row.getValue('department');
        return <span>{department?.name || department || '-'}</span>;
      },
    },
    {
      accessorKey: 'branch',
      header: () => Hint('Branch', 'Branch this order belongs to'),
      cell: ({ row }) => {
        const branch = row.getValue('branch');
        return <span>{branch?.name || branch || '-'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: () => Hint('Status', 'Current order status'),
      cell: ({ row }) => {
        const status = row.getValue('status');
        return <Badge variant={statusVariant[status] || 'outline'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: () => Hint('Created', 'Order creation date'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatdate(row.getValue('createdAt'))}</span>
      ),
    },
    {
      accessorKey: 'actions',
      header: () => Hint('Actions', 'Manage this order'),
      cell: ({ row }) => {
        const order = row.original;
        const isDeleted = Boolean(order?.deleted || order?.deletedAt);

        const isSuperAdmin = user?.role === "super_admin";
        const isDeptAdmin = user?.role === "department_admin";
        const isBranchAdmin = user?.role === "branch_admin";
        const isShopOrStaff = user?.role === "shop_admin" || user?.role === "staff";

        const branchStatus = order.branchAdminApproval?.status || "pending";
        const superAdminStatus = order.superAdminApproval?.status || "pending";

        // Action permissions
        const canSubmit = !isDeleted && order.status === "draft" && (isSuperAdmin || isDeptAdmin);
        const canEdit = !isDeleted && order.status === "draft" && (isSuperAdmin || isDeptAdmin);
        const canBranchApprove =
          !isDeleted &&
          order.status !== "draft" &&
          order.status !== "completed" &&
          (isSuperAdmin || isBranchAdmin);
        const canSuperAdminApprove =
          !isDeleted &&
          order.status !== "draft" &&
          order.status !== "completed" &&
          branchStatus === "approved" &&
          isSuperAdmin;

        // Shop Admin and Staff (and Super Admin) can convert to bill if approved
        const canConvertToBill =
          !isDeleted &&
          (order.status === "in_progress" || order.status === "pending" || order.status === "approved") &&
          (isSuperAdmin || isShopOrStaff);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => orders.openView(order)}>
                View
              </DropdownMenuItem>

              {canSubmit && (
                <DropdownMenuItem onClick={() => orders.submit(order._id)}>
                  Submit Order
                </DropdownMenuItem>
              )}

              {canEdit && (
                <DropdownMenuItem onClick={() => orders.openEdit(order)}>
                  Edit
                </DropdownMenuItem>
              )}

              {canBranchApprove && (
                <DropdownMenuItem onClick={() => orders.openApprovalDialog(order, "branch")}>
                  Branch Admin Approval
                </DropdownMenuItem>
              )}

              {canSuperAdminApprove && (
                <DropdownMenuItem onClick={() => orders.openApprovalDialog(order, "super_admin")}>
                  Super Admin Approval
                </DropdownMenuItem>
              )}

              {canConvertToBill && (
                <DropdownMenuItem onClick={() => orders.convertToBill(order)}>
                  Convert to Bill
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {isDeleted ? (
                <>
                  <DropdownMenuItem onClick={() => orders.openRetrieve(order._id)}>
                    Retrieve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => orders.openErase(order._id)}
                  >
                    Erase Permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => orders.openDelete(order)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]
}