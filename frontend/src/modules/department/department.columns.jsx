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

export const useDepartmentColumns = (departments) => {
  return [
    {
      accessorKey: "id",
      header: () => Hint("Id", "The academic year of this batch"),
      cell: ({ row }) => <span>{row.getValue("_id")}</span>,
    },
    {
      accessorKey: "name",
      header: () => Hint("Name", "Unique batch code"),
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
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
