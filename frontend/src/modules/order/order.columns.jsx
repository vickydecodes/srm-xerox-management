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

const statusStyles = {
  draft: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
  pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400",
  ready_for_pickup: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400",
  completed: "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400",
  rejected: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400",
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
      accessorKey: 'shop',
      header: () => Hint('Shop', 'Shop processing this order'),
      cell: ({ row }) => {
        const shop = row.getValue('shop');
        const status = row.original?.status;
        
        if (!shop) return <span className="text-muted-foreground">-</span>;
        
        const isReady = status === 'ready_for_pickup';
        
        return (
          <div className="flex items-center gap-1.5">
            {isReady && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
            <span className={isReady ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}>
              {shop?.name || shop || '-'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: () => Hint('Status', 'Current order status'),
      cell: ({ row }) => {
        const status = row.getValue('status');
        return (
          <Badge
            variant="outline"
            className={statusStyles[status] || "border-gray-200 text-gray-700"}
          >
            {status ? status.replace(/_/g, " ").toUpperCase() : "-"}
          </Badge>
        );
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

        const canDeliver =
          !isDeleted &&
          order.status === "ready_for_pickup" &&
          (isSuperAdmin || isShopOrStaff);

        const canProcess =
          !isDeleted &&
          order.status === "pending" &&
          superAdminStatus === "approved" &&
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

              {canProcess && (
                <DropdownMenuItem onClick={() => orders.inProgress(order._id)}>
                  Start Processing
                </DropdownMenuItem>
              )}

              {canConvertToBill && (
                <DropdownMenuItem onClick={() => orders.convertToBill(order)}>
                  Convert to Bill
                </DropdownMenuItem>
              )}

              {canDeliver && (
                <DropdownMenuItem onClick={() => orders.deliver(order._id)}>
                  Mark as Delivered
                </DropdownMenuItem>
              )}

              {isSuperAdmin && (
                <>
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]
}