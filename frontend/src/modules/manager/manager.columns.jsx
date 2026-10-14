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

export const useManagerColumns = (managers) => {
  return [
    {
      accessorKey: "login_id",
      header: () => Hint("Login ID", "Auto-generated login ID"),
      cell: ({ row }) => <span>{row.getValue("login_id")}</span>,
    },
    {
      accessorKey: "name",
      header: () => Hint("Name", "Manager name"),
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
    },
    {
      accessorKey: "email",
      header: () => Hint("Email", "Contact email"),
      cell: ({ row }) => <span>{row.getValue("email")}</span>,
    },
    {
      accessorKey: "branch",
      header: () => Hint("Branch", "Assigned branch"),
      cell: ({ row }) => {
        const branch = row.getValue("branch");
        return <span>{branch?.name || branch || "-"}</span>;
      },
    },
    {
      accessorKey: "active",
      header: () => Hint("Status", "Whether this account is active"),
      cell: ({ row }) => (
        <Badge variant={row.getValue("active") ? "default" : "outline"}>
          {row.getValue("active") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "actions",
      header: () => Hint("Actions", "Manage this manager"),
      cell: ({ row }) => {
        const admin = row.original;
        const isDeleted = Boolean(admin?.deleted || admin?.deletedAt);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => managers.openView(admin)}>
                View
              </DropdownMenuItem>

              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => managers.openEdit(admin)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => managers.openResetPassword(admin)}
                  >
                    Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      managers.openActiveStatus(admin._id, !admin.active)
                    }
                  >
                    {admin.active ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => managers.openDelete(admin)}
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              )}

              {isDeleted && (
                <>
                  <DropdownMenuItem
                    onClick={() => managers.openRetrieve(admin._id)}
                  >
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => managers.openErase(admin._id)}
                  >
                    Erase Permanently
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
