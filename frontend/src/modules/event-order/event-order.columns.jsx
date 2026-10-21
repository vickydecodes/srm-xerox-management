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
import formatdate from "@/core/utils/formatdate.util";
import { useAuth } from "@/core/contexts/auth.context";

const statusStyles = {
  draft:
    "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
  pending:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400",
  in_progress:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400",
  ready_for_pickup:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400",
  delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400",
  completed:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400",
  rejected:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400",
};

export const useEventOrderColumns = (eventOrders) => {
  const { user } = useAuth();

  return [
    {
      accessorKey: "code",
      header: () => Hint("Order Code", "Event order identifier code"),
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-primary">
          {row.getValue("code") || "Draft"}
        </span>
      ),
    },
    {
      accessorKey: "eventName",
      header: () => Hint("Event Name", "Official title of the event"),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.getValue("eventName") || "-"}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {row.original?.purpose}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "eventStartDate",
      header: () => Hint("Event Date", "Start date of the scheduled event"),
      cell: ({ row }) => {
        const start = row.getValue("eventStartDate");
        const end = row.original?.eventEndDate;
        if (!start) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="text-sm">
            {formatdate(start)}
            {end && end !== start ? ` → ${formatdate(end)}` : ""}
          </span>
        );
      },
    },
    {
      accessorKey: "department",
      header: () => Hint("Department", "Originating department"),
      cell: ({ row }) => {
        const department = row.getValue("department");
        return <span>{department?.name || department || "-"}</span>;
      },
    },
    {
      accessorKey: "branch",
      header: () => Hint("Branch", "Associated branch / campus"),
      cell: ({ row }) => {
        const branch = row.getValue("branch");
        return <span>{branch?.name || branch || "-"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: () => Hint("Status", "Current processing and approval status"),
      cell: ({ row }) => {
        const status = row.getValue("status");
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
      accessorKey: "createdAt",
      header: () => Hint("Created At", "Order creation timestamp"),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatdate(row.getValue("createdAt"))}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: () => Hint("Actions", "Manage this event order"),
      cell: ({ row }) => {
        const order = row.original;
        const isDeleted = Boolean(order?.deleted || order?.deletedAt);

        const isSuperAdmin = user?.role === "super_admin";
        const isDeptAdmin = user?.role === "department_admin";
        const isBranchAdmin = user?.role === "branch_admin" || user?.role === "manager";
        const isShopOrStaff = user?.role === "shop_admin" || user?.role === "staff";

        const branchStatus = order.branchAdminApproval?.status || "pending";
        const superAdminStatus = order.superAdminApproval?.status || "pending";

        const canSubmit = !isDeleted && order.status === "draft" && (isDeptAdmin || isSuperAdmin);
        const canEdit = !isDeleted && order.status === "draft" && (isDeptAdmin || isSuperAdmin);

        const canBranchApprove =
          !isDeleted &&
          order.status !== "draft" &&
          order.status !== "completed" &&
          branchStatus !== "approved" &&
          isBranchAdmin;

        const canSuperAdminApprove =
          !isDeleted &&
          order.status !== "draft" &&
          order.status !== "completed" &&
          branchStatus === "approved" &&
          isSuperAdmin;

        const canConvertToBill =
          !isDeleted &&
          (order.status === "in_progress" ||
            order.status === "pending" ||
            order.status === "approved") &&
          isShopOrStaff;

        const canDeliver =
          !isDeleted && order.status === "ready_for_pickup" && isShopOrStaff;

        const canProcess =
          !isDeleted &&
          order.status === "pending" &&
          superAdminStatus === "approved" &&
          isShopOrStaff;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => eventOrders.openView(order)}>
                View Details
              </DropdownMenuItem>

              {canSubmit && (
                <DropdownMenuItem onClick={() => eventOrders.submit(order._id)}>
                  Submit Order
                </DropdownMenuItem>
              )}

              {canEdit && (
                <DropdownMenuItem onClick={() => eventOrders.openEdit(order)}>
                  Edit
                </DropdownMenuItem>
              )}

              {canBranchApprove && (
                <DropdownMenuItem
                  onClick={() => eventOrders.openApprovalDialog(order, "branch")}
                >
                  Branch Admin Approval
                </DropdownMenuItem>
              )}

              {canSuperAdminApprove && (
                <DropdownMenuItem
                  onClick={() =>
                    eventOrders.openApprovalDialog(order, "super_admin")
                  }
                >
                  Super Admin Approval
                </DropdownMenuItem>
              )}

              {canProcess && (
                <DropdownMenuItem onClick={() => eventOrders.inProgress(order._id)}>
                  Start Processing
                </DropdownMenuItem>
              )}

              {canConvertToBill && (
                <DropdownMenuItem onClick={() => eventOrders.convertToBill(order)}>
                  Convert to Bill
                </DropdownMenuItem>
              )}

              {canDeliver && (
                <DropdownMenuItem onClick={() => eventOrders.deliver(order._id)}>
                  Mark as Delivered
                </DropdownMenuItem>
              )}

              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  {isDeleted ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => eventOrders.openRetrieve(order._id)}
                      >
                        Retrieve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => eventOrders.openErase(order._id)}
                      >
                        Erase Permanently
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => eventOrders.openDelete(order)}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
