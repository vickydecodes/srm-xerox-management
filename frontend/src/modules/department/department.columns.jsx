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
import formatDate from "@/core/utils/formatdate.util";

export const useDepartmentColumns = (departments) => {
  return [
    {
      accessorKey: "code",
      header: () => Hint("Code", "Department code"),
      cell: ({ row }) => <span>{row.getValue("code")}</span>,
    },
    {
      accessorKey: "name",
      header: () => Hint("Name", "Department name"),
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
    },
    {
      accessorKey: "branch",
      header: () => Hint("Branch", "Associated branch"),
      cell: ({ row }) => {
        const branch = row.getValue("branch");
        return <span>{branch?.name || branch || "-"}</span>;
      },
    },
    {
      accessorKey: "active",
      header: () => Hint("Status", "Whether the department is active"),
      cell: ({ row }) => (
        <Badge variant={row.getValue("active") ? "default" : "outline"}>
          {row.getValue("active") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => Hint("Created", "Department creation date"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
    },
    {
      accessorKey: "outstandingCredit",
      header: () => Hint("Outstanding Credit", "Accumulated credit total"),
      cell: ({ row }) => {
        const amt = row.original.outstandingCredit || 0;
        return (
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            {amt.toLocaleString()} INR
          </span>
        );
      },
    },
    {
      accessorKey: "creditLimit",
      header: () => Hint("Credit Limit", "Maximum credit allocation"),
      cell: ({ row }) => {
        const amt = row.original.creditLimit || 0;
        return <span>{amt.toLocaleString()} INR</span>;
      },
    },
    {
      accessorKey: "actions",
      header: () => Hint("Actions", "Edit or manage this department"),
      cell: ({ row }) => {
        const dept = row.original;
        const isDeleted =
          dept.deleted === true || dept.isDeleted === true || !!dept.deletedAt;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => departments.openView(dept)}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => departments.openEdit(dept)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => departments.openManageCredit(dept)}
              >
                Manage Credit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => departments.openClearCreditByBill(dept)}
              >
                Clear Credit (by Bill)
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  departments.openActiveStatus(dept._id, dept.active)
                }
              >
                {dept.active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onClick={() => departments.openDelete(dept._id)}
              >
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => departments.openErase(dept._id)}
              >
                Erase Permanently
              </DropdownMenuItem>
              {isDeleted && (
                <DropdownMenuItem
                  onClick={() => departments.openRetrieve(dept._id)}
                >
                  Retrieve
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
