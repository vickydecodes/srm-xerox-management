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

export const useServiceColumns = (services) => {
  return [
    {
      accessorKey: "code",
      header: () => Hint("Code", "Auto-generated service code"),
      cell: ({ row }) => <span>{row.getValue("code")}</span>,
    },
    {
      accessorKey: "name",
      header: () => Hint("Name", "Name of the service"),
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
    },
    {
      accessorKey: "unit",
      header: () => Hint("Unit", "Unit of measurement for this service"),
      cell: ({ row }) => <span>{row.getValue("unit")}</span>,
    },
    {
      accessorKey: "price",
      header: () => Hint("Price", "Price of the service"),
      cell: ({ row }) => <span>{row.getValue("price")}</span>,
    },
    {
      accessorKey: "active",
      header: () => Hint("Active", "Whether this service is currently active"),
      cell: ({ row }) => (
        <span>{row.getValue("active") ? "Active" : "Inactive"}</span>
      ),
    },
    {
      accessorKey: "actions",
      header: () => Hint("Actions", "Edit or delete this service"),
      cell: ({ row }) => {
        const service = row.original;
        const isDeleted =
          service.deleted === true ||
          service.isDeleted === true ||
          !!service.deletedAt;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {/* Always visible */}
              <DropdownMenuItem onClick={() => services.openView(service)}>
                View
              </DropdownMenuItem>

              {/* Only when NOT deleted */}
              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => services.openEdit(service)}>
                    Edit
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => services.openActiveStatus(service)}
                  >
                    Active Status
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() =>
                      services.openDelete(service)
                    }
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}

              {/* Only when soft-deleted */}
              {isDeleted && (
                <DropdownMenuItem
                  onClick={() => services.openRetrieve(service.name)}
                >
                  Retrieve
                </DropdownMenuItem>
              )}

              {/* Permanent delete – available in both states */}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => services.openErase(service.id)}
              >
                Erase
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
