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

const statusVariant = {
  draft: 'outline',
  pending: 'secondary',
  in_progress: 'default',
  completed: 'default',
  rejected: 'destructive',
};

export const useOrderColumns = (orders) => {
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
        const canEdit = !isDeleted && order.status === 'draft';
        const canBranchApprove =
          !isDeleted && order.status === 'pending' && order.branchAdminApproval?.status === 'pending';
        const canVpApprove =
          !isDeleted &&
          order.branchAdminApproval?.status === 'approved' &&
          order.vpApproval?.status === 'pending';

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

              {canEdit && (
                <DropdownMenuItem onClick={() => orders.openEdit(order)}>
                  Edit
                </DropdownMenuItem>
              )}

              {canBranchApprove && (
                <DropdownMenuItem onClick={() => orders.openBranchAdminApproval(order)}>
                  Branch Admin Approval
                </DropdownMenuItem>
              )}

              {canVpApprove && (
                <DropdownMenuItem onClick={() => orders.openVpApproval(order)}>
                  VP Approval
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